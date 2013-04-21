(function(){var a=false,b=/xyz/.test(function(){xyz})?/\b_super\b/:/.*/;this.Class=function(){};Class.extend=function(g){var f=this.prototype;a=true;var e=new this();a=false;for(var d in g){e[d]=typeof g[d]=="function"&&typeof f[d]=="function"&&b.test(g[d])?(function(h,i){return function(){var k=this._super;this._super=f[h];var j=i.apply(this,arguments);this._super=k;return j}})(d,g[d]):g[d]}function c(){if(!a&&this.init){this.init.apply(this,arguments)}}c.prototype=e;c.prototype.constructor=c;c.extend=arguments.callee;return c}})();(function(c){var b={trace:function(d){if(c.console!==undefined){c.console.log("Porthole: "+d)}},error:function(d){if(c.console!==undefined){c.console.error("Porthole: "+d)}}};b.WindowProxy=function(){};b.WindowProxy.prototype={post:function(e,d){},addEventListener:function(d){},removeEventListener:function(d){}};b.WindowProxyBase=Class.extend({init:function(d){if(d===undefined){d=""}this.targetWindowName=d;this.origin=c.location.protocol+"//"+c.location.host;this.eventListeners=[]},getTargetWindowName:function(){return this.targetWindowName},getOrigin:function(){return this.origin},getTargetWindow:function(){return b.WindowProxy.getTargetWindow(this.targetWindowName)},post:function(e,d){if(d===undefined){d="*"}this.dispatchMessage({data:e,sourceOrigin:this.getOrigin(),targetOrigin:d,sourceWindowName:c.name,targetWindowName:this.getTargetWindowName()})},addEventListener:function(d){this.eventListeners.push(d);return d},removeEventListener:function(g){var d;try{d=this.eventListeners.indexOf(g);this.eventListeners.splice(d,1)}catch(h){this.eventListeners=[]}},dispatchEvent:function(f){var d;for(d=0;d<this.eventListeners.length;d++){try{this.eventListeners[d](f)}catch(g){}}}});b.WindowProxyLegacy=b.WindowProxyBase.extend({init:function(d,e){this._super(e);if(d!==null){this.proxyIFrameName=this.targetWindowName+"ProxyIFrame";this.proxyIFrameLocation=d;this.proxyIFrameElement=this.createIFrameProxy()}else{this.proxyIFrameElement=null;throw new Error("proxyIFrameUrl can't be null")}},createIFrameProxy:function(){var d=document.createElement("iframe");d.setAttribute("id",this.proxyIFrameName);d.setAttribute("name",this.proxyIFrameName);d.setAttribute("src",this.proxyIFrameLocation);d.setAttribute("frameBorder","1");d.setAttribute("scrolling","auto");d.setAttribute("width",30);d.setAttribute("height",30);d.setAttribute("style","position: absolute; left: -100px; top:0px;");if(d.style.setAttribute){d.style.setAttribute("cssText","position: absolute; left: -100px; top:0px;")}document.body.appendChild(d);return d},dispatchMessage:function(e){var d=c.encodeURIComponent;if(this.proxyIFrameElement){var f=this.proxyIFrameLocation+"#"+d(b.WindowProxy.serialize(e));this.proxyIFrameElement.setAttribute("src",f);this.proxyIFrameElement.height=this.proxyIFrameElement.height>50?50:100}}});b.WindowProxyHTML5=b.WindowProxyBase.extend({init:function(d,e){this._super(e);this.eventListenerCallback=null},dispatchMessage:function(d){this.getTargetWindow().postMessage(b.WindowProxy.serialize(d),d.targetOrigin)},addEventListener:function(e){if(this.eventListeners.length===0){var d=this;this.eventListenerCallback=function(f){d.eventListener(d,f)};c.addEventListener("message",this.eventListenerCallback,false)}return this._super(e)},removeEventListener:function(d){this._super(d);if(this.eventListeners.length===0){c.removeEventListener("message",this.eventListenerCallback);this.eventListenerCallback=null}},eventListener:function(e,d){var f=b.WindowProxy.unserialize(d.data);if(f&&(e.targetWindowName==""||f.sourceWindowName==e.targetWindowName)){e.dispatchEvent(new b.MessageEvent(f.data,d.origin,e))}}});if(typeof c.postMessage!=="function"){b.trace("Using legacy browser support");b.WindowProxy=b.WindowProxyLegacy.extend({})}else{b.trace("Using built-in browser support");b.WindowProxy=b.WindowProxyHTML5.extend({})}b.WindowProxy.serialize=function(d){if(typeof JSON==="undefined"){throw new Error("Porthole serialization depends on JSON!")}return JSON.stringify(d)};b.WindowProxy.unserialize=function(g){if(typeof JSON==="undefined"){throw new Error("Porthole unserialization dependens on JSON!")}try{var d=JSON.parse(g)}catch(f){return false}return d};b.WindowProxy.getTargetWindow=function(d){if(d===""){return top}else{if(d==="top"||d==="parent"){return c[d]}}return parent.frames[d]};b.MessageEvent=function a(f,d,e){this.data=f;this.origin=d;this.source=e};b.WindowProxyDispatcher={forwardMessageEvent:function(i){var g,h=c.decodeURIComponent,f,d;if(document.location.hash.length>0){g=b.WindowProxy.unserialize(h(document.location.hash.substr(1)));f=b.WindowProxy.getTargetWindow(g.targetWindowName);d=b.WindowProxyDispatcher.findWindowProxyObjectInWindow(f,g.sourceWindowName);if(d){if(d.origin===g.targetOrigin||g.targetOrigin==="*"){d.dispatchEvent(new b.MessageEvent(g.data,g.sourceOrigin,d))}else{b.error("Target origin "+d.origin+" does not match desired target of "+g.targetOrigin)}}else{b.error("Could not find window proxy object on the target window")}}},findWindowProxyObjectInWindow:function(d,g){var f;if(d.RuntimeObject){d=d.RuntimeObject()}if(d){for(f in d){if(d.hasOwnProperty(f)){try{if(d[f]!==null&&typeof d[f]==="object"&&d[f] instanceof d.Porthole.WindowProxy&&d[f].getTargetWindowName()===g){return d[f]}}catch(h){}}}}return null},start:function(){if(c.addEventListener){c.addEventListener("resize",b.WindowProxyDispatcher.forwardMessageEvent,false)}else{if(document.body.attachEvent){c.attachEvent("onresize",b.WindowProxyDispatcher.forwardMessageEvent)}else{b.error("Cannot attach resize event")}}}};if(typeof c.exports!=="undefined"){c.exports.Porthole=b}else{c.Porthole=b}})(this);var allplayers = allplayers || {};

