var allplayers = allplayers || {embed: {}};

/**
 * The allplayers embed server.
 *
 * @param {object} options The options for this embed server.
 * @this The allplayers.embed.client.
 */
allplayers.embed.server = function(options) {
  allplayers.embed.call(this, options, {
    getContainer: function() {
      return jQuery();
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

  this.container = this.options.getContainer();
  this.height = 0;
  this.heightTimer = null;

  // Keep track of the self pointer.
  var self = this;

  // Send document stats via porthole message.
  this.proxy = new Porthole.WindowProxy(this.options.proxy);

  // Bind to the document resize event.
  var throttle = null;
  jQuery(document).bind('DOMSubtreeModified', function() {
    if (throttle) {
      clearTimeout(throttle);
    }
    throttle = setTimeout(function() {
      self.height = 0;
      self.resize();
    }, 500);
  });

  // If we are on the complete page, then say so...
  if (this.options.isComplete()) {
    this.proxy.post({'event': {
      'name': 'complete'
    }});
  }

  // Trigger the resizing events.
  this.resize();
};

/**
 * Initialize the allplayer embed library.
 */
allplayers.embed.server.prototype.resize = function() {

  // Change all links to reference platform instead of www.
  jQuery('a[href^="https://www."]', this.container).each(function() {

    // Replace the href with platform
    var href = $(this).attr('href');
    $(this).attr({
      'href': href.replace(
        /https:\/\/www.(.*?).allplayers.com/,
        'https://platform.$1.allplayers.com'
      )
    });
  });

  // Function to send the resize event.
  var self = this;
  var checkHeight = function() {

    // Get the new height of the container.
    var newHeight = self.container.outerHeight(true);
    if (self.height !== newHeight) {

      // Set the height.
      self.height = newHeight;

      // Send the event to resize the iframe.
      self.proxy.post({
        'height': self.height,
        'event': {
          'name': 'init',
          'height' : self.height,
          'id' : window.location.hash
        }
      });
    }

    // Clear the timer if it exists.
    if (self.heightTimer) {
      clearTimeout(self.heightTimer);
    }

    // Try again in 500 ms.
    self.heightTimer = setTimeout(checkHeight, 500);
  };

  // Check the height of the iframe.
  checkHeight();
};
