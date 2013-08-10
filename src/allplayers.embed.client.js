var allplayers = allplayers || {embed: {}};

if (!jQuery.fn.allplayers_client) {

  /**
   * Define the jQuery plugin.
   *
   * @param {object} options The options for this plugin.
   * @return {object} A jQuery object.
   * @this The jQuery context for each element.
   **/
  jQuery.fn.allplayers_client = function(options) {
    return jQuery(this).each(function() {
      new allplayers.embed.client(options, jQuery(this));
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

  // Set the spinner if it isn't set.
  if (!this.options.spinner) {
    this.options.spinner = this.options.base;
    this.options.spinner += '/sites/all/themes/basic_foundation';
    this.options.spinner += '/images/loader.gif';
  }

  // Say that the plugin isn't ready.
  this.pluginReady = false;

  // Add the loading and iframe.
  var loading = jQuery(document.createElement('div')).css({
    background: 'url(' + this.options.spinner + ') no-repeat 83px 23px',
    padding: '20px',
    width: '120px'
  });

  // Add the loading text.
  loading.append(this.options.loading);

  // Add the iframe.
  var iframeId = this.context.attr('id') + '_iframe';

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
  if (this.options.src) {
    source = this.options.src;
  }
  else {

    // Start the source out on the base.
    source = this.options.base + '/';

    // See if they provide their own query.
    var q = allplayers.embed.client.getParam('apq');
    if (q) {
      source += q;
    }
    else {
      source += 'g/' + this.options.group;
      switch (this.options.type) {
        case 'registration':
          source += '/register';
          break;
        case 'forms':
          source += '/forms';
          break;
      }
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
  source += 'esrc=' + jQuery.base64('btoa', window.location.href, true);

  // Add the iframe ID to the iframe source.
  source += '#' + iframeId;

  var iframe = jQuery(document.createElement('iframe')).attr({
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

  var self = this;

  // Pass along chrome message responses to the server.
  if (typeof window.postMessage !== 'undefined') {
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
          if (typeof window.postMessage !== 'undefined') {
            window.postMessage(event, '*');
          }
          break;

        // Called when the iframe has initalized.
        case 'init':
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
