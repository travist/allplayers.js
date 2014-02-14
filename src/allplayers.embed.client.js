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

    // Say we are loading.
    this.isLoading = true;

    // Get the ID from this context.
    var id = this.context.attr('id');

    // Set the spinner if it isn't set.
    if (!this.options.spinner) {
      this.options.spinner = this.options.base;
      this.options.spinner += '/sites/all/themes/basic_foundation';
      this.options.spinner += '/images/loader.gif';
    }

    // Say that the plugin isn't ready.
    this.pluginReady = false;

    // Add the loading and iframe.
    var loading = $(document.createElement('div')).css({
      background: 'url(' + this.options.spinner + ') no-repeat 10px 13px',
      padding: '10px 10px 10px 60px',
      width: '100%'
    });

    // Add the loading text.
    loading.append(this.options.loading);

    // Add the iframe.
    var iframeId = id + '_iframe';

    // Define our own isEmptyObject function.
    var isEmptyObject = function(obj) {
      var name;
      for (name in obj) {
        return false;
      }
      return true;
    };

    // Get the source for the iframe.
    var source = '';

    // See if they provide their own query.
    var q = allplayers.embed.getParam('apq');
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
    if (!isEmptyObject(this.options.query)) {
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

    // Used for callbacks.
    var self = this;

    // Create the fallback.
    (function(eSource) {
      window['openAPEmbeddedWindow_' + id] = function(event) {
        if (event.preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        else {
          event.returnValue = false;
        }
        var windowParams = [
          'width=960',
          'height=800',
          'menubar=no',
          'titlebar=no',
          'toolbar=no',
          'status=no',
          'scrollbars=yes',
          'chrome=yes'
        ];
        eSource += '&clearCache=true&bodyPadding=10&showHelp=1';
        window.open(eSource, '', windowParams.join());
      };
    }(source));

    // Add the iframe ID to the iframe source.
    source += '#' + iframeId;

    // The fallback text.
    var fallbackShown = false;
    var fallback = '<a href="#" onclick="';
    fallback += 'window.openAPEmbeddedWindow_' + id + '(event)">Click here</a>';
    fallback += ' to open in a separate window.';

    // Returns the fallback markup.
    var getFallback = function(msg, info) {
      var markup = '<div class="apci-fallback" ';
      if (info) {
        var divStyles = [
          'padding: 15px',
          'border: 1px solid transparent',
          'border-radius: 4px',
          'color: #3a87ad',
          'background-color: #d9edf7',
          'border-color: #bce8f1'
        ];
        markup += 'style="' + divStyles.join(';') + '"';
      }
      markup += '>';
      markup += '<em style="padding: 5px;">' + msg + ' ' + fallback + '</em>';
      markup += '</div>';
      return markup;
    };

    // Function to display the fallback only once.
    var displayFallback = function(msg) {
      if (!fallbackShown) {
        fallbackShown = true;
        self.context.prepend(getFallback(msg, true));
      }
    };

    // Create the permanent fallback.
    this.context.after(getFallback('Having Trouble?', false));

    // If any error occurs, then show the fallback text.
    window.onerror = function(msg, url, line) {
      msg = 'An error has been detected on this page, ';
      msg += 'which may cause problems with the operation of this application.';
      displayFallback(msg);
    };

    // If nothing happens after 30 seconds, then assume something went wrong.
    setTimeout(function() {
      if (self.isLoading) {
        loading.remove();
        self.isLoading = false;
        displayFallback('An error has been detected on this page.');
      }
    }, 30000);

    var iframe = $(document.createElement('iframe')).attr({
      id: iframeId,
      name: iframeId,
      scrolling: 'no',
      seamless: 'seamless',
      width: '100%',
      height: '0px',
      src: source
    }).css({
        border: 'none',
        overflowY: 'hidden'
      });

    // Create the loading element.
    this.context.append(loading);
    this.context.append(iframe);

    var serverTarget = null;

    // The chrome plugin is ready.
    $.pm.bind('chromePluginReady', function() {
      self.pluginReady = true;
    });

    // Pass along chrome message responses.
    $.pm.bind('chromeMsgResp', function(data) {
      $.pm({
        target: serverTarget,
        url: self.baseURL,
        type: 'chromeMsgResp',
        data: data
      });
    });

    // Pass along the chrome messages.
    $.pm.bind('chromeMsg', function(data) {
      $.pm({
        target: serverTarget,
        url: self.baseURL,
        type: 'chromeMsg',
        data: data
      });
    });

    // The init message.
    $.pm.bind('init', function(data, e) {
      serverTarget = e.source;
      self.isLoading = false;
      loading.remove();

      // Add the custom style to the iframe.
      if (self.options.style) {
        $.pm({
          target: e.source,
          url: self.baseURL,
          type: 'addStyle',
          data: self.options.style
        });
      }

      // Set the height
      iframe.height(data.height).attr('height', data.height + 'px');
      return data;
    });

    // The complete message.
    $.pm.bind('complete', function(data) {
      self.options.complete.call(self, data);
    });

    // The server ready message.
    $.pm.bind('serverReady', function(data, e) {

      // Say that the chrome plugin is ready.
      if (self.pluginReady) {
        $.pm({
          target: e.source,
          url: self.baseURL,
          type: 'chromePluginReady'
        });
      }
    });
  };
}(window, document, window.allplayers, jQuery));
