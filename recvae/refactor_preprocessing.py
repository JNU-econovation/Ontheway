# tripadvisor dataset preprocessing
import os
import shutil
import sys

import numpy as np
from scipy import sparse
import pandas as pd
import json

def get_count(tp, id):
    playcount_groupbyid = tp[[id]].groupby(id, as_index=False)
    count = playcount_groupbyid.size()
    return count

def filter_triplets(tp, min_uc=5, min_sc=0):
    # Only keep the triplets for items which were clicked on by at least min_sc users.
    if min_sc > 0:
        itemcount = get_count(tp, 'place')
        tp = tp[tp['place'].isin(itemcount.index[itemcount >= min_sc])]

    # Only keep the triplets for users who clicked on at least min_uc items
    # After doing this, some of the items will have less than min_uc users, but should only be a small proportion
    if min_uc > 0:
        usercount = get_count(tp, 'uid')
        tp = tp[tp['uid'].isin(usercount.index[usercount >= min_uc])]

    # Update both usercount and itemcount after filtering
    usercount, itemcount = get_count(tp, 'uid'), get_count(tp, 'place')
    return tp, usercount, itemcount

def load_data(path):
    raw_data = pd.read_json(os.path.join(path, 'tripadvisor.json'), encoding='utf-8')
    raw_data = raw_data.drop_duplicates(['uid', 'place'], keep='first').reset_index()
    print_info(raw_data)

    threshold=0
    feature = ['uid','place','rating']
    raw_data = raw_data[feature]
    raw_data['rating'][raw_data['rating']<=threshold]=0
    raw_data['rating'][raw_data['rating']>threshold]=1
    raw_data, place_dict = place2id(raw_data)
    raw_data = user2id(raw_data)
    return raw_data, place_dict

def load_test_data(data):
    data = list(data.values())
    places = np.array([x['name'] for x in list(data)])
    feature = ['place','uid','rating']
    data = dict()
    data[0] = [x for x in places]
    data = pd.DataFrame(data)
    data['uid']=0
    data['rating']=1
    data.columns = feature
    place2id_ = json.loads(open('recvae/datasets/pre_data/place2id.json').read())[0]
    for i in range(len(data)):
        data.place[i] = place2id_[data.place[i]]
    return data

def place2id(data):
    data = data.copy()
    place_dict = dict()
    i=0
    for place in list(set(data.place)):
        place_dict[place] = i
        i+=1
    for i in range(len(data)):
        data.place[i] = place_dict[data.place[i]]

    place2id_dict = pd.DataFrame(place_dict,index=[0])
    place2id_dict.to_json('recvae/datasets/pre_data/place2id.json',orient='records')
    return data, place_dict

def user2id(data):
    data = data.copy()
    user_dict = dict()
    i=0
    for uid in list(set(data.uid)):
        user_dict[uid] = i
        i+=1
    for i in range(len(data)):
        data.uid[i] = user_dict[data.uid[i]]

    return data

def print_info(data):
    total_user = len(set(data.uid))
    total_item = len(set(data.place))
    n_review = len(data)

    print(f" 전체 사용자: {total_user}")
    print(f" 전체 관광지: {total_item}")
    print(f" 리뷰 수: {n_review}")
    print()
    sparsity = n_review/(total_user*total_item)*100
    print(f" 희소성: {sparsity:.3f}%")

def split_train_test_proportion(data, test_prop=0.2):
    data_grouped_by_user = data.groupby('uid')
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

def numerize(tp, show2id, profile2id):
    sid = list(map(lambda x: show2id[x], tp['place']))
    uid = list(map(lambda x: profile2id[x], tp['uid']))
    value = list(map(lambda x: x, tp['rating']))
    return pd.DataFrame(data={'uid': uid, 'sid': sid, 'value': value}, columns=['uid', 'sid', 'value'])

def pre_unique_sid(data_dir):
    sid = dict()
    cnt=0
    with open(os.path.join(data_dir, 'unique_sid.txt'), 'r') as f:
        for line in f:
            sid[int(line.strip())]=cnt
            cnt+=1
    return sid

