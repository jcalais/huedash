$(function() {
  if ($('.js-hue-big-slider').length > 0) {
    $('.js-hue-big-slider').initBigSlider();
  }

  // Set colors of all light tiles according to the lights in use.
  refreshLightStates();

  // Toggle light on/off on click.
  $('a[data-type="light"], a[data-type="group"]').click(function() {
    $(this).toggleLight();
  });

  // Set scene on click on scene button.
  $('a[data-type="scene"]').click(function() {
    $(this).setScene();
  });

  // Activate color chart and register clicks.
  $('.js-toggle-color').click(function() {
    $('.js-color-chart').toggle();
    $('.hue-color-chart__tile').unbind('click');
    $('.hue-color-chart__tile').click(function() {
      var color = $(this).css('background-color');
      $('.js-color-chart').hide();
      $('a[data-type="group"]').setColor(color);
    });
  });
});

/**
 * General state changer for brightness and toggle for both lights and groups.
 */
$.fn.toggleLight = function(brightness) {
  var $entity = $(this);
  var id = $(this).data('id');
  if (brightness) {
    var state = {"bri": percentageToBri(brightness)}
  }
  else {
    var old_state = $(this).data('state');
    var new_state = old_state == 'on' ? 'off' : 'on';
    var state = {"on": new_state == 'on' ? true : false}
  }
  var type = $(this).data('type')
  var endpoint = type == 'light' ? '/lights/' + id + '/state' : '/groups/' + id + '/action';
  $.post('/hueapigateway', {
    endpoint: endpoint, 
    payload: JSON.stringify(state)
  }, function(data) {
    if (data[0].success && type == 'group' && new_state) {
      $entity.data('state', new_state);
      $entity.removeClass('bg-cat-onish');
      $entity.removeClass('bg-cat-' + old_state);
      $entity.addClass('bg-cat-' + new_state);
    }
    refreshLightStates();
  }, "json");
}

function refreshLightStates() {
  var lights = [];
  $('a[data-type="light"]').each(function() {
    lights[$(this).data('id')] = $(this);
  });
  $.post('/hueapigateway', {
    endpoint: '/lights',
  }, function(data) {
    jQuery.each(data, function(index, light) {
      if (lights[index]) {
        lights[index].setStateData(light.state);
      }
    })
  });
}

/**
 * Sets the state data of the light tile in the UI.
 */
$.fn.setStateData = function(state) {
  $(this).removeClass('bg-cat-' + (state.on ? 'off' : 'on'));
  $(this).addClass('bg-cat-' + (state.on ? 'on' : 'off'));
  $(this).data('bri', state.bri);
  $(this).data('state', (state.on ? 'on' : 'off'));
  if (state.xy) {
    $(this).data('x', state.xy[0]);
    $(this).data('y', state.xy[1]);

    // Set tile icon to light color.
    var rgb = cie_to_rgb($(this).data('x'), $(this).data('y'), $(this).data('bri'));
    rgb_val = 'rgb(' + rgb.join(',') + ')';
    $(this).children('.ion').css('color', rgb_val);
  }
};

$.fn.setScene = function() {
  var $scene = $(this);
  var scene_id = $(this).data('id');
  var endpoint = '/groups/0/action';
  var payload = {'scene': scene_id};
  $.post('/hueapigateway', {
    endpoint: endpoint, 
    payload: JSON.stringify(payload)
  }, function(data) {
    if (data[0].success) {
      $scene.removeClass('bg-cat-off');
      $scene.addClass('bg-cat-on');
    }
  }, "json");
};

/**
 * Sets the color of the light.
 */
$.fn.setColor = function(color) {
  var $entity = $(this);
  var id = $(this).data('id');
  if (matches = /rgb\(([0-9]*), ([0-9]*), ([0-9]*)\)/.exec(color)) {
    var cie_color = rgb_to_cie(matches[1], matches[2], matches[3]);
    cie_color[0] = parseFloat(cie_color[0]);
    cie_color[1] = parseFloat(cie_color[1]);
    var endpoint = '/groups/' + id + '/action';
    $.post('/hueapigateway', {
      endpoint: endpoint, 
      payload: JSON.stringify({"xy": cie_color})
    }, function(data) {
      refreshLightStates();
    }, "json");
  }
};

/**
 * Initialises the big slider.
 */
$.fn.initBigSlider = function() {
  var $big_slider = $(this);
  var big_slider = document.getElementById($big_slider.attr('id'));
  noUiSlider.create(big_slider, {
    start: briToPercentage($big_slider.data('val')),
    connect: [true, false],
    orientation: "vertical",
    range: {
        'min': 0,
        'max': 100
    },
    direction: 'rtl',
    pips: {
        mode: 'range',
        density: 5,
        values: 5,
    },
    tooltips: [ true ]
  });
  big_slider.noUiSlider.on('change', function(values, handle) {
    $('a[data-type="group"]').toggleLight(values[0]);
  });
};

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