/**
 * Create the embedded class.
 *
 * @param {object} options The options for this embed library.
 * @param {object} defaults The default params for this libarary.
 * @this The allplayers.embed object.
 */
allplayers.embed = function(options, defaults) {
  if (defaults) {

    // Keep track of the self pointer.
    var self = this;

    // Add the proxy default.
    defaults.proxy = 'https://www.allplayers.com';
    defaults.proxy += '/sites/all/libraries/porthole/src/proxy.html';

    // Set the defaults.
    options = options || {};
    for (var name in defaults) {
      if (!options.hasOwnProperty(name)) {
        options[name] = defaults[name];
      }
    }

    // Set the options and initialize.
    this.options = options;
    this.init();
  }
};

/**
 * Initialize this embed code.
 */
allplayers.embed.prototype.init = function() {
  document.proxy = this;
};
var allplayers = allplayers || {embed: {}};

/**
 * The allplayers embed server.
 *
 * @param {object} options The options for this embed server.
 * @this The allplayers.embed.client.
 */
allplayers.embed.server = function(options) {
  allplayers.embed.call(this, options, {
    getContainer: function() {
      return jQuery();
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

  this.container = this.options.getContainer();
  this.height = 0;
  this.heightTimer = null;
  this.queue = {};

  // Keep track of the self pointer.
  var self = this;

  // Send document stats via porthole message.
  this.proxy = new Porthole.WindowProxy(this.options.proxy);

  // Bind to the document resize event.
  var throttle = null;
  jQuery(document).bind('DOMSubtreeModified', function() {
    if (throttle) {
      clearTimeout(throttle);
    }
    throttle = setTimeout(function() {
      self.height = 0;
      self.resize();
    }, 500);
  });

  // If we are on the complete page, then say so...
  if (this.options.isComplete()) {
    this.proxy.post({event: {
      'name': 'complete'
    }});
  }

  // Add an event listener.
  this.proxy.addEventListener(function(e) {

    // Switch on the event name.
    var event = e.data.hasOwnProperty('event') ? e.data.event : false;
    if (event) {
      switch (event.name) {

        // Handle the message response.
        case 'chromeMsgResp':

          // Call our callback with the response.
          if (event.data.hasOwnProperty('guid') &&
              self.queue.hasOwnProperty(event.data.guid)) {
            self.queue[event.data.guid](event.data.response);
          }
          break;
      }
    }
  });

  // Trigger the resizing events.
  this.resize();
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
  this.proxy.post({event: {
    name: 'chromeMsg',
    data: msg
  }});

  // Add the callback to the queue.
  this.queue[msg.guid] = callback;
};

/**
 * Initialize the allplayer embed library.
 */
allplayers.embed.server.prototype.resize = function() {

  // Change all links to reference platform instead of www.
  jQuery('a[href^="https://www."]', this.container).each(function() {

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

      // Send the event to resize the iframe.
      self.proxy.post({
        'height': self.height,
        'event': {
          'name': 'init',
          'height' : self.height,
          'id' : window.location.hash
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
