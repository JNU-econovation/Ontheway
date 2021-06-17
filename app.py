from flask import Flask, render_template, request, redirect
import search, recPath, search_province
import json
import numpy
import time
import requests
from copy import deepcopy

search_attraction = search.Search()
search_area = search_province.Search()

app = Flask(__name__)
@app.route('/', methods=['POST', 'GET']) # 1번째 페이지
def home():
    return render_template('index.html')

@app.route('/main', methods=['POST']) # 2번째 페이지
def main():
    # where = request.form['option']
    res = request.get_json()
    print(res)
    return render_template('search.html', where=res)

@app.route('/map', methods=['POST']) # 3번째 페이지
def map():
    if request.method == 'POST':
        res = request.get_json()
        res2 = deepcopy(res)

        d = res['place']

        tempData = {
            0: {"name": "경복궁", "lat": 37.579617, "lon": 126.974847},
            1: {"name": "서울대공원", "lat": 37.4275247, "lon": 127.0148312},
            2: {"name": "해운대", "lat": 35.1769654, "lon": 129.1033879},
            3: {"name": "부산 해양자연사 박물관", "lat": 35.2217996, "lon": 129.0736964},
            4: {"name": "경주월드", "lat": 35.837106, "lon": 129.2801082}
        }

        leng = len(d)
        if leng < 5:
            idx = 0
            while len(d) < 5:
                d[leng] = tempData[idx]
                idx += 1
                leng += 1
            res['place'] = d

        url = 'http://15.164.170.114/recommend'
        rec = requests.post(url, json=res)
        print(json.loads(rec.content))
        # rec = {'0': {'name': '경복궁', 'lat': '37.579617', 'lon': '126.974847'}, '1': {'name': '창덕궁', 'lat': '37.5823645', 'lon': '126.9907841'}, '2': {'name': '롯데월드', 'lat': '37.5125971', 'lon': '127.1003451'}, '3': {'name': '잠실종합운동장', 'lat': '37.5148406', 'lon': '127.0709184'}, '4': {'name': '잠실 야구 경기장', 'lat': '37.5122579', 'lon': '127.0697071'}}
        return render_template('map.html', data = res2, rec = json.loads(rec.content))

@app.route('/api/search', methods=['POST'])
def post():
    keyword = request.form['searchKeyword']
    suggestions = dict()
    try:
        suggestions = search_attraction.suggest(keyword)
    except:
        pass
    return dict(suggestions)

@app.route('/api/area', methods=['POST'])
def area():
    keyword = request.form['searchKeyword']
    suggestions = dict()
    try:
        suggestions = search_area.suggest(keyword)
    except:
        pass
    
    return dict(suggestions)

@app.route('/api/path', methods=['POST'])
def path():
    res = request.get_json()
    print(res)
    key_path, travel_min_len, path_info = recPath.rec_path(res)
    print('🤍', key_path)

    output=dict()
    n=0
    for key in key_path:
        idx = int(key) - 1
        output[n] = res[str(idx)]
        n += 1

    return {'path': output}

@app.route('/result', methods=['POST', 'GET']) # 4번째 페이지
def result():
    if request.method == "POST":
        res = request.get_json()
        print("result: ",res)
        return render_template('result.html', data = res)
    return render_template('result.html')

if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
