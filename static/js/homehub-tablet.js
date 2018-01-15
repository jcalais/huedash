$(function() {
  var slider = document.getElementById('hue-big-slider');
  noUiSlider.create(slider, {
    start: 127,
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
});