def preprocessing(data=None,mode_='test'):
    #mode = 'train'
    mode = mode_
    use_table = 'tripadvisor'    # 'tripadvisor' or 'review'
    min_user_count = 5
    data_dir = "recvae/datasets/raw_data"

    if mode == 'train':
        pro_dir = './datasets/pre_data'#'./datasets/pre_data'"
    if mode == 'test':
        pro_dir = 'recvae/datasets/test'#'./datasets/pre_data'

    if mode == 'train':
        raw_data, place_dict = load_data(data_dir)
    elif mode == 'test':
        raw_data = load_test_data(data)

    raw_data, user_activity, item_popularity = filter_triplets(raw_data, min_uc=min_user_count, min_sc=0)
    sparsity = 1. * raw_data.shape[0] / (user_activity.shape[0] * item_popularity.shape[0])
    print("필터링 후, 방문기록 : %d개 | 사용자: %d | 관광지 : %d (sparsity: %.3f%%)" %
          (raw_data.shape[0], user_activity.shape[0], item_popularity.shape[0], sparsity * 100))
    unique_uid = user_activity.index

    if mode == 'train':
        np.random.seed(98765)
        idx_perm = np.random.permutation(unique_uid.size) # 데이터셋 섞기
        unique_uid = unique_uid[idx_perm]
        n_heldout_users = int(user_activity.shape[0]*0.1)
    elif mode== 'test':
        n_heldout_users = 0

    n_users = unique_uid.size

    tr_users = unique_uid[:(n_users - n_heldout_users)]
    vd_users = unique_uid[(n_users - n_heldout_users * 2): (n_users - n_heldout_users)]
    te_users = unique_uid[(n_users - n_heldout_users):]

    train_plays = raw_data.loc[raw_data['uid'].isin(tr_users)]

    unique_sid = pd.unique(train_plays['place'])

    if mode =='train':
        show2id = dict((sid, i) for (i, sid) in enumerate(unique_sid))
        id2show = dict((i, sid) for (i, sid) in enumerate(unique_sid))
        show2place = dict((place, sid) for (place, sid) in enumerate(list(place_dict)))

        id2show = pd.DataFrame(id2show,index=['show'])
        show2place = pd.DataFrame(show2place,index=['place'])
        id2place = pd.concat([id2show,show2place],axis=0).T
        id2place = id2place[id2place.show.notna()]['place']
        id2place.to_json('./datasets/pre_data/id2place.json')
    elif mode == 'test':
        show2id = pre_unique_sid('recvae/datasets/pre_data')
        unique_sid = show2id.values()
        id2place = json.loads(open('recvae/datasets/pre_data/id2place.json').read())

    profile2id = dict((pid, i) for (i, pid) in enumerate(unique_uid))

    if not os.path.exists(pro_dir):
        os.makedirs(pro_dir)

    with open(os.path.join(pro_dir, 'unique_sid.txt'), 'w') as f:
        for sid in unique_sid:
            f.write('%s\n' % sid)

    with open(os.path.join(pro_dir, 'unique_uid.txt'), 'w') as f:
        for uid in unique_uid:
            f.write('%s\n' % uid)

    ### Save the data into (user_index, item_index) format

    train_plays = train_plays[train_plays['place'].isin(show2id.keys())]
    print(train_plays)
    if mode=='train':
        train_data = numerize(train_plays,show2id, profile2id)
        train_data.to_csv(os.path.join(pro_dir, 'train.csv'), index=False)

        vad_plays = raw_data.loc[raw_data['uid'].isin(vd_users)]
        vad_plays = vad_plays.loc[vad_plays['place'].isin(unique_sid)]

        vad_plays, _, _ = filter_triplets(vad_plays, min_uc=min_user_count, min_sc=0)

        vad_plays_tr, vad_plays_te = split_train_test_proportion(vad_plays)

        test_plays = raw_data.loc[raw_data['uid'].isin(te_users)]
        test_plays = test_plays.loc[test_plays['place'].isin(unique_sid)]

        test_plays_tr, test_plays_te = split_train_test_proportion(test_plays)

        test_plays, _, _ = filter_triplets(test_plays, min_uc=min_user_count, min_sc=0)

        vad_data_tr = numerize(vad_plays_tr,show2id, profile2id)
        vad_data_tr.to_csv(os.path.join(pro_dir, 'validation_tr.csv'), index=False)

        vad_data_te = numerize(vad_plays_te,show2id, profile2id)
        vad_data_te.to_csv(os.path.join(pro_dir, 'validation_te.csv'), index=False)

        test_data_tr = numerize(test_plays_tr,show2id, profile2id)
        test_data_tr.to_csv(os.path.join(pro_dir, 'test_tr.csv'), index=False)

        test_data_te = numerize(test_plays_te,show2id, profile2id)
        test_data_te.to_csv(os.path.join(pro_dir, 'test_te.csv'), index=False)
    elif mode=='test':
        train_data = numerize(train_plays,show2id, profile2id)
        train_data.to_csv(os.path.join('recvae/datasets/test', 'train.csv'), index=False)
