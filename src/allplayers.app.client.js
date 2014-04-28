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
        return 'body';
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

    // Get the container.
    var container = this.options.getContainer();

    // Connect to the parent.
    $.seamless.connect({

      /**
       * Set the url to what was passed in from the parent.
       */
      url: allplayers.base64.decode($.SeamlessBase.getParam('ehost')),

      /**
       * Set the bounding container.
       */
      container: container,

      /**
       * Require cookies.
       */
      requireCookies: true,

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

    // Keep track of the self pointer.
    var self = this;
    this.reg = null;
    this.checkout = null;
    this.type = 'registration';

    // Get the registration data.
    $.seamless.receive('getRegistration', function(data) {
      self.reg = data;
      self.type = 'registration';
    });

    // Get the checkout data.
    $.seamless.receive('getCheckout', function(data) {
      self.checkout = data;
      self.type = 'checkout';
    });
  };
}(window, document, window.allplayers, jQuery));
