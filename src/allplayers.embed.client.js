/** The global allplayers object. */
window.allplayers = window.allplayers || {embed: {}};
(function(window, document, allplayers, $, undefined) {

  /*
   * Copyright (c) 2010 Nick Galbreath
   * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
   *
   * Permission is hereby granted, free of charge, to any person
   * obtaining a copy of this software and associated documentation
   * files (the "Software"), to deal in the Software without
   * restriction, including without limitation the rights to use,
   * copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the
   * Software is furnished to do so, subject to the following
   * conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
   * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
   * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
   * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
   * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   * OTHER DEALINGS IN THE SOFTWARE.
   */
  base64 = {};
  base64.PADCHAR = '=';
  base64.ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  base64.ALPHA += 'abcdefghijklmnopqrstuvwxyz0123456789+/';
  base64.getbyte = function(s, i) {
    var x = s.charCodeAt(i);
    if (x > 255) {
      throw 'INVALID_CHARACTER_ERR: DOM Exception 5';
    }
    return x;
  };
  base64.encode = function(s) {
    if (arguments.length != 1) {
      throw 'SyntaxError: Not enough arguments';
    }
    var padchar = base64.PADCHAR;
    var alpha = base64.ALPHA;
    var getbyte = base64.getbyte;

    var i, b10;
    var x = [];

    // convert to string
    s = '' + s;

    var imax = s.length - s.length % 3;

    if (s.length == 0) {
      return s;
    }
    for (i = 0; i < imax; i += 3) {
      b10 = (getbyte(s, i) << 16);
      b10 |= (getbyte(s, i + 1) << 8);
      b10 |= getbyte(s, i + 2);
      x.push(alpha.charAt(b10 >> 18));
      x.push(alpha.charAt((b10 >> 12) & 0x3F));
      x.push(alpha.charAt((b10 >> 6) & 0x3f));
      x.push(alpha.charAt(b10 & 0x3f));
    }
    switch (s.length - imax) {
      case 1:
        b10 = getbyte(s, i) << 16;
        x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
          padchar + padchar);
        break;
      case 2:
        b10 = (getbyte(s, i) << 16) | (getbyte(s, i + 1) << 8);
        x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
          alpha.charAt((b10 >> 6) & 0x3f) + padchar);
        break;
    }
    return x.join('');
  };

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
   * Return the value of a parameter.
   *
   * @param {string} name The name of the parameter to get.
   * @return {string} The value of the parameter.
   */
  allplayers.embed.client.getParam = function(name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regexS = '[\\?&]' + name + '=([^&#]*)';
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null) {
      return '';
    }
    else {
      return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
  };

  /**
   * Initialize the allplayer embed library.
   */
  allplayers.embed.client.prototype.init = function() {

    // Call the parent.
    allplayers.embed.prototype.init.call(this);

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
    var q = allplayers.embed.client.getParam('apq');
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
    source += 'esrc=' + base64.encode(esrc);

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

    // Get the proxy.
    this.proxy = new Porthole.WindowProxy(
      this.options.proxy,
      iframe.attr('id')
    );

    // Pass along chrome message responses to the server.
    if (window.addEventListener) {
      window.addEventListener('message', function(event) {
        switch (event.data.name) {
          case 'chromeMsgResp':
            self.proxy.post({event: event.data});
            break;
          case 'chromePluginReady':
            self.pluginReady = true;
            break;
        }
      });
    }

    // Add the event listener.
    this.proxy.addEventListener(function(e) {

      // Switch on the event name.
      var event = e.data.hasOwnProperty('event') ? e.data.event : false;
      if (event) {
        switch (event.name) {

          // Pass along chrome messages.
          case 'chromeMsg':
            if (window.postMessage) {
              window.postMessage(event, '*');
            }
            break;

          // Called when the iframe has initalized.
          case 'init':
            self.isLoading = false;
            loading.remove();

            // Add the custom style to the iframe.
            if (self.options.style) {
              self.proxy.post({event: {
                name: 'addStyle',
                data: self.options.style
              }});
            }

            // Set the height
            iframe.height(event.height).attr('height', event.height + 'px');
            break;

          // Called when the process is complete.
          case 'complete':
            self.options.complete.call(self, event);
            break;

          // See when the server is ready.
          case 'serverReady':
            if (self.pluginReady) {
              self.proxy.post({event: {name: 'chromePluginReady'}});
            }
            break;
        }
      }
    });
  };
}(window, document, window.allplayers, jQuery));
