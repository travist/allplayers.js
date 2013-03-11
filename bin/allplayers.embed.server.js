var allplayers = allplayers || {};

/**
 * Create the embedded class.
 *
 * @param {object} options The options for this embed library.
 * @param {object} defaults The default params for this libarary.
 * @this The allplayers.embed object.
 */
allplayers.embed = function(options, defaults) {
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
 * Initialize this embed code.
 */
allplayers.embed.prototype.init = function() {
};
var allplayers = allplayers || {embed: {}};

/**
 * The allplayers embed server.
 *
 * @param {object} options The options for this embed server.
 * @this The allplayers.embed.client.
 */
allplayers.embed.server = function(options) {
  allplayers.embed.call(this, options, {
    getHeight: function() {
      return 0;
    },
    isComplete: function() {

    }
  });
};

/** Derive from allplayers.embed. */
allplayers.embed.server.prototype = new allplayers.embed();

/** Reset the constructor. */
allplayers.embed.server.prototype.constructor = allplayers.embed.server;

/**
 * Initialize the allplayer embed library.
 */
allplayers.embed.server.prototype.init = function() {

  // Call the parent.
  allplayers.embed.prototype.init.call(this);

  var initialized = false;
  var self = this;

  // Send document stats via porthole message.
  var proxy = new Porthole.WindowProxy(this.options.proxy);
  proxy.addEventListener(function(message) {
    if (message.data.hasOwnProperty('init') && message.data.init) {
      initialized = true;
    }
  });

  // Function to send the resize event.
  var initialize = function() {

    // Send the event to initialize the iframe.
    proxy.post({'event': {
      'name': 'init',
      'height' : self.options.getHeight(),
      'id' : window.location.hash
    }});

    // We are now initialized.
    if (initialized) {

      // If we are on the complete page, then say so...
      if (self.options.isComplete()) {
        proxy.post({'event': {
          'name': 'complete'
        }});
      }
    }
    else {

      // Try again in 500 ms.
      setTimeout(initialize, 500);
    }
  };

  // Initialize the iframe.
  initialize();
};
