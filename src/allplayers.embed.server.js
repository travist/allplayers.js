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
      return false;
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
  var numTries = 10;

  // Send document stats via porthole message.
  var proxy = new Porthole.WindowProxy(this.options.proxy);
  proxy.addEventListener(function(message) {
    if (message.data.hasOwnProperty('init') && message.data.init) {
      initialized = true;
    }
  });

  // Function to send the resize event.
  var initialize = function() {

    // Get the height of the content.
    var height = self.options.getHeight();

    // Send the event to initialize the iframe.
    proxy.post({
      'height': height,
      'event': {
        'name': 'init',
        'height' : height,
        'id' : window.location.hash
      }
    });

    // We are now initialized.
    if ((numTries <= 0) || initialized) {

      // If we are on the complete page, then say so...
      if (self.options.isComplete()) {
        proxy.post({'event': {
          'name': 'complete'
        }});
      }
    }
    else {

      // Try again in 500 ms.
      numTries--;
      setTimeout(initialize, 500);
    }
  };

  // Initialize the iframe.
  initialize();
};
