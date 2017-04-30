$(function() {
  getScenes();
});

/**
 * Looks up all scenes and deletes them.
 *
 * I needed this for some house keeping, since I had 107 scenes in my hue hub
 * and I wasn't using scenes for anything. Many where recyclable, but I just 
 * removed them all to start fresh. This will not remove those that have
 * locked = true.
 */
function getScenes() {
  var url = getHueApiBaseUrl() + '/scenes';
  $.ajax({
    'url': url,
    'type': 'get',
    'success': function(data) {
      var normalScenes = [];
      var recycleScenes = [];
      var allScenes = [];
      $.each(data, function(key, scene) {
        if (scene.recycle) {
          recycleScenes.push(scene);
        }
        else {
          normalScenes.push(scene);
        }
        allScenes.push(scene);
      });
      console.log(allScenes);
      deleteScenes(allScenes);
    }
  });
}

function deleteScenes(sceneIds) {
  if (sceneIds.length > 0) {
    var delId = sceneIds.shift();
    var delUrl =  getHueApiBaseUrl() + '/scenes/' + delId;
    $.ajax({
      'url': delUrl,
      'type': 'delete',
      'success': function(data) {
        console.log("Deleted scene " + delId);
        deleteScenes(sceneIds);
      }
    });
  }
}