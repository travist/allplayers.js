var allplayers = allplayers || {app: {}};

if (!jQuery.fn.allplayers_server) {

  /**
   * Define the jQuery plugin.
   *
   * @param {object} options The options for this plugin.
   * @return {object} A jQuery object.
   * @this The jQuery context for each element.
   **/
  jQuery.fn.allplayers_server = function(options) {
    return jQuery(this).each(function() {
      new allplayers.app.server(options, jQuery(this));
    });
  };
}

/**
 * The allplayers app server.
 *
 * @param {object} options The options for this app server.
 * @param {object} context The display context for this plugin.
 * @this The allplayers.app.server.
 */
allplayers.app.server = function(options, context) {

  // Store the context.
  this.context = context;

  // Call the allplayers.app constructor.
  allplayers.app.call(this, options, {
    spinner: '',
    loading: 'Loading',
    base: 'https://platform.allplayers.com',
    type: 'registration',
    group: 'api',
    query: {},
    reg: {},
    src: '',
    style: '',
    complete: function() {}
  });
};

/** Derive from allplayers.app. */
allplayers.app.server.prototype = new allplayers.app();

/** Reset the constructor. */
allplayers.app.server.prototype.constructor = allplayers.app.server;

/**
 * Return the value of a parameter.
 *
 * @param {string} name The name of the parameter to get.
 * @return {string} The value of the parameter.
 */
allplayers.app.server.getParam = function(name) {
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
 * Initialize the allplayer app library.
 */
allplayers.app.server.prototype.init = function() {

  // Call the parent.
  allplayers.app.prototype.init.call(this);

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
    background: 'url(' + this.options.spinner + ') no-repeat 10px 13px',
    padding: '10px 10px 10px 60px',
    width: '100%'
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

  // See if they provide their own query.
  var q = allplayers.app.server.getParam('apq');
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

  // Add the app source to the url.
  source += (source.search(/\?/) === -1) ? '?' : '&';

  // If they have some query options then add them here.
  if (!isEmptyObject(this.options.query)) {
    for (var param in this.options.query) {
      source += param + '=' + encodeURIComponent(this.options.query[param]);
      source += '&';
    }
  }

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

          // Set the height
          iframe.height(event.height).attr('height', event.height + 'px');
          break;

        // Called when the client wants to add a product.
        case 'addProduct':
          // Add the returned data to the form and submit.
          $('<input>').attr({
            type: 'hidden',
            name: 'add-product[]',
            value: JSON.stringify(event.params)
          }).appendTo('form');
          $('#edit-next').val('Continue');
          break;

        // See when the server is ready.
        case 'clientReady':
          if (self.pluginReady) {
            self.proxy.post({event: {name: 'chromePluginReady'}});
          }
          // Send them the registration object.
          self.proxy.post({
            event: {name: 'getRegistration'},
            reg: self.options.reg
          });
          break;
      }
    }
  });
};
