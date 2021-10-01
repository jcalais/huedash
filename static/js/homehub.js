$(function() {
  $('.js-hue-scenes').initHueScenes();
  $('.js-hue-rooms').initHueGroups();
  $('.js-hue-sensors').initHueSensors();
});

$.fn.initHueGroups = function() {
  var $hueGroupContainer = $(this);
  $.get(getHueApiBaseUrl() + '/groups', function(rooms) {
    $.get(getHueApiBaseUrl() + '/lights', function(lightData) {
      $.each(rooms, function(roomId, roomData) {
        $hueGroupContainer.addRoom(roomId, roomData, lightData);
      });
    }, 'json');
  }, 'json');
};

$.fn.addRoom = function(roomId, room, lights) {
  var $container = $(this);
  var $ul = $(this).children('ul');
  var $tabData = $(this).children('div.tab-content');
  var lampSliders = [];
  var isFirst = $ul.children('li').length === 0;

  var roomState = room.state.any_on == true ? 'teal' : 'grey';
  roomState = room.state.all_on == true ? 'yellow' : roomState;

  $ul.append('<li class="' + (isFirst ? ' active' : '') + '"><a href="#room' + roomId + '" data-toggle="tab"><span class="hidden-xs">' + room.name + '</span><span class="hidden-sm hidden-md hidden-lg">' + room.name.substr(0,4) + '</span> <span class="hidden-xs badge bg-' + roomState + '"><i class="ion ion-ios-lightbulb"></i></span></a></li>');
  var $room = $('<div class="tab-pane box-body no-padding' + (isFirst ? ' active' : '') + '" id="room' + roomId + '" data-room-id="' + roomId + '"><table class="table"><tbody></tbody></table></div>');
  $room.addLight(null, room);
  $.each(room.lights, function(idx, lightId) {
    $room.addLight(lightId, lights[lightId]);
  });
  $tabData.append($room);
  $('tr', $room).each(function() {
    $(this).addSlider();
  });
};

$.fn.addSlider = function() {
  var $light = $(this);
  var $slider = $('.lamp-slider', $light);
  var slider = document.getElementById($slider.attr('id'));
  var brightness = $slider.data('brightness');
  var $brightness = $('.hue-brightness span', $light);
  noUiSlider.create(slider, {
    start: brightness,
    range: {
      'min': 0,
      'max': 100
    },
  });
  slider.noUiSlider.on('change', function(values, handle) {
    $light.setLight('slider');
  });
  slider.noUiSlider.on('slide', function(values, handle) {
    var $tr = $slider.parents('tr');
    $('.badge', $tr).html(Math.round(values));
    // If we're adjusting the room slider or state, replicate state to all.
    if ($tr.data('type') == 'room') {
      $tr.siblings('tr').each(function() {
        $row = $(this);
        $('.hue-brightness span', $row).html($('.badge', $tr).html());
        var sliderId = $('.lamp-slider', $row).attr('id');
        document.getElementById(sliderId).noUiSlider.set(values);
      });
    }
  });
  $brightness.click(function() {
    var newState = $(this).data('state') == 'on' ? 'off' : 'on';
    $(this).data('state', newState);
    var $tr = $(this).parents('tr');
    // If we're turning on/off the whole room, spread the state to all lights.
    if ($tr.data('type') == 'room') {
      $tr.siblings('tr').each(function() {
        $row = $(this);
        $('.hue-brightness span', $row).removeClass('bg-' + (newState == 'on' ? 'grey' : 'yellow'));
        $('.hue-brightness span', $row).addClass('bg-' + (newState == 'on' ? 'yellow' : 'grey'));
        $('.hue-brightness span', $row).data('state', newState);
      });
    }
    $light.setLight('button');
  });
};

/**
 * Adds a light row to a table. If lightId is missing, assumed to be whole room.
 */
$.fn.addLight = function(lightId, obj) {
  var $room = $(this);
  var roomId = $room.data('room-id');
  var sliderId = 'lamp_sliders_' + roomId + (lightId ? '_' + lightId : '');
  var $roomTable = $room.find('tbody');
  if (lightId) {
    var brightness = Math.round(briToPercentage(obj.state.bri));
    var lightState = obj.state.on == true ? 'on' : 'off';
  }
  else {
    var lightState = obj.state.all_on == true ? 'on' : 'off';
    var brightness = 50;
  }
  
  $roomTable.append('<tr data-id="' + (lightId ? lightId : roomId) + '" data-type="' + (lightId ? 'light' : 'room') + '">' + 
  '<td><div class="lamp-name"><h4>' + obj.name + ' <small>(' + (lightId ? lightId : roomId) + ')</small>' + '</h4></div><div class="lamp-slider" id="'+ sliderId  + '" data-brightness="' + brightness + '"></div></td>' + 
  '<td class="hue-brightness"><span class="badge bg-' + (lightState == 'on' ? 'yellow' : 'grey') + '" data-state="' + lightState + '">' + brightness + '</span></td>' + 
  '</tr>');
};

