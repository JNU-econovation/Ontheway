import numpy as np

import torch
from torch import optim

import random
from copy import deepcopy

from utils import get_train_data, get_test_data, ndcg, recall
from model import VAE
import os
import time
import pandas as pd
import argparse

import json

os.environ['KMP_DUPLICATE_LIB_OK']='True'
parser = argparse.ArgumentParser()
parser.add_argument('--dataset', type=str)
parser.add_argument('--output_dir', type=str, default='recvae/results')
parser.add_argument('--hidden-dim', type=int, default=600) #600
parser.add_argument('--latent-dim', type=int, default=200) #200
parser.add_argument('--batch-size', type=int, default=500) #500
parser.add_argument('--beta', type=float, default=None)
parser.add_argument('--gamma', type=float, default=0.005)
parser.add_argument('--lr', type=float, default=5e-4)
parser.add_argument('--n-epochs', type=int, default=50)
parser.add_argument('--n-enc_epochs', type=int, default=3)
parser.add_argument('--n-dec_epochs', type=int, default=1)
parser.add_argument('--not-alternating', type=bool, default=False)
parser.add_argument('--mode', type=str, default='train')
parser.add_argument('--topk', type=int, default=20)
args = parser.parse_args()

seed = 1337
random.seed(seed)
np.random.seed(seed)
torch.manual_seed(seed)

#device = torch.device("cuda:0")
device = torch.device("cpu")

if args.mode=='train':
    data = get_train_data(args.dataset)
    train_data, valid_in_data, valid_out_data, test_in_data, test_out_data = data
else:
    practice_data = get_test_data(args.dataset)

def generate(batch_size, device, data_in, data_out=None, shuffle=False, samples_perc_per_epoch=1):
    assert 0 < samples_perc_per_epoch <= 1

    total_samples = data_in.shape[0]
    samples_per_epoch = int(total_samples * samples_perc_per_epoch)

    if shuffle:
        idxlist = np.arange(total_samples)
        np.random.shuffle(idxlist)
        idxlist = idxlist[:samples_per_epoch]
    else:
        idxlist = np.arange(samples_per_epoch)

    for st_idx in range(0, samples_per_epoch, batch_size):
        end_idx = min(st_idx + batch_size, samples_per_epoch)
        idx = idxlist[st_idx:end_idx]

        yield Batch(device, idx, data_in, data_out)


class Batch:
    def __init__(self, device, idx, data_in, data_out=None):
        self._device = device
        self._idx = idx
        self._data_in = data_in
        self._data_out = data_out

    def get_idx(self):
        return self._idx

    def get_idx_to_dev(self):
        return torch.LongTensor(self.get_idx()).to(self._device)

    def get_ratings(self, is_out=False):
        data = self._data_out if is_out else self._data_in
        return data[self._idx]

    def get_ratings_to_dev(self, is_out=False):
        return torch.Tensor(
            self.get_ratings(is_out).toarray()
        ).to(self._device)


def evaluate(model, data_in, data_out, metrics, samples_perc_per_epoch=1, batch_size=500):
    metrics = deepcopy(metrics)
    model.eval()

    for m in metrics:
        m['score'] = []

    for batch in generate(batch_size=batch_size,
                          device=device,
                          data_in=data_in,
                          data_out=data_out,
                          samples_perc_per_epoch=samples_perc_per_epoch
                         ):

        ratings_in = batch.get_ratings_to_dev()
        ratings_out = batch.get_ratings(is_out=True)

        ratings_pred = model(ratings_in, calculate_loss=False).cpu().detach().numpy()

        if not (data_in is data_out):
            ratings_pred[batch.get_ratings().nonzero()] = -np.inf

        for m in metrics:
            m['score'].append(m['metric'](ratings_pred, ratings_out, k=m['k']))

    for m in metrics:
        m['score'] = np.concatenate(m['score']).mean()

    return [x['score'] for x in metrics]


def run(model, opts, train_data, batch_size, n_epochs, beta, gamma, dropout_rate):
    model.train()
    for epoch in range(n_epochs):
        for batch in generate(batch_size=batch_size, device=device, data_in=train_data, shuffle=True):
            ratings = batch.get_ratings_to_dev()

            for optimizer in opts:
                optimizer.zero_grad()

            _, loss = model(ratings, beta=beta, gamma=gamma, dropout_rate=dropout_rate)
            loss.backward()

            for optimizer in opts:
                optimizer.step()

