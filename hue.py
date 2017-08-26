from flask import Flask, render_template
import json

app = Flask(__name__)

@app.route("/")
def index():
  with open('conf.json') as data_file:    
    hueconf = json.load(data_file)
    hue_username = hueconf['username']
    hue_ip= hueconf['ip']

  return render_template('index.html', hue_username=hue_username, hue_ip=hue_ip)

@app.route("/scenes")
def scenes():
  with open('conf.json') as data_file:    
    hueconf = json.load(data_file)
    hue_username = hueconf['username']
    hue_ip= hueconf['ip']

  return render_template('scenes.html', hue_username=hue_username, hue_ip=hue_ip)

@app.route("/sensors")
def sensors():
  with open('conf.json') as data_file:    
    hueconf = json.load(data_file)
    hue_username = hueconf['username']
    hue_ip= hueconf['ip']

  return render_template('sensors.html', hue_username=hue_username, hue_ip=hue_ip)

if __name__ == "__main__":
  app.run(host='0.0.0.0', port=80, debug=True)
