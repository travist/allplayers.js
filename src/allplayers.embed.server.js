/** The global allplayers object. */
window.allplayers = window.allplayers || {embed: {}};

(function(window, document, allplayers, $, undefined) {
/**
 * The allplayers embed server.
 *
 * @param {object} options The options for this embed server.
 * @this The allplayers.embed.client.
 */
allplayers.embed.server = function(options) {
  allplayers.embed.call(this, options, {
    getContainer: function() {
      return $();
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

  // Get the ehost from the parent window.
  this.ehost = allplayers.embed.getParam('ehost');
  this.ehost = allplayers.base64.decode(this.ehost);

  this.container = this.options.getContainer();
  this.height = 0;
  this.heightTimer = null;
  this.queue = {};

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

  // If we are on the complete page, then say so...
  if (this.options.isComplete()) {
    $.pm({
      target: window.parent,
      url: this.ehost,
      type: 'complete'
    });
  }

  // Add the chrome message response.
  $.pm.bind('chromeMsgResp', function(data) {
    if (data.hasOwnProperty('guid') &&
      self.queue.hasOwnProperty(data.guid)) {
      self.queue[data.guid](data.response);
    }
  });

  // Pass along the chrome plugin ready message.
  $.pm.bind('chromePluginReady', function(data) {
    $.pm({
      target: window,
      type: 'chromePluginReady'
    });
  });

  // Add the styles to the page.
  $.pm.bind('addStyle', function(data) {
    if (data) {
      // Keep them from escaping the <style> tag.
      var styles = data.replace(/[<>]/g, '');
      var lastStyle = $('link[type="text/css"]');
      if (lastStyle.length) {
        lastStyle = lastStyle.eq(lastStyle.length - 1);
        lastStyle.after($(document.createElement('style')).attr({
          type: 'text/css'
        }).append(styles));
      }
    }
  });

  // Trigger the resizing events.
  this.resize();

  // Server is now ready.
  $.pm({
    target: window.parent,
    url: this.ehost,
    type: 'serverReady'
  });
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
  $.pm({
    target: window.parent,
    type: 'chromeMsg',
    url: this.ehost,
    data: msg
  });

  // Add the callback to the queue.
  this.queue[msg.guid] = callback;
};

/**
 * Initialize the allplayer embed library.
 */
allplayers.embed.server.prototype.resize = function() {

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

      // Send the event to resize the iframe.
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
