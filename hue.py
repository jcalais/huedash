from flask import Flask, render_template, jsonify, request
import json
import requests
import xml.etree.ElementTree as ET

app = Flask(__name__)

@app.route("/")
def index():
  hueConf = getHueConf()
  return render_template('index.html', hue_username=hueConf['hue_username'], hue_ip=hueConf['hue_ip'])

@app.route("/tablet")
def tablet():
  hueConf = getHueConf()
  return render_template(
    'tablet.html', 
    hue_username=hueConf['hue_username'], 
    hue_ip=hueConf['hue_ip'], 
    sensors=getSensors('ZLLTemperature'),
    groups=getGroups(),
    forecast=getForecast()
  )

@app.route("/scenes")
def scenes():
  return render_template('scenes.html', hue_username=hueConf['hue_username'], hue_ip=hueConf['hue_ip'])

@app.route("/room/<roomId>")
def room(roomId):
  hueConf = getHueConf()

  return render_template('room.html',
    hue_username=hueConf['hue_username'],
    hue_ip=hueConf['hue_ip'],
    lights=getLights(roomId),
    group=getGroup(roomId)
  )

@app.route("/sensors")
def sensors():
  hueConf = getHueConf()
  return render_template('sensors.html', hue_username=hueConf['hue_username'], hue_ip=hueConf['hue_ip'])

@app.route("/hueapigateway", methods=['POST'])
def hueApiGateway():
  req = request.form
  return jsonify(hueRequest(req['endpoint'], json.loads(req['payload'])))

# Get all lights in a specific room
def getLights(room_id):
  room_data = hueRequest('/groups/' + room_id)
  lights_id_list = []
  lights_in_room = []
  for light in room_data['lights']:
    lights_id_list.append(light)
  all_lights = hueRequest('/lights')
  for light_id,light_data in all_lights.items():
    if light_id in lights_id_list:
      light_data['id'] = light_id
      lights_in_room.append(light_data)
  return lights_in_room

# Get forecast from yr.no
def getForecast():
  hueConf = getHueConf()
  weather = ET.parse(hueConf['yr_url'])
  forecast = weather.find("forecast").find('tabular').find('time');
  return {
    'symbol': forecast.find('symbol').get('var'),
    'precipitation': forecast.find('precipitation').get('value'),
    'temperature': forecast.find('temperature').get('value'),
    'wind': forecast.find('windSpeed').get('mps')
  }
  return {
    'symbol': '04',
    'precipitation': '1.2',
    'temperature': '-6',
    'wind': '1.7'
  }

# Get groups
def getGroups():
  hueGroups = hueRequest('/groups')
  ret = []
  for groupId, group in hueGroups.items():
    group['id'] = groupId
    ret.append(group)
  return ret

def getGroup(groupId):
  hueGroup = hueRequest('/groups/' + groupId)
  hueGroup['id'] = groupId
  return hueGroup

# Get sensors from Hue Hub
def getSensors(sensorType):
  hueSensors = hueRequest('/sensors')
  ret = []
  for sensorId, sensor in hueSensors.items():
    if sensor['type'] == sensorType:
      sensor['id'] = sensorId
      ret.append(sensor)
  return ret

# Perform an arbitrary request against the hue api.
def hueRequest(endpoint, payload = None):
  hueConf = getHueConf()
  hueBaseUrl = 'http://' + hueConf['hue_ip'] + '/api/' + hueConf['hue_username']
  hueRequestUrl = hueBaseUrl + endpoint
  if payload == None:
    response = requests.get(hueRequestUrl)
  else:
    # We are assuming put method if there is a payload.
    response = requests.put(hueRequestUrl, json=payload)
  return response.json()

# Fetch config from file.
def getHueConf():
  with open('conf.json') as data_file:    
    hueConf = json.load(data_file)
    return {
      'hue_username': hueConf['username'], 
      'hue_ip': hueConf['ip'],
      'yr_url': hueConf['yr_url']
    }

if __name__ == "__main__":
  app.run(host='0.0.0.0', port=80, debug=True)
