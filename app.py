from flask import Flask, render_template, request
app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
def home():
    return render_template('index.html')

@app.route('/search', methods=['POST', 'GET'])
def search():
    return render_template('search.html')

@app.route('/map', methods=['POST', 'GET'])
def map():
    # if request.method == 'POST':
    #     data = request.form[]
    
    return render_template('map.html')

@app.route('/result', methods=['POST', 'GET'])
def result():
    return render_template('result.html')

if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)