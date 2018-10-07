from flask import Flask, render_template, jsonify, request
import json
import requests
import datetime
import xml.etree.ElementTree as ET

app = Flask(__name__)

@app.route("/")
def index():
  hueConf = getHueConf()
  return render_template('index.html', hue_username=hueConf['hue_username'], hue_ip=hueConf['hue_ip'])

@app.route("/tablet")
def tablet():
  return render_template(
    'tablet.html', 
    sensors=getSensors('ZLLTemperature'),
    groups=getGroups(),
    forecast=getForecast(1)
  )

@app.route("/scenes")
def scenes():
  return render_template(
    'scenes.html', 
    scenes=getScenes(),
    forecast=getForecast(1)
  )

@app.route("/weather")
def weather():
  return render_template(
    'weather.html', 
    forecasts=getForecast(6)
  )

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

  return jsonify(hueRequest(req['endpoint'], json.loads(req['payload']) if 'payload' in req else None))

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
def getForecast(amount = 1):
  hueConf = getHueConf()

  try:
    weather = ET.parse(hueConf['yr_url'])
  except:
    return None

  forecasts = weather.find("forecast").find('tabular');
  ret = []

  for forecast in forecasts.findall('time'):
    timeObj = datetime.datetime.strptime(forecast.get('from'), '%Y-%m-%dT%H:%M:%S')
    ret.append({
      'time': timeObj.strftime('%H:%M'),
      'symbol': forecast.find('symbol').get('var'),
      'symbol_name': forecast.find('symbol').get('name'),
      'precipitation': forecast.find('precipitation').get('value'),
      'temperature': forecast.find('temperature').get('value'),
      'wind': forecast.find('windSpeed').get('mps'),
      'wind_dir': forecast.find('windDirection').get('code'),
      'wind_name': forecast.find('windSpeed').get('name'),
      'pressure': forecast.find('pressure').get('value')
    })
    print ret
    if (len(ret) == amount):
      return ret

  return ret

# Get groups
def getGroups():
  hueGroups = hueRequest('/groups')
  ret = []
  for groupId, group in hueGroups.items():
    group['id'] = groupId
    ret.append(group)
  return ret

# Get scenes
def getScenes():
  hueConf = getHueConf()
  hueScenes = hueRequest('/scenes')
  ret = []
  for sceneId, scene in hueScenes.items():
    if (scene['owner'] == hueConf['hue_username']):
      scene['id'] = sceneId
      ret.append(scene)
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
