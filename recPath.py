from queue import PriorityQueue

import json
import requests as req
import numpy as np


class SSTNode:
    def __init__(self, level):
        self.level = level
        self.path = []
        self.bound = 0

    def contains(self, x):
        for i in range(len(self.path)):
            if (self.path[i]==x):
                return True
        return False

def __lt__(self, other):
    return self.bound < other.bound

class Travel():
    def __init__(self):
        self.matrix = None
        self.min_length = None
        self.opt_path = None

    def calculate(self, matrix):
        self.opt_length=None
        self.matrix = matrix
        self.min_length = np.inf

        if len(matrix)>=4:
            n = len(matrix) - 1
            PQ = PriorityQueue()
            v = SSTNode(0)
            v.path = [1]
            v.bound = self.bound(v, self.matrix)
            PQ.put((v.bound, v))

            while (not PQ.empty()):
                v = PQ.get()[1]
                if (v.bound < self.min_length):
                    for i in range(2, n + 1):
                        if (v.contains(i)):
                            continue
                        u = SSTNode(v.level + 1)
                        u.path = v.path[:]
                        u.path.append(i)
                        if (u.level == n - 2):
                            for k in range(2, n + 1):
                                if (not u.contains(k)):
                                    u.path.append(k)

                            u.path.append(1)
                            if (self.length(u.path, matrix) < self.min_length):
                                self.min_length = self.length(u.path, self.matrix)
                                self.opt_path = u.path[:]

                        else:
                            u.bound = self.bound(u, self.matrix)
                            if (u.bound < self.min_length):
                                PQ.put((u.bound, u))

    def bound(self, v, matrix):
        n = len(matrix) - 1
        total = self.length(v.path, matrix)
        for i in range(1, n + 1):
            if (self.hasOutgoing(i, v.path)):
                continue
            minimum = np.inf
            for j in range(1, n + 1):
                if (i == j): continue
                if (self.hasIncoming(j, v.path)): continue
                if (j == 1 and i == v.path[len(v.path) - 1]): continue
                if (minimum > matrix[i][j]): minimum = matrix[i][j]
            total += minimum
        return total

    def length(self, path, matrix):
        total = 0
        prev = 1
        for i in range(len(path)):
            if (i != 0):
                prev = path[i - 1]
            total += matrix[prev][path[i]]
            prev = path[i]
        return total

    def hasOutgoing(self, v, path):
        for i in range(0, len(path) - 1):
            if (path[i] == v):
                return True
        return False

    def hasIncoming(self, v, path):
        for i in range(1, len(path)):
            if (path[i] == v):
                return True
        return False

url = 'https://apis.openapi.sk.com/tmap/routes'
key = 'l7xx83768f291b6a4be198e3b6e5b3ec6280'
headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8',
    'appKey': key,
    'version': '1',
    'callback': 'result'
}

def tmap_post(start,end, headers=headers):
    start_y, start_x = start
    end_y, end_x = end
    data = {
        "startX" : str(start_x),
        "startY" : str(start_y),
        "endX" : str(end_x),
        "endY" : str(end_y),
        "reqCoordType" : "WGS84GEO",
        "searchOption" : "2",
        "trafficInfo" : "N"
    }
    data = json.dumps(data)
    res = req.post(url, headers=headers,data=data)
    data = json.loads(res.content)
    return data

def construct_matrix(poses):
    size = len(poses)
    matrix = np.full((size+1 ,size+1 ),np.inf)
    matrix_info = np.full((size,size),dict())
    for start in range(size):
        poses_ = np.where(poses!=poses[start],poses,-np.inf)
        for end in range(size):
            condition = (poses_[end]!=[-np.inf,-np.inf]).all()
            if condition:
                while(1):
                    try:
                        matrix_info[start][end] = tmap_post(poses[start],poses_[end])
                        total_time = matrix_info[start][end]
                        total_time = total_time['features'][0]['properties']['totalTime']/60
                    except:
                        print('API 수집오류 발생, 재시도')
                    break
                matrix[start+1][end+1] = total_time
            else:
                matrix[start+1][end+1] = 0

    return matrix, matrix_info

def pick_path_info(matrix_info, opt_path):
    path_info = list()
    for i in range(len(opt_path)-1):
        node = opt_path[i]-1
        next_node = opt_path[i+1]-1
        path_info.append(matrix_info[node][next_node])
        # path_places.append(places[node])
    return path_info

def rec_path(data):
    data = list(data.values())
    places = np.array([x['name'] for x in data])
    poses = np.array([[float(x['lat']), float(x['lon'])] for x in data])
    matrix, matrix_info = construct_matrix(poses)
    travel = Travel()
    travel.calculate(matrix)
    path_info = pick_path_info(matrix_info, travel.opt_path)
    opt_path = [str(x) for x in travel.opt_path]
    # print(path_places)
    return opt_path, travel.min_length, path_info # 경로, 최소시간, 경로 정보

# if __name__ == "__main__":

#     data = {'0': {'name': '완도 수목원', 'lat': 34.3606378, 'lon': 126.6622321}, '1': {'name': '완도 청해포구촬영장', 'lat': 34.4180885, 'lon': 126.6303609}, '2': {'name': '완도타워', 'lat': 34.3107464, 'lon': 126.7644206}, }

#     path_places, travel_min_length, path_info = rec_path(data)
#     print("경로 =",path_places)
#     print("걸리는 시간 =",travel_min_length)
