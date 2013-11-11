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

    // Add the proxy default.
    defaults.proxy = 'https://www.allplayers.com';
    defaults.proxy += '/sites/all/libraries/porthole/src/proxy.html';

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
 * Initialize this app code.
 */
allplayers.app.prototype.init = function() {
  document.proxy = this;
};