def train():
    model_kwargs = {
        'hidden_dim': args.hidden_dim,
        'latent_dim': args.latent_dim,
        'input_dim': train_data.shape[1]
    }
    metrics = [{'metric': ndcg, 'k': 20}]

    best_ndcg = -np.inf
    train_scores, valid_scores = [], []

    model = VAE(**model_kwargs).to(device)
    model_best = VAE(**model_kwargs).to(device)

    learning_kwargs = {
        'model': model,
        'train_data': train_data,
        'batch_size': args.batch_size,
        'beta': args.beta,
        'gamma': args.gamma
    }

    decoder_params = set(model.decoder.parameters())
    encoder_params = set(model.encoder.parameters())

    optimizer_encoder = optim.Adam(encoder_params, lr=args.lr)
    optimizer_decoder = optim.Adam(decoder_params, lr=args.lr)


    for epoch in range(args.n_epochs):

        if args.not_alternating:
            run(opts=[optimizer_encoder, optimizer_decoder], n_epochs=1, dropout_rate=0.5, **learning_kwargs)
        else:
            run(opts=[optimizer_encoder], n_epochs=args.n_enc_epochs, dropout_rate=0.5, **learning_kwargs)
            model.update_prior()
            run(opts=[optimizer_decoder], n_epochs=args.n_dec_epochs, dropout_rate=0, **learning_kwargs)

        train_scores.append(
            evaluate(model, train_data, train_data, metrics, 0.01)[0]
        )
        valid_scores.append(
            evaluate(model, test_in_data, test_out_data, metrics, 1)[0]
        )

        if valid_scores[-1] > best_ndcg:
            best_ndcg = valid_scores[-1]
            model_best.load_state_dict(deepcopy(model.state_dict()))

        print('epoch {} | valid ndcg@100: {:.5f} | '.format(epoch, valid_scores[-1]) +
              'best valid: {:.5f} | train ndcg@100: {:.5f}'.format(best_ndcg, train_scores[-1]))



    test_metrics = [{'metric': ndcg, 'k': 1},
                    {'metric': ndcg, 'k': 5},
                    {'metric': ndcg, 'k': 10},
                    {'metric': ndcg, 'k': 20},
                    {'metric': ndcg, 'k': 50},
                    {'metric': ndcg, 'k': 100},
                    {'metric': recall, 'k': 1},
                    {'metric': recall, 'k': 5},
                    {'metric': recall, 'k': 10},
                    {'metric': recall, 'k': 20},
                    {'metric': recall, 'k': 50},
                    {'metric': recall, 'k': 100}]

    final_scores = evaluate(model_best, test_in_data, test_out_data, test_metrics)

    for metric, score in zip(test_metrics, final_scores):
        print("{}@{}: \t{:.5f}".format(metric['metric'].__name__, metric['k'], score))

    model_name = time.strftime('%Y-%m-%d-%Mm-%Ss.pt.', time.localtime(time.time()))
    torch.save(model_best.state_dict(), os.path.join('./model', model_name)) # 모델 저장

def predict(model, data_in):
    model.eval()

    batch = generate(batch_size=data_in.shape[0], device=device, data_in=data_in)
    batch = next(batch)

    ratings_in = batch.get_ratings_to_dev()
    ratings_pred = model(ratings_in, calculate_loss=False).cpu().detach().numpy()
    ratings_pred[batch.get_ratings().nonzero()] = -np.inf

    return ratings_pred

def recommend(data, unique_sid, k=20):
    recs = list()
    for i in data:
        topk = np.argsort(i)[::-1][k:] # top k개의  index를 가져옴
        recommend_list = np.zeros(k)
        for tk in range(k):
            recommend_list[tk] = unique_sid[topk[tk]] # sid로 변환하여 할당
        recs.append(recommend_list)
    return recs

def test(data, k=20):
    # 모델 로드
    model_kwargs = {
        'hidden_dim': args.hidden_dim,
        'latent_dim': args.latent_dim,
        'input_dim': data.shape[1]
    }

    PATH = os.path.join('recvae/model',os.listdir('recvae/model')[-1])

    model = VAE(**model_kwargs)
    model.load_state_dict(torch.load(PATH, map_location=device))
    # 데이터 넣기
    pred = predict(model,data)

    uid = dict()
    cnt=0
    with open(os.path.join(args.dataset, 'unique_uid.txt'), 'r') as f:
        for line in f:
            uid[cnt]=int(line.strip())
            cnt+=1

    sid = dict()
    cnt=0
    with open(os.path.join(args.dataset, 'unique_sid.txt'), 'r') as f:
        for line in f:
            sid[cnt]=int(line.strip())
            cnt+=1

    recs = pd.DataFrame(recommend(pred, sid, k),index=uid)
    recs.to_json(os.path.join(args.output_dir, 'result_id.json'))


    id2place = json.loads(open(os.path.join('recvae/datasets/pre_data', 'id2place.json')).read())
    result =json.loads(open(os.path.join(args.output_dir, 'result_id.json')).read())
    data = pd.DataFrame(result)
    recommend_list = list()
    for i in data.T.values:
        recommend_list.append(id2place[str(int(i[0]))])
    results = pd.DataFrame(recommend_list,columns=['place'])
    results.to_json(os.path.join(args.output_dir, 'result.json'))
'''
    results = json.loads(open('results.json').read())
'''

if __name__ == "__main__":
    if args.mode == 'train':
        train()
    elif args.mode == 'test':
        test(practice_data, args.topk)
