from flask import Flask, render_template, request, redirect
import search
import json

search_attraction = search.Search()

app = Flask(__name__)
@app.route('/', methods=['POST', 'GET']) # 1번째 페이지
def home():
    return render_template('index.html')

@app.route('/search', methods=['POST', 'GET']) # 2번째 페이지
def search():
    if request.method =='GET':
        return render_template('search.html')
    elif request.method =='POST':
        print('post 실행')
        keyword = request.form['searchKeyword']
        print(keyword)
        suggestions = search_attraction.suggest(keyword)
        return suggestions

@app.route('/map', methods=['POST', 'GET']) # 3번째 페이지
def map():
    if request.method == 'POST':
        # print(request.form['item[who]'])

        return render_template('map.html', data = "hi")
    elif request.method == 'GET':

        return render_template('map.html')

@app.route('/result', methods=['POST', 'GET']) # 4번째 페이지
def result():
    return render_template('result.html')

if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
