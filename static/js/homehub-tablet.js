$(function() {
  initBigSlider();
  $('a[data-type="light"], a[data-type="group"]').click(function() {
    $(this).toggleLight();
  });
});

/**
 * General state changer for brightness and toggle for both lights and groups.
 */
$.fn.toggleLight = function(brightness) {
  var $entity = $(this);
  var old_state = $(this).data('state');
  var new_state = old_state == 'on' ? 'off' : 'on';
  var id = $(this).data('id');
  if (brightness) {
    var state = {"bri": percentageToBri(brightness)}
  }
  else {
    var state = {"on": new_state == 'on' ? true : false}
  }
  var type = $(this).data('type')
  var endpoint = type == 'light' ? '/lights/' + id + '/state' : '/groups/' + id + '/action';
  $.post('/hueapigateway', {
    endpoint: endpoint, 
    payload: JSON.stringify(state)
  }, function(data) {
    console.log(data);
    if (data[0].success && !brightness) {
      $entity.data('state', new_state);
      $entity.removeClass('bg-cat-' + old_state);
      $entity.addClass('bg-cat-' + new_state);
    }
  }, "json");
}

/**
 * Initialises the big slider.
 */
function initBigSlider() {
  var $big_slider = $('.js-hue-big-slider');
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