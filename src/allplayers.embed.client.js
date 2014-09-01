/** The global allplayers object. */
window.allplayers = window.allplayers || {embed: {}};
(function(window, document, allplayers, $, undefined) {
  if ($ && !$.fn.allplayers_client) {

    /**
     * Define the jQuery plugin.
     *
     * @param {object} options The options for this plugin.
     * @return {object} A jQuery object.
     * @this The jQuery context for each element.
     **/
    $.fn.allplayers_client = function(options) {
      return $(this).each(function() {
        new allplayers.embed.client(options, $(this));
      });
    };
  }

  /**
   * The allplayers embed client.
   *
   * @param {object} options The options for this embed client.
   * @param {object} context The display context for this plugin.
   * @this The allplayers.embed.client.
   */
  allplayers.embed.client = function(options, context) {

    // Store the context.
    this.context = context;

    // Call the allplayers.embed constructor.
    allplayers.embed.call(this, options, {
      spinner: '',
      loading: 'Loading',
      base: 'https://platform.allplayers.com',
      type: 'registration',
      group: 'api',
      query: {},
      src: '',
      style: '',
      esrc: '',
      complete: function() {}
    });
  };

  /** Derive from allplayers.embed. */
  allplayers.embed.client.prototype = new allplayers.embed();

  /** Reset the constructor. */
  allplayers.embed.client.prototype.constructor = allplayers.embed.client;

  /**
   * Initialize the allplayer embed library.
   */
  allplayers.embed.client.prototype.init = function() {

    // Call the parent.
    allplayers.embed.prototype.init.call(this);

    // Get the base URL of the embed page.
    this.baseURL = 'https://platform.allplayers.com';
    if (this.options.base) {
      this.baseURL = this.options.base;
    }

    // Get the ID from this context.
    var id = this.context.attr('id');

    // Set the iframe id.
    var iframeId = id + '_iframe';

    // Get the source for the iframe.
    var source = '';

    // See if they provide their own query.
    var q = $.SeamlessBase.getParam('apq');
    if (q) {
      source = this.options.base + '/' + q;
    }
    else if (this.options.src) {
      source = this.options.src;
    }
    else {
      source = this.options.base + '/g/' + this.options.group;
      switch (this.options.type) {
        case 'registration':
          source += '/register';
          break;
        case 'forms':
          source += '/forms';
          break;
      }

      // Add the type as a query parameter.
      this.options.query.etyp = this.options.type;
    }

    // Add the embed source to the url.
    source += (source.search(/\?/) === -1) ? '?' : '&';

    // If they have some query options then add them here.
    if (!$.SeamlessBase.isEmptyObject(this.options.query)) {
      for (var param in this.options.query) {
        source += param + '=' + encodeURIComponent(this.options.query[param]);
        source += '&';
      }
    }

    // Add the embed source as our last parameter.
    var esrc = !!this.options.esrc ? this.options.esrc : window.location.href;
    source += 'esrc=' + allplayers.base64.encode(esrc);

    // Add the ehost to the source.
    source += '&';
    source += 'ehost=' + allplayers.base64.encode(window.location.origin);

    // Set the spinner if it isn't set.
    if (!this.options.spinner) {
      this.options.spinner = this.options.base;
      this.options.spinner += '/sites/all/themes/basic_foundation';
      this.options.spinner += '/images/loader.gif';
    }

    // Create the seamless iframe.
    var iframe = $(document.createElement('iframe')).attr({
      id: iframeId,
      name: iframeId,
      src: source
    });

    // Add the iframe.
    this.context.append(iframe);

    // Make the iframe seamless.
    var iframeConnection = iframe.seamless({
      spinner: this.options.spinner,
      fallbackText: 'Having Trouble?',
      fallbackParams: 'clearCache=true&bodyPadding=10&showHelp=1',
      styles: this.options.style
    });

    // The complete message.
    var self = this;
    iframeConnection.receive('complete', function(data) {
      self.options.complete.call(self, data);
    });

    // Pass along chrome message responses.
    $.pm.bind('chromeMsgResp', function(data) {
      iframeConnection.send({
        type: 'chromeMsgResp',
        data: data
      });
    });

    // Pass along the chrome messages.
    $.pm.bind('chromeMsg', function(data) {
      iframeConnection.send({
        type: 'chromeMsg',
        data: data
      });
    });
  };
}(window, document, window.allplayers, jQuery));
