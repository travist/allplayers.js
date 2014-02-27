var allplayers = allplayers || {app: {}};

(function(window, document, allplayers, $, undefined) {
  /**
   * The allplayers app client.
   *
   * @param {object} options The options for this app client.
   * @this The allplayers.app.client.
   */
  allplayers.app.client = function(options) {
    allplayers.app.call(this, options, {
      getContainer: function() {
        return $();
      }
    });
  };

  /** Derive from allplayers.app. */
  allplayers.app.client.prototype = new allplayers.app();

  /** Reset the constructor. */
  allplayers.app.client.prototype.constructor = allplayers.app.client;

  /**
   * Initialize the allplayer app library.
   */
  allplayers.app.client.prototype.init = function() {

    // Call the parent.
    allplayers.app.prototype.init.call(this);

    // Get the ehost from the parent window.
    this.ehost = allplayers.app.getParam('ehost');

    this.container = this.options.getContainer();
    this.height = 0;
    this.heightTimer = null;
    this.queue = {};
    this.reg = null;
    this.checkout = null;
    this.type = 'registration';

    // Keep track of the self pointer.
    var self = this;

    // Bind to the document resize event.
    var throttle = null;
    $(document).bind('DOMSubtreeModified', function() {
      if (throttle) {
        clearTimeout(throttle);
      }
      throttle = setTimeout(function() {
        self.resize();
      }, 500);
    });

    // Add the chrome message response.
    $.pm.bind('chromeMsgResp', function(data) {
      if (data.hasOwnProperty('guid') &&
        self.queue.hasOwnProperty(data.guid)) {
        self.queue[data.guid](data.response);
      }
    });

    // Get the registration data.
    $.pm.bind('getRegistration', function(data) {
      self.reg = data;
      self.type = 'registration';
    });

    // Get the checkout data.
    $.pm.bind('getCheckout', function(data) {
      self.checkout = data;
      self.type = 'checkout';
    });

    // Trigger the resizing events.
    this.resize();

    // Client is now ready.
    $.pm({
      target: window.parent,
      url: this.ehost,
      type: 'clientReady'
    });
  };

  /**
   * Allow to send a chrome extension message and handle the response.
   *
   * @param {object} msg The message to send to the extension.
   * @param {function} callback Callback called when the response is received.
   */
  allplayers.app.client.prototype.sendMessage = function(msg, callback) {
    var s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16).substring(1);
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
   * Initialize the allplayer app library.
   */
  allplayers.app.client.prototype.resize = function() {

    // Change all links to reference platform instead of www.
    $('a[href^="https://www."]', this.container).each(function() {

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

        $.pm({
          target: window.parent,
          url: self.ehost,
          type: 'init',
          data: {
            height: newHeight,
            id: window.location.hash
          },
          success: function(data) {
            self.height = data.height;
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
}(window, document, window.allplayers, jQuery));