/**
 * Set light/room state and brightness.
 */
$.fn.setLight = function(origin) {
  var $light = $(this);
  var isRoom = $light.data('type') == 'room';
  var id = $light.data('id');
  var $brightness = $('.hue-brightness span', $light);
  var state = $brightness.data('state');
  var data = {};
  if (origin == 'slider') {
    data.bri = percentageToBri($brightness.html())
  }
  if (origin == 'button') {
    data.on = state == 'on' ? true : false
  }
  var url = getHueApiBaseUrl() + '/' + (isRoom ? 'groups' : 'lights') + '/' + id + '/' + (isRoom ? 'action' : 'state');
  $.ajax({
    'url': url,
    'type': 'put',
    'data': JSON.stringify(data),
    'success': function(data) {
      $brightness.addClass(state == 'on' ? 'bg-yellow' : 'bg-grey');
      $brightness.removeClass(state == 'on' ? 'bg-grey' : 'bg-yellow');
    }
  });
};

/**
 * Retrieves all the scenes from the hue api.
 */
$.fn.initHueScenes = function() {
  $sceneContainer = $(this);
  $.get(getHueApiBaseUrl() + '/scenes', function(scenes) {
    $.each(scenes, function(sceneId, scene) {
      if (scene.owner == getHueUser()) {
        $('.big-buttons', $sceneContainer).addScene(sceneId, scene);
        $('.small-buttons', $sceneContainer).addScene(sceneId, scene);
      }
    });
  }, 'json');
};

/**
 * Adds a scene button to the dom.
 */
$.fn.addScene = function(sceneId, scene) {
  var $button;
  if ($(this).hasClass('big-buttons')) {
    $button = $('<a class="btn btn-app js-hue-scene hidden-xs" href="#" data-scene-id="' + sceneId + '"><span class="badge bg-orange">' + scene.lights.length + '</span><i class="fa fa-heart-o"></i>' + scene.name + '</a>');
  }
  else {
    $button = $('<button type="button" class="btn btn-sm btn-default js-hue-scene" data-scene-id="' + sceneId + '">' + scene.name.substr(0,10) + '</small></button>');
  }
  
  $(this).append($button);
  $button.click(function() {
    $(this).setScene();
  });
}

/**
 * Recalls a specific scene.
 */
$.fn.setScene = function() {
  var sceneId = $(this).data('scene-id');
  var $button = $(this);
  var url = getHueApiBaseUrl() + '/groups/0/action';
  var data = {'scene': sceneId}
  $.ajax({
    'url': url,
    'type': 'put',
    'data': JSON.stringify(data),
    'success': function(data) {
      $button.siblings('.btn').removeClass('bg-yellow');
      $button.addClass('bg-yellow');
    }
  });
  
};

/**
 * Inits the sensors.
 */
$.fn.initHueSensors = function() {
  $sensorContainer = $(this);
  $.get(getHueApiBaseUrl() + '/sensors', function(sensors) {
    $.each(sensors, function(sensorId, sensor) {
      switch (sensor.type) {
        case 'ZLLTemperature':
          console.log(sensor);
          $sensorContainer.addSensor(sensorId, sensor);
        break;
      }
    });
  });
};

$.fn.addSensor = function(sensordId, sensor) {
  var $sensor;
  $sensor = $('<div class="col-lg-3 col-xs-12"><div class="small-box bg-aqua"><div class="inner"><h3>' + getHueTemperature(sensor.state.temperature) + '&deg;C</h3><p>' + sensor.name + '</p><p><small>Battery: ' + sensor.config.battery + '%</small></p></div><div class="icon"><i class="ion ion-thermometer"></i></div></div></div>');
  $(this).append($sensor);
};

function getHueApiBaseUrl() {
  var hue_user = getHueUser();
  var hue_ip = $('.js-hue-config').data('hue-ip');
  if (hue_user && hue_ip) {
    return 'https://' + hue_ip + '/api/' + hue_user;
  }
  return false;
}

function getHueUser() {
  if ($('.js-hue-config')) {
    return $('.js-hue-config').data('hue-user');
  }
  return false;
}

function getHueTemperature(temperature) {
  temperature = temperature / 100;
  return temperature.toFixed(2);
}

/**
 * Converts a value from 0-255 to a percentage.
 */
function briToPercentage(bri) {
  return Math.round(parseInt(bri)/255 * 100);
}

/**
 * Converts a value from a percentage to 0-255.
 */
function percentageToBri(percentage) {
  return Math.round(parseInt(percentage)/100 * 255);
}
