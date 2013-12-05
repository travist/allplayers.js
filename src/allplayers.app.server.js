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
 * Initialize the allplayer app library.
 */
allplayers.app.server.prototype.init = function() {

  // Call the parent.
  allplayers.app.prototype.init.call(this);

  // Get the base URL of the embed page.
  this.baseURL = 'https://platform.allplayers.com';
  if (this.options.base) {
    this.baseURL = this.options.base;
  }

  // Say we are loading.
  this.isLoading = true;

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
  var q = allplayers.app.getParam('apq');
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

  // Used for callbacks.
  var self = this;

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

  // Get the iframe object.
  var iframeObj = iframe.eq(0)[0];

  // The chrome plugin is ready.
  $.pm.bind('chromePluginReady', function() {
    self.pluginReady = true;
  });

  // Pass along chrome message responses.
  $.pm.bind('chromeMsgResp', function(data) {
    $.pm({
      target: window.frames,
      url: self.baseURL,
      type: 'chromeMsgResp',
      data: data
    });
  });

  // Pass along the chrome messages.
  $.pm.bind('chromeMsg', function(data) {
    $.pm({
      target: window,
      type: 'chromeMsg',
      data: data
    });
  });

  // The init message.
  $.pm.bind('init', function(data) {
    self.isLoading = false;
    loading.remove();

    // Set the height
    iframe.height(data.height).attr('height', data.height + 'px');
    return data;
  });

  // The addProduct message.
  $.pm.bind('addProduct', function(data) {
    // Add the returned data to the form and submit.
    $('<input>').attr({
      type: 'hidden',
      name: 'add-product[]',
      value: JSON.stringify(data)
    }).appendTo('form');
    $('#edit-next').val('Continue');
  });

  // The client ready message.
  $.pm.bind('clientReady', function(data) {
    if (self.pluginReady) {
      $.pm({
        target: window.frames,
        url: self.baseURL,
        type: 'chromePluginReady'
      });
    }
    // Send them the registration object.
    $.pm({
      target: window.frames,
      url: self.baseURL,
      type: 'getRegistration',
      data: self.options.reg
    });
  });

};
