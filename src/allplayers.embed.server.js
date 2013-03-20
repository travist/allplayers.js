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

  // If the iframe was resized.
  this.resized = false;

  // Keep track of the self pointer.
  var self = this;

  // Send document stats via porthole message.
  this.proxy = new Porthole.WindowProxy(this.options.proxy);
  this.proxy.addEventListener(function(message) {
    if (message.data.hasOwnProperty('init') && message.data.init) {
      self.resized = true;
    }
  });

  // Bind to the document resize event.
  var throttle = null;
  jQuery(document).bind('DOMSubtreeModified', function() {
    if (throttle) {
      clearTimeout(throttle);
    }
    throttle = setTimeout(function() {
      self.resize();
    }, 500);
  });

  // Trigger the resizing events.
  this.resize();
};

/**
 * Initialize the allplayer embed library.
 */
allplayers.embed.server.prototype.resize = function() {

  // If the iframe was resized.
  this.resized = false;
  var self = this;

  // Change all links to reference platform instead of www.
  var container = self.options.getContainer();
  jQuery('a[href^="https://www."]', container).each(function() {

    // Replace the href with platform
    var href = $(this).attr('href');
    $(this).attr({
      'href': href.replace(/^https\:\/\/www\./, 'https://platform.')
    });
  });

  // Function to send the resize event.
  var initialize = function() {

    // Get the height of the content.
    var height = container.outerHeight(true);

    // Send the event to initialize the iframe.
    self.proxy.post({
      'height': height,
      'event': {
        'name': 'init',
        'height' : height,
        'id' : window.location.hash
      }
    });

    // We are now initialized.
    if (self.resized) {

      // If we are on the complete page, then say so...
      if (self.options.isComplete()) {
        self.proxy.post({'event': {
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
