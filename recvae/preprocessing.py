# based on https://github.com/dawenl/vae_cf

import os
import sys

import numpy as np
from scipy import sparse
import pandas as pd

import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--dataset', type=str)
parser.add_argument('--model_dataset', type=str, default=None)
parser.add_argument('--output_dir', type=str)
parser.add_argument('--mode', type=str, default='train')
parser.add_argument('--min_items_per_user', type=int, default=5)
parser.add_argument('--min_users_per_item', type=int, default=0)

args = parser.parse_args()

data_dir = args.dataset
output_dir = args.output_dir
mode = args.mode
min_uc = args.min_items_per_user
min_sc = args.min_users_per_item

post = pd.read_json(os.path.join(data_dir, 'post.json'), encoding='utf-8')
post.head()

review = pd.read_json(os.path.join(data_dir, 'post.json'), encoding='utf-8')
feature = ['user_id','stamp_id',]
review = review[feature]
review.head()

raw_data = pd.read_json(os.path.join(data_dir, 'user_stamp.json'), encoding='utf-8')
raw_data = pd.concat([raw_data,review],axis=0)
raw_data = raw_data.drop_duplicates(['user_id', 'stamp_id'], keep='first')
raw_data

def get_count(tp, id):
    playcount_groupbyid = tp[[id]].groupby(id, as_index=False)
    count = playcount_groupbyid.size()
    return count

def filter_triplets(tp, min_uc=5, min_sc=0):
    # Only keep the triplets for items which were clicked on by at least min_sc users.
    if min_sc > 0:
        itemcount = get_count(tp, 'stamp_id')
        tp = tp[tp['stamp_id'].isin(itemcount.index[itemcount >= min_sc])]

    # Only keep the triplets for users who clicked on at least min_uc items
    # After doing this, some of the items will have less than min_uc users, but should only be a small proportion
    if min_uc > 0:
        usercount = get_count(tp, 'user_id')
        tp = tp[tp['user_id'].isin(usercount.index[usercount >= min_uc])]

    # Update both usercount and itemcount after filtering
    usercount, itemcount = get_count(tp, 'user_id'), get_count(tp, 'stamp_id')
    return tp, usercount, itemcount

def split_train_test_proportion(data, test_prop=0.2):
    data_grouped_by_user = data.groupby('user_id')
    tr_list, te_list = list(), list()

    np.random.seed(98765)

    for i, (_, group) in enumerate(data_grouped_by_user):
        n_items_u = len(group)
        idx = np.zeros(n_items_u, dtype='bool')
        te_size = 1
        if n_items_u >= 5:
            te_size = int(test_prop * n_items_u)

        idx[np.random.choice(n_items_u, size=te_size, replace=False).astype('int64')] = True
        tr_list.append(group[np.logical_not(idx)])
        te_list.append(group[idx])

        if i % 1000 == 0:
            print("%d users sampled" % i)
            sys.stdout.flush()

    data_tr = pd.concat(tr_list)
    data_te = pd.concat(te_list)

    return data_tr, data_te

def numerize(tp):
    uid = list(map(lambda x: profile2id[x], tp['user_id']))
    sid = list(map(lambda x: show2id[x], tp['stamp_id']))
    return pd.DataFrame(data={'uid': uid, 'sid': sid}, columns=['uid', 'sid'])

def pre_unique_sid():
    sid = dict()
    cnt=0
    with open(os.path.join(args.model_dataset, 'unique_sid.txt'), 'r') as f:
        for line in f:
            sid[int(line.strip())]=cnt
            cnt+=1
    return sid

raw_data, user_activity, item_popularity = filter_triplets(raw_data, min_uc=min_uc, min_sc=min_sc)

sparsity = 1. * raw_data.shape[0] / (user_activity.shape[0] * item_popularity.shape[0])

print("After filtering, there are %d watching events from %d users and %d attractions (sparsity: %.3f%%)" %
      (raw_data.shape[0], user_activity.shape[0], item_popularity.shape[0], sparsity * 100))

unique_uid = user_activity.index

if mode == 'train':
    np.random.seed(98765)
    idx_perm = np.random.permutation(unique_uid.size)
    unique_uid = unique_uid[idx_perm]
    n_heldout_users = int(user_activity.shape[0]*0.1)
elif mode == 'test':
    n_heldout_users = 0

# create train/validation/test users
n_users = unique_uid.size

tr_users = unique_uid[:(n_users - n_heldout_users * 2)]
vd_users = unique_uid[(n_users - n_heldout_users * 2): (n_users - n_heldout_users)]
te_users = unique_uid[(n_users - n_heldout_users):]

train_plays = raw_data.loc[raw_data['user_id'].isin(tr_users)]


if mode=='train':
    unique_sid = pd.unique(train_plays['stamp_id'])
    show2id = dict((sid, i) for (i, sid) in enumerate(unique_sid))
elif mode=='test':
    show2id = pre_unique_sid()
    unique_sid = show2id.values()

profile2id = dict((pid, i) for (i, pid) in enumerate(unique_uid))

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(os.path.join(output_dir, 'unique_sid.txt'), 'w') as f:
    for sid in unique_sid:
        f.write('%s\n' % sid)

with open(os.path.join(output_dir, 'unique_uid.txt'), 'w') as f:
    for uid in unique_uid:
        f.write('%s\n' % uid)

train_plays = train_plays[train_plays['stamp_id'].isin(unique_sid)]

train_data = numerize(train_plays)
train_data.to_csv(os.path.join(output_dir, 'train.csv'), index=False)
if mode=='train':
    vad_plays = raw_data.loc[raw_data['user_id'].isin(vd_users)]
    vad_plays = vad_plays.loc[vad_plays['stamp_id'].isin(unique_sid)]

    vad_plays_tr, vad_plays_te = split_train_test_proportion(vad_plays)

    test_plays = raw_data.loc[raw_data['user_id'].isin(te_users)]
    test_plays = test_plays.loc[test_plays['stamp_id'].isin(unique_sid)]

    test_plays_tr, test_plays_te = split_train_test_proportion(test_plays)

    vad_data_tr = numerize(vad_plays_tr)
    vad_data_tr.to_csv(os.path.join(output_dir, 'validation_tr.csv'), index=False)

    vad_data_te = numerize(vad_plays_te)
    vad_data_te.to_csv(os.path.join(output_dir, 'validation_te.csv'), index=False)

    test_data_tr = numerize(test_plays_tr)
    test_data_tr.to_csv(os.path.join(output_dir, 'test_tr.csv'), index=False)

    test_data_te = numerize(test_plays_te)
    test_data_te.to_csv(os.path.join(output_dir, 'test_te.csv'), index=False)
