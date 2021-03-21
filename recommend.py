import time
from recvae import refactor_preprocessing as rp
import json
import os

def result(data):
    rp.preprocessing(data)
    test = 'python recvae/run.py --dataset "recvae/datasets/test" --mode="test" --topk=20'
    time.sleep(2)
    os.system(test)
    path = 'recvae/results/result.json'
    return json.loads(open(path).read())

def train():
    rp.preprocessing(data, 'train')
    train = 'python run.py --dataset "datasets/pre_data"'
    time.sleep(30)
    os.system(train)

'''
data = {'0': {'name': '경주 사찰', 'lat': 34.3606378, 'lon': 126.6622321},
        '1': {'name': '경주 남산', 'lat': 34.4180885, 'lon': 126.6303609},
        '3': {'name': '경주 서출지', 'lat': 34.3107464, 'lon': 126.7644206},
        '4': {'name': '경주세계문화엑스포공원', 'lat': 34.3107464, 'lon': 126.7644206},
        '5': {'name': '경주역사유적지구', 'lat': 34.3107464, 'lon': 126.7644206},
}

train()
print(result(data))
'''
