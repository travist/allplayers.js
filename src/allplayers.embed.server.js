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
        return 'body';
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

    // Get the container.
    var container = this.options.getContainer();

    // Connect to the parent.
    var parentFrame = $.seamless.connect({

      /**
       * Set the url to what was passed in from the client.
       */
      url: allplayers.base64.decode($.SeamlessBase.getParam('ehost')),

      /**
       * Set the container element.
       */
      container: container,

      /**
       * Require cookies.
       */
      requireCookies: true,

      /**
       * Allow style injection.
       */
      allowStyleInjection: true,

      /**
       * Called when an update is triggered to the parent.
       *
       * @param object data
       *   The data that is sent to the parent from the child page.
       */
      onUpdate: function(data) {
        // Change all links to reference platform instead of www.
        $('a[href^="https://www."]', container).each(function() {

          // Replace the href with platform
          var href = $(this).attr('href');
          $(this).attr({
            'href': href.replace(
              /https:\/\/www.(.*?).allplayers.com/,
              'https://platform.$1.allplayers.com'
            )
          });
        });
      }
    });

    // If we are on the complete page, then say so...
    if (this.options.isComplete()) {
      parentFrame.send({ type: 'complete', data: {} });
    }

    // Pass along the chrome messages.
    $.pm.bind('chromeMsg', function(data) {
      parentFrame.send({
        type: 'chromeMsg',
        data: data
      });
    });

    // Pass along the chrome repsponse messages.
    $.pm.bind('chromeMsgResp', function(data) {
      parentFrame.send({
        type: 'chromeMsgResp',
        data: data
      });
    });
  };
}(window, document, window.allplayers, jQuery));
