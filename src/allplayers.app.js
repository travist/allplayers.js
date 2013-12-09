var allplayers = allplayers || {};

/**
 * Create the app class.
 *
 * @param {object} options The options for this app library.
 * @param {object} defaults The default params for this libarary.
 * @this The allplayers.app object.
 */
allplayers.app = function(options, defaults) {
  if (defaults) {

    // Keep track of the self pointer.
    var self = this;

    // Set the defaults.
    options = options || {};
    for (var name in defaults) {
      if (!options.hasOwnProperty(name)) {
        options[name] = defaults[name];
      }
    }

    // Set the options and initialize.
    this.options = options;
    this.init();
  }
};

/**
 * Return the value of a parameter.
 *
 * @param {string} name The name of the parameter to get.
 * @return {string} The value of the parameter.
 */
allplayers.app.getParam = function(name) {
  name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
  var regexS = '[\\?&]' + name + '=([^&#]*)';
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if (results == null) {
    return '';
  }
  else {
    return decodeURIComponent(results[1].replace(/\+/g, ' '));
  }
};

/**
 * Initialize this app code.
 */
allplayers.app.prototype.init = function() {
  document.proxy = this;
};
