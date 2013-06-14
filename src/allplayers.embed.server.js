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
  this.queue = {};

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
      self.resize();
    }, 500);
  });

  // If we are on the complete page, then say so...
  if (this.options.isComplete()) {
    this.proxy.post({event: {
      'name': 'complete'
    }});
  }

  // Add an event listener.
  this.proxy.addEventListener(function(e) {

    // Switch on the event name.
    var event = e.data.hasOwnProperty('event') ? e.data.event : false;
    if (event) {
      switch (event.name) {

        // Handle the message response.
        case 'chromeMsgResp':

          // Call our callback with the response.
          if (event.data.hasOwnProperty('guid') &&
              self.queue.hasOwnProperty(event.data.guid)) {
            self.queue[event.data.guid](event.data.response);
          }
          break;

        case 'chromePluginReady':
          window.postMessage(event, '*');
          break;

        case 'addStyle':
          // Inject the style into the page.
          if (event.data) {
            // Keep them from escaping the <style> tag.
            var styles = event.data.replace(/[<>]/g, '');
            var lastStyle = jQuery('link[type="text/css"]');
            if (lastStyle.length) {
              lastStyle = lastStyle.eq(lastStyle.length - 1);
              lastStyle.after(jQuery(document.createElement('style')).attr({
                type: 'text/css'
              }).append(styles));
            }
          }
          break;
      }
    }
  });

  // Trigger the resizing events.
  this.resize();

  // Server is now ready.
  this.proxy.post({event: {'name': 'serverReady'}});
};

/**
 * Allow to send a chrome extension message and handle the response.
 *
 * @param {object} msg The message to send to the extension.
 * @param {function} callback Callback called when the response is received.
 */
allplayers.embed.server.prototype.sendMessage = function(msg, callback) {
  var s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };
  var guid = function() {
    return s4() + s4() + s4();
  };

  // Add a message id.
  msg.guid = guid();
  this.proxy.post({event: {
    name: 'chromeMsg',
    data: msg
  }});

  // Add the callback to the queue.
  this.queue[msg.guid] = callback;
};

/**
 * Initialize the allplayer embed library.
 */
allplayers.embed.server.prototype.resize = function() {

  // Change all links to reference platform instead of www.
  jQuery('a[href^="https://www."]', this.container).each(function() {

    // Replace the href with platform
    var href = jQuery(this).attr('href');
    jQuery(this).attr({
      'href': href.replace(
        /https:\/\/www.(.*?).allplayers.com/,
        'https://platform.$1.allplayers.com'
      )
    });
  });

/* Investigate iframe redirects...
  jQuery('a', this.container).each(function() {
    jQuery(this).click(function(event) {
      event.preventDefault();
      var href = jQuery(this).attr('href');
      var q = href.match(/\:\/\/.*\.allplayers\.com\/(.*)|^\/(.*)/);
      q = q[1] ? q[1] : q[2];
      self.proxy.post({event: {
        name: 'redirect',
        data: q
      }});
    });
  });
 */

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
