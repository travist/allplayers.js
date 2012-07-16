var allplayers = allplayers || {};
allplayers.loader = function(type) {
  var path = '';
  var i = document.scripts.length;
  while (i--) {
    var testsrc = document.scripts[i].getAttribute('src');
    var pos = testsrc.search(/(src|bin)\/allplayers\.loader\.js$/);
    if (pos >= 0) {
      path = testsrc.substr(0, pos);
      break;
    }
  }

  var loadScripts = function(params) {
    var tag = null;
    var i = params.scripts.length;
    while (i--) {
      if (!params.tests[i]()) {
        tag = document.createElement('script');
        tag.src = params.script;
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  };

  // Load the scripts we need.
  loadScripts({
    scripts: [
      'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js',
      'lib/' + type + '/bin/allplayers.' + type + '.compressed.js'
    ],
    tests: [
      function() { return typeof jQuery !== 'undefined'; },
      function() { return typeof jQuery.fn[type] !== 'undefined'; }
    ]
  });
};