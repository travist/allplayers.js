/**
 The MIT License

 Copyright (c) 2010 Daniel Park (http://metaweb.com, http://postmessage.freebaseapps.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 **/
var NO_JQUERY = {};
(function(window, $, undefined) {

     if (!("console" in window)) {
         var c = window.console = {};
         c.log = c.warn = c.error = c.debug = function(){};
     }

     if ($ === NO_JQUERY) {
         // jQuery is optional
         $ = {
             fn: {},
             extend: function() {
                 var a = arguments[0];
                 for (var i=1,len=arguments.length; i<len; i++) {
                     var b = arguments[i];
                     for (var prop in b) {
                         a[prop] = b[prop];
                     }
                 }
                 return a;
             }
         };
     }

     $.fn.pm = function() {
         console.log("usage: \nto send:    $.pm(options)\nto receive: $.pm.bind(type, fn, [origin])");
         return this;
     };

     // send postmessage
     $.pm = window.pm = function(options) {
         pm.send(options);
     };

     // bind postmessage handler
     $.pm.bind = window.pm.bind = function(type, fn, origin, hash, async_reply) {
         pm.bind(type, fn, origin, hash, async_reply === true);
     };

     // unbind postmessage handler
     $.pm.unbind = window.pm.unbind = function(type, fn) {
         pm.unbind(type, fn);
     };

     // default postmessage origin on bind
     $.pm.origin = window.pm.origin = null;

     // default postmessage polling if using location hash to pass postmessages
     $.pm.poll = window.pm.poll = 200;

     var pm = {

         send: function(options) {
             var o = $.extend({}, pm.defaults, options),
             target = o.target;
             if (!o.target) {
                 console.warn("postmessage target window required");
                 return;
             }
             if (!o.type) {
                 console.warn("postmessage type required");
                 return;
             }
             var msg = {data:o.data, type:o.type};
             if (o.success) {
                 msg.callback = pm._callback(o.success);
             }
             if (o.error) {
                 msg.errback = pm._callback(o.error);
             }
             if (("postMessage" in target) && !o.hash) {
                 pm._bind();
                 target.postMessage(JSON.stringify(msg), o.origin || '*');
             }
             else {
                 pm.hash._bind();
                 pm.hash.send(o, msg);
             }
         },

         bind: function(type, fn, origin, hash, async_reply) {
           pm._replyBind ( type, fn, origin, hash, async_reply );
         },
       
         _replyBind: function(type, fn, origin, hash, isCallback) {
           if (("postMessage" in window) && !hash) {
               pm._bind();
           }
           else {
               pm.hash._bind();
           }
           var l = pm.data("listeners.postmessage");
           if (!l) {
               l = {};
               pm.data("listeners.postmessage", l);
           }
           var fns = l[type];
           if (!fns) {
               fns = [];
               l[type] = fns;
           }
           fns.push({fn:fn, callback: isCallback, origin:origin || $.pm.origin});
         },

         unbind: function(type, fn) {
             var l = pm.data("listeners.postmessage");
             if (l) {
                 if (type) {
                     if (fn) {
                         // remove specific listener
                         var fns = l[type];
                         if (fns) {
                             var m = [];
                             for (var i=0,len=fns.length; i<len; i++) {
                                 var o = fns[i];
                                 if (o.fn !== fn) {
                                     m.push(o);
                                 }
                             }
                             l[type] = m;
                         }
                     }
                     else {
                         // remove all listeners by type
                         delete l[type];
                     }
                 }
                 else {
                     // unbind all listeners of all type
                     for (var i in l) {
                       delete l[i];
                     }
                 }
             }
         },

         data: function(k, v) {
             if (v === undefined) {
                 return pm._data[k];
             }
             pm._data[k] = v;
             return v;
         },

         _data: {},

         _CHARS: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),

         _random: function() {
             var r = [];
             for (var i=0; i<32; i++) {
                 r[i] = pm._CHARS[0 | Math.random() * 32];
             };
             return r.join("");
         },

         _callback: function(fn) {
             var cbs = pm.data("callbacks.postmessage");
             if (!cbs) {
                 cbs = {};
                 pm.data("callbacks.postmessage", cbs);
             }
             var r = pm._random();
             cbs[r] = fn;
             return r;
         },

         _bind: function() {
             // are we already listening to message events on this w?
             if (!pm.data("listening.postmessage")) {
                 if (window.addEventListener) {
                     window.addEventListener("message", pm._dispatch, false);
                 }
                 else if (window.attachEvent) {
                     window.attachEvent("onmessage", pm._dispatch);
                 }
                 pm.data("listening.postmessage", 1);
             }
         },

         _dispatch: function(e) {
             //console.log("$.pm.dispatch", e, this);
             try {
                 var msg = JSON.parse(e.data);
             }
             catch (ex) {
                 console.warn("postmessage data invalid json: ", ex);
                 return;
             }
             if (!msg.type) {
                 console.warn("postmessage message type required");
                 return;
             }
             var cbs = pm.data("callbacks.postmessage") || {},
             cb = cbs[msg.type];
             if (cb) {
                 cb(msg.data);
             }
             else {
                 var l = pm.data("listeners.postmessage") || {};
                 var fns = l[msg.type] || [];
                 for (var i=0,len=fns.length; i<len; i++) {
                     var o = fns[i];
                     if (o.origin && o.origin !== '*' && e.origin !== o.origin) {
                         console.warn("postmessage message origin mismatch", e.origin, o.origin);
                         if (msg.errback) {
                             // notify post message errback
                             var error = {
                                 message: "postmessage origin mismatch",
                                 origin: [e.origin, o.origin]
                             };
                             pm.send({target:e.source, data:error, type:msg.errback});
                         }
                         continue;
                     }

                     function sendReply ( data ) {
                       if (msg.callback) {
                           pm.send({target:e.source, data:data, type:msg.callback});
                       }
                     }
                     
                     try {
                         if ( o.callback ) {
                           o.fn(msg.data, sendReply, e);
                         } else {
                           sendReply ( o.fn(msg.data, e) );
                         }
                     }
                     catch (ex) {
                         if (msg.errback) {
                             // notify post message errback
                             pm.send({target:e.source, data:ex, type:msg.errback});
                         } else {
                             throw ex;
                         }
                     }
                 };
             }
         }
     };

     // location hash polling
     pm.hash = {

         send: function(options, msg) {
             //console.log("hash.send", target_window, options, msg);
             var target_window = options.target,
             target_url = options.url;
             if (!target_url) {
                 console.warn("postmessage target window url is required");
                 return;
             }
             target_url = pm.hash._url(target_url);
             var source_window,
             source_url = pm.hash._url(window.location.href);
             if (window == target_window.parent) {
                 source_window = "parent";
             }
             else {
                 try {
                     for (var i=0,len=parent.frames.length; i<len; i++) {
                         var f = parent.frames[i];
                         if (f == window) {
                             source_window = i;
                             break;
                         }
                     };
                 }
                 catch(ex) {
                     // Opera: security error trying to access parent.frames x-origin
                     // juse use window.name
                     source_window = window.name;
                 }
             }
             if (source_window == null) {
                 console.warn("postmessage windows must be direct parent/child windows and the child must be available through the parent window.frames list");
                 return;
             }
             var hashmessage = {
                 "x-requested-with": "postmessage",
                 source: {
                     name: source_window,
                     url: source_url
                 },
                 postmessage: msg
             };
             var hash_id = "#x-postmessage-id=" + pm._random();
             target_window.location = target_url + hash_id + encodeURIComponent(JSON.stringify(hashmessage));
         },

         _regex: /^\#x\-postmessage\-id\=(\w{32})/,

         _regex_len: "#x-postmessage-id=".length + 32,

         _bind: function() {
             // are we already listening to message events on this w?
             if (!pm.data("polling.postmessage")) {
                 setInterval(function() {
                                 var hash = "" + window.location.hash,
                                 m = pm.hash._regex.exec(hash);
                                 if (m) {
                                     var id = m[1];
                                     if (pm.hash._last !== id) {
                                         pm.hash._last = id;
                                         pm.hash._dispatch(hash.substring(pm.hash._regex_len));
                                     }
                                 }
                             }, $.pm.poll || 200);
                 pm.data("polling.postmessage", 1);
             }
         },

         _dispatch: function(hash) {
             if (!hash) {
                 return;
             }
             try {
                 hash = JSON.parse(decodeURIComponent(hash));
                 if (!(hash['x-requested-with'] === 'postmessage' &&
                       hash.source && hash.source.name != null && hash.source.url && hash.postmessage)) {
                     // ignore since hash could've come from somewhere else
                     return;
                 }
             }
             catch (ex) {
                 // ignore since hash could've come from somewhere else
                 return;
             }
             var msg = hash.postmessage,
             cbs = pm.data("callbacks.postmessage") || {},
             cb = cbs[msg.type];
             if (cb) {
                 cb(msg.data);
             }
             else {
                 var source_window;
                 if (hash.source.name === "parent") {
                     source_window = window.parent;
                 }
                 else {
                     source_window = window.frames[hash.source.name];
                 }
                 var l = pm.data("listeners.postmessage") || {};
                 var fns = l[msg.type] || [];
                 for (var i=0,len=fns.length; i<len; i++) {
                     var o = fns[i];
                     if (o.origin) {
                         var origin = /https?\:\/\/[^\/]*/.exec(hash.source.url)[0];
                         if (o.origin !== '*' && origin !== o.origin) {
                             console.warn("postmessage message origin mismatch", origin, o.origin);
                             if (msg.errback) {
                                 // notify post message errback
                                 var error = {
                                     message: "postmessage origin mismatch",
                                     origin: [origin, o.origin]
                                 };
                                 pm.send({target:source_window, data:error, type:msg.errback, hash:true, url:hash.source.url});
                             }
                             continue;
                         }
                     }

                     function sendReply ( data ) {
                       if (msg.callback) {
                         pm.send({target:source_window, data:data, type:msg.callback, hash:true, url:hash.source.url});
                       }
                     }
                     
                     try {
                         if ( o.callback ) {
                           o.fn(msg.data, sendReply);
                         } else {
                           sendReply ( o.fn(msg.data) );
                         }
                     }
                     catch (ex) {
                         if (msg.errback) {
                             // notify post message errback
                             pm.send({target:source_window, data:ex, type:msg.errback, hash:true, url:hash.source.url});
                         } else {
                             throw ex;
                         }
                     }
                 };
             }
         },

         _url: function(url) {
             // url minus hash part
             return (""+url).replace(/#.*$/, "");
         }

     };

     $.extend(pm, {
                  defaults: {
                      target: null,  /* target window (required) */
                      url: null,     /* target window url (required if no window.postMessage or hash == true) */
                      type: null,    /* message type (required) */
                      data: null,    /* message data (required) */
                      success: null, /* success callback (optional) */
                      error: null,   /* error callback (optional) */
                      origin: "*",   /* postmessage origin (optional) */
                      hash: false    /* use location hash for message passing (optional) */
                  }
              });

 })(this, typeof jQuery === "undefined" ? NO_JQUERY : jQuery);

/**
 * http://www.JSON.org/json2.js
 **/
if (! ("JSON" in window && window.JSON)){JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z"};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==="string"){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());
(function(window, document, $, undefined) {
  // Base seamless functionality between parent and child.
  $.SeamlessBase = {

    /**
     * Returns the value of a query parameter.
     *
     * @param string name
     *   The name of the query parameter to retrieve.
     *
     * @param string from
     *   The string to get the query parameter from.
     *
     * @returns {string}
     *   The value of the query parameter.
     */
    getParam: function(name, from) {
      from = from || window.location.search;
      var regexS = '[?&]' + name + '=([^&#]*)';
      var regex = new RegExp(regexS);
      var results = regex.exec(from);
      if (results === null) {
        return '';
      }
      else {
        return decodeURIComponent(results[1].replace(/\+/g, ' '));
      }
    },

    /**
     * Filters text to remove markup tags.
     *
     * @param text
     * @returns {XML|string|*|void}
     */
    filterText: function(text) {
      return text.replace(/[<>]/g, '');
    },

    /**
     * Determine if an object is empty.
     *
     * @param object obj
     *   The object to check to see if it is empty.
     */
    isEmptyObject: function(obj) {
      var name;
      for (name in obj) {
        return false;
      }
      return true;
    },

    /**
     * Set the styles on an element.
     *
     * @param {object} element
     *   The DOM Element you would like to set the styles.
     * @param {array} styles
     *   The styles to add to the element.
     */
    setStyle: function(element, styles) {

      // Make sure they have styles to inject.
      if (styles.length > 0) {

        // Convert to the right format.
        styles = (typeof styles == 'string') ? styles : styles.join(' ');

        // Keep them from escaping the styles tag.
        styles = $.SeamlessBase.filterText(styles);

        // Add the style to the element.
        if (element.styleSheet) {
          element.styleSheet.cssText = styles;
        }
        else {
          $(element).html(styles);
        }
      }
    },

    /**
     * Provide a cross broser method to inject styles.
     *
     * @param {array} styles
     *   An array of styles to inject.
     */
    injectStyles: function(styles) {

      // See if there are new styles to inject.
      var injectedStyles = $('style#injected-styles');
      if (injectedStyles.length > 0) {
        $.SeamlessBase.setStyle(injectedStyles[0], styles);
      }
      else {

        // Inject the styles.
        var css = $(document.createElement('style')).attr({
          type: 'text/css',
          id: 'injected-styles'
        });
        $.SeamlessBase.setStyle(css[0], styles);
        $('head').append(css);
      }
    }
  };
})(window, document, jQuery);
(function(window, document, $, undefined) {
  /**
   * Create a seamless connection between parent and child frames.
   *
   * @param target
   * @param url
   * @constructor
   */
  $.SeamlessConnection = function(target, url) {
    this.id = 0;
    this.target = target;
    this.url = url;
    this.active = false;
    this.queue = [];
  };

  /**
   * Send a message to the connected frame.
   *
   * @param pm
   */
  $.SeamlessConnection.prototype.send = function(pm) {

    // Only send if the target is set.
    if (this.active && this.target) {

      // Normalize the data.
      if (!pm.hasOwnProperty('data')) {
        pm = {data: pm};
      }

      // Set the other parameters.
      pm.target = this.target;
      pm.url = this.url;
      pm.type = pm.type || 'seamless_data';
      pm.data = pm.data || {};
      pm.data.__id = this.id;
      $.pm(pm);
    }
    else {

      // Add this to the queue.
      this.queue.push(pm);
    }
  };

  /**
   * Receive a message from a connected frame.
   */
  $.SeamlessConnection.prototype.receive = function(type, callback) {
    if (typeof type === 'function') {
      callback = type;
      type = 'seamless_data';
    }

    // Store the this pointer.
    var _self = this;

    // Listen for events.
    $.pm.bind(type, function(data, event) {

      // Only handle data if the connection id's match.
      if (data.__id && (data.__id === _self.id)) {
        return callback(data, event);
      }
      else {

        // Do not handle this event.
        return false;
      }
    });
  };

  /**
   * Sets this connection as active.
   *
   * @param active
   */
  $.SeamlessConnection.prototype.setActive = function(active) {
    this.active = active;

    // Empty the send queue if we have one.
    if (this.queue.length > 0) {
      for(var i in this.queue) {
        this.send(this.queue[i]);
      }
      this.queue = [];
      this.queue.length = 0;
    }
  };
})(window, document, jQuery);
(function(window, document, $, undefined) {

  // Make sure we have the $.pm module loaded.
  if (!$.hasOwnProperty('pm')) {
    console.log('You must install the jQuery.pm module to use seamless.js.');
    return;
  }

  // If any iframe page sends this message, then reload the page.
  $.pm.bind('seamless_noiframe', function(data) {
    // Remove the 'noifame' query parameters.
    data.href = data.href.replace(/noiframe\=[^&?#]+/, '');
    window.location.replace(data.href);
  });

  // Create a way to open the iframe in a separate window.
  window.seamlessOpenFallback = function(src, width, height, event) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
    else {
      event.returnValue = false;
    }
    window.open(src, '', [
      'width=' + width,
      'height=' + height,
      'menubar=no',
      'titlebar=no',
      'toolbar=no',
      'status=no',
      'scrollbars=yes',
      'chrome=yes'
    ].join(','));
  };

  // Keep track of the next connection ID.
  var seamlessFrames = [];
  var connecting = false;
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  /**
   * Creates a connection ID.
   */
  var getConnectionId = function() {
    var r = [];
    for (var i=0; i < 32; i++) {
      r[i] = chars[0 | Math.random() * 32];
    }
    return r.join("");
  };

  // Call when each child is ready.
  $.pm.bind('seamless_ready', function(data, event) {

    // Only do this if we are not already connecting.
    if (!connecting) {

      // Say we are connecting.
      connecting = true;

      // Iterate through all of our iframes.
      for (var i in seamlessFrames) {

        // Make sure the seamless_ready is a function.
        if (seamlessFrames.hasOwnProperty(i)) {

          // Say that this iframe is ready.
          seamlessFrames[i].seamless_ready(data, event);
        }
      }

      // Say we are no longer connecting.
      connecting = false;
    }
  });

  // Handle the child update message.
  $.pm.bind('seamless_update', function(data, event) {

    // Iterate through all of our iframes.
    for (var i in seamlessFrames) {

      if (seamlessFrames.hasOwnProperty(i)) {

        // Get the iframe.
        var iframe = seamlessFrames[i];

        // Only process if the connection ID's match.
        if (iframe.connection.id === data.__id) {

          // Call this iframes update
          return iframe.seamless_update(data, event);
        }
      }
    }

    // Return that nothing was done.
    data.height = 0;
    return data;
  });

  // If an error occurs.
  $.pm.bind('seamless_error', function(data, event) {

    // Iterate through all of our iframes.
    for (var i in seamlessFrames) {

      if (seamlessFrames.hasOwnProperty(i)) {

        // Fallback this iframe.
        seamlessFrames[i].seamless_error(data, event);
      }
    }
  });

  /**
   * Create the seamless.js plugin.
   */
  $.fn.seamless = function(options) {

    // The default arguments.
    var defaults = {
      loading: 'Loading ...',
      spinner: 'http://www.travistidwell.com/seamless.js/src/loader.gif',
      onConnect: null,
      styles: [],
      fallback: true,
      fallbackParams: '',
      fallbackText: '',
      fallbackLinkText: 'Click here',
      fallbackLinkAfter: ' to open in a separate window.',
      fallbackStyles: [
        'padding: 15px',
        'border: 1px solid transparent',
        'border-radius: 4px',
        'color: #3a87ad',
        'background-color: #d9edf7',
        'border-color: #bce8f1'
      ],
      fallbackLinkStyles: [
        'display: inline-block',
        'color: #333',
        'border: 1px solid #ccc',
        'background-color: #fff',
        'padding: 5px 10px',
        'text-decoration: none',
        'font-size: 12px',
        'line-height: 1.5',
        'border-radius: 6px',
        'font-weight: 400',
        'cursor: pointer',
        '-webkit-user-select: none',
        '-moz-user-select: none',
        '-ms-user-select: none',
        'user-select: none'
      ],
      fallbackLinkHoverStyles: [
        'background-color:#ebebeb',
        'border-color:#adadad'
      ],
      fallbackWindowWidth: 960,
      fallbackWindowHeight: 800
    };

    // Set the defaults if they are not provided.
    options = options || {};
    for (var name in defaults) {
      if (!options.hasOwnProperty(name)) {
        options[name] = defaults[name];
      }
    }

    // Only work with the first iframe object.
    var iframe = $(this).eq(0);

    // Set the seamless_options in the iframe.
    iframe.seamless_options = options;

    // Add this to the global seamless frames object.
    seamlessFrames.push(iframe);

    // Get the name of the iframe.
    var id = iframe.attr('name') || iframe.attr('id');

    // Get the iframe source.
    var src = iframe.attr('src');

    // The connection object.
    iframe.connection = new $.SeamlessConnection(iframe[0].contentWindow, src);

    // Assign the send and receive functions to the iframe.
    iframe.send = function(pm) {
      iframe.connection.send.call(iframe.connection, pm);
    };
    iframe.receive = function(type, callback) {
      iframe.connection.receive.call(iframe.connection, type, callback);
    };

    // Add the necessary attributes.
    iframe.attr({
      'scrolling': 'no',
      'seamless': 'seamless',
      'width': '100%',
      'height': '0px',
      'marginheight': '0',
      'marginwidth': '0',
      'frameborder': '0',
      'horizontalscrolling': 'no',
      'verticalscrolling': 'no'
    }).css({
      border: 'none',
      overflowY: 'hidden'
    });

    // Create the loading div.
    var loading = $(document.createElement('div')).css({
      background: 'url(' + options.spinner + ') no-repeat 10px 13px',
      padding: '10px 10px 10px 60px',
      width: '100%'
    });

    // We are loading.
    var isLoading = true;

    // Append the text.
    loading.append(options.loading);

    // Prepend the loading text.
    iframe.before(loading);

    // If they wish to have a fallback.
    if (options.fallback) {

      // Get the iframe src.
      if (options.fallbackParams) {
        src += (src.search(/\?/) === -1) ? '?' : '&';
        src += options.fallbackParams;
      }

      var fallbackStyles = $('#seamless-fallback-styles');
      if (!fallbackStyles.length) {

        // Get styles from a setting.
        var getStyles = function(stylesArray) {

          // Join the array, and strip out markup.
          return $.SeamlessBase.filterText(stylesArray.join(';'));
        };

        // Create the fallback styles.
        fallbackStyles = $(document.createElement('style')).attr({
          'id': 'seamless-fallback-styles',
          'type': 'text/css'
        });

        // Set the styles for the fallback.
        $.SeamlessBase.setStyle(fallbackStyles[0],
          '.seamless-fallback.seamless-styles {' + getStyles(options.fallbackStyles) + '}' +
          '.seamless-fallback em { padding: 5px; }' +
          '.seamless-fallback-link.seamless-styles {' + getStyles(options.fallbackLinkStyles) + '}' +
          '.seamless-fallback-link.seamless-styles:hover {' + getStyles(options.fallbackLinkHoverStyles) + '}'
        );

        // Add the styles before the iframe.
        iframe.before(fallbackStyles);
      }

      // The arguments to pass to the onclick event.
      var onClickArgs = [
        '"' + src + '"',
        options.fallbackWindowWidth,
        options.fallbackWindowHeight
      ];

      // Create the fallback link.
      var fallbackLink = $(document.createElement('a')).attr({
        'class': 'seamless-fallback-link',
        'href': '#',
        'onclick': 'seamlessOpenFallback(' + onClickArgs.join(',') + ', event)'
      });

      // Create the fallback markup.
      var fallback = $(document.createElement('div')).attr({
        'class': 'seamless-fallback'
      });

      // Add the emphasis element for the text.
      fallback.append($(document.createElement('em')));

      // Set the iframe.
      iframe.after(fallback);

      /**
       * Set the fallback message for the iframe.
       * @param msg
       */
      var setFallback = function(msg, linkText, afterText, showStyles) {

        // If they wish to show the styles.
        if (showStyles) {
          fallback.addClass('seamless-styles');
          fallbackLink.addClass('seamless-styles');
        }
        else {
          fallback.removeClass('seamless-styles');
          fallbackLink.removeClass('seamless-styles');
        }

        // Set the text for the fallback.
        fallback.find('em')
          .text($.SeamlessBase.filterText(msg) + ' ')
          .append(fallbackLink.text($.SeamlessBase.filterText(linkText)))
          .append($.SeamlessBase.filterText(afterText));
      };

      // Set the default fallback.
      if (options.fallbackText) {

        // Create the fallback.
        setFallback(
          options.fallbackText,
          options.fallbackLinkText,
          options.fallbackLinkAfter,
          false
        );
      }

      // Handle all errors with a fallback message.
      $(window).error(function() {
        var msg = 'An error has been detected on this page, ';
        msg += 'which may cause problems with the operation of this application.';

        // Create the fallback.
        setFallback(
          msg,
          options.fallbackLinkText,
          options.fallbackLinkAfter,
          true
        );
      });

      // If nothing happens after 30 seconds, then assume something went wrong.
      setTimeout(function() {
        if (isLoading) {
          loading.remove();
          isLoading = false;

          // Create the fallback.
          setFallback(
            'An error has been detected on this page.',
            options.fallbackLinkText,
            options.fallbackLinkAfter,
            true
          );
        }
      }, 30000);
    }

    /**
     * Called when the child page is ready.
     */
    iframe.seamless_ready = function(data, event) {

      // If no connection ID is established, then set it.
      if (!iframe.connection.id) {
        iframe.connection.id = getConnectionId();
      }

      // Setup the connection data.
      var connectData = {
        id : iframe.connection.id,
        styles: iframe.seamless_options.styles
      };

      // Set the connection target.
      if (!iframe.connection.target) {
        iframe.connection.target = iframe[0].contentWindow;
      }

      // Send the connection message to the child page.
      $.pm({
        type: 'seamless_connect',
        target: iframe.connection.target,
        url: iframe.connection.url,
        data: connectData,
        success: function(data) {
          if (iframe.seamless_options.onConnect) {
            iframe.seamless_options.onConnect(data);
          }
        }
      });

      // Trigger an event.
      iframe.trigger('connected');
    };

    /**
     * Called when this iframe is updated with the child.
     *
     * @param data
     * @param event
     */
    iframe.seamless_update = function(data, event) {

      // See if we are loading.
      if (isLoading) {

        // Remove the loading indicator.
        loading.remove();
        isLoading = false;
        iframe.connection.setActive(true);
      }

      // If the height is greater than 0, then update.
      if (data.height > 0) {

        // Set the iframe height.
        iframe.height(data.height).attr('height', data.height + 'px');
      }

      // Return the data.
      return data;
    };

    /**
     * Open this iframe in a fallback window.
     */
    iframe.seamless_error = function(data, event) {

      // Remove the loader and hide the iframe.
      loading.remove();
      iframe.hide();
      isLoading = false;

      // Set the fallback text.
      setFallback(data.msg, data.linkText, data.afterText, true);
    };

    // Return the iframe.
    return iframe;
  };
})(window, document, jQuery);/** The global allplayers object. */
window.allplayers = window.allplayers || {};
(function(window, document, allplayers, undefined) {
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

  /* base64 encode/decode compatible with window.btoa/atob
   *
   * window.atob/btoa is a Firefox extension to convert binary data (the "b")
   * to base64 (ascii, the "a").
   *
   * It is also found in Safari and Chrome.  It is not available in IE.
   *
   * if (!window.btoa) window.btoa = base64.encode
   * if (!window.atob) window.atob = base64.decode
   *
   * The original spec's for atob/btoa are a bit lacking
   * https://developer.mozilla.org/en/DOM/window.atob
   * https://developer.mozilla.org/en/DOM/window.btoa
   *
   * window.btoa and base64.encode takes a string where charCodeAt is [0,255]
   * If any character is not [0,255], then an DOMException(5) is thrown.
   *
   * window.atob and base64.decode take a base64-encoded string
   * If the input length is not a multiple of 4, or contains invalid characters
   *   then an DOMException(5) is thrown.
   */
  var base64 = {};

  // Changed "=" to "," to make it URL compatible.
  base64.PADCHAR = ',';
  base64.ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Changed "+/" to "-_" to make it URL compatible.
  base64.ALPHA += 'abcdefghijklmnopqrstuvwxyz0123456789-_';

  base64.makeDOMException = function() {
    // sadly in FF,Safari,Chrome you can't make a DOMException
    var e;

    try {
      return new DOMException(DOMException.INVALID_CHARACTER_ERR);
    } catch (caught) {
      // not available, just passback a duck-typed equiv
      // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error
      // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error/prototype
      var ex = new Error('DOM Exception 5');

      // ex.number and ex.description is IE-specific.
      ex.code = ex.number = 5;
      ex.name = ex.description = 'INVALID_CHARACTER_ERR';

      // Safari/Chrome output format
      ex.toString = function() {
        return 'Error: ' + ex.name + ': ' + ex.message;
      };
      return ex;
    }
  };

  base64.getbyte64 = function(s, i) {
    // This is oddly fast, except on Chrome/V8.
    //  Minimal or no improvement in performance by using a
    //   object with properties mapping chars to value (eg. 'A': 0)
    var idx = base64.ALPHA.indexOf(s.charAt(i));
    if (idx === -1) {
      throw base64.makeDOMException();
    }
    return idx;
  };

  base64.decode = function(s) {
    // convert to string
    s = '' + s;
    var getbyte64 = base64.getbyte64;
    var pads, i, b10;
    var imax = s.length;
    if (imax === 0) {
      return s;
    }

    if (imax % 4 !== 0) {
      throw base64.makeDOMException();
    }

    pads = 0;
    if (s.charAt(imax - 1) === base64.PADCHAR) {
      pads = 1;
      if (s.charAt(imax - 2) === base64.PADCHAR) {
        pads = 2;
      }
      // either way, we want to ignore this last block
      imax -= 4;
    }

    var x = [];
    for (i = 0; i < imax; i += 4) {
      b10 = (getbyte64(s, i) << 18) | (getbyte64(s, i + 1) << 12) |
        (getbyte64(s, i + 2) << 6) | getbyte64(s, i + 3);
      x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
    }

    switch (pads) {
      case 1:
        b10 = (getbyte64(s, i) << 18);
        b10 |= (getbyte64(s, i + 1) << 12);
        b10 |= (getbyte64(s, i + 2) << 6);
        x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
        break;
      case 2:
        b10 = (getbyte64(s, i) << 18) | (getbyte64(s, i + 1) << 12);
        x.push(String.fromCharCode(b10 >> 16));
        break;
    }
    return x.join('');
  };

  base64.getbyte = function(s, i) {
    var x = s.charCodeAt(i);
    if (x > 255) {
      throw base64.makeDOMException();
    }
    return x;
  };

  base64.encode = function(s) {
    if (arguments.length !== 1) {
      throw new SyntaxError('Not enough arguments');
    }
    var padchar = base64.PADCHAR;
    var alpha = base64.ALPHA;
    var getbyte = base64.getbyte;

    var i, b10;
    var x = [];

    // convert to string
    s = '' + s;

    var imax = s.length - s.length % 3;

    if (s.length === 0) {
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

  allplayers.base64 = base64;
}(window, document, window.allplayers));
/** The global allplayers object. */
window.allplayers = window.allplayers || {};
(function(window, document, allplayers, undefined) {

  /**
   * Create the app class.
   *
   * @param {object} options The options for this app library.
   * @param {object} defaults The default params for this libarary.
   * @this The allplayers.app object.
   */
  allplayers.app = function(options, defaults) {
    if (defaults) {

      // Keep track of the self pointer.
      var self = this;

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
   * Initialize this app code.
   */
  allplayers.app.prototype.init = function() {};

}(window, document, window.allplayers));
var allplayers = allplayers || {app: {}};

(function(window, document, allplayers, $, undefined) {
  if ($ && !$.fn.allplayers_server) {

    /**
     * Define the jQuery plugin.
     *
     * @param {object} options The options for this plugin.
     * @return {object} A jQuery object.
     * @this The jQuery context for each element.
     **/
    $.fn.allplayers_server = function(options) {
      return $(this).each(function() {
        new allplayers.app.server(options, $(this));
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
      checkout: {},
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

    // Set the spinner if it isn't set.
    if (!this.options.spinner) {
      this.options.spinner = this.options.base;
      this.options.spinner += '/sites/all/themes/basic_foundation';
      this.options.spinner += '/images/loader.gif';
    }

    // Add the iframe.
    var iframeId = this.context.attr('id') + '_iframe';

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

    // Add the app source to the url.
    source += (source.search(/\?/) === -1) ? '?' : '&';

    // If they have some query options then add them here.
    if (!$.SeamlessBase.isEmptyObject(this.options.query)) {
      for (var param in this.options.query) {
        source += param + '=' + encodeURIComponent(this.options.query[param]);
        source += '&';
      }
    }

    // Add the ehost to the source.
    source += 'ehost=' + allplayers.base64.encode(window.location.origin);

    // Get the iframe object.
    var self = this;
    var iframe = $(document.createElement('iframe')).attr({
      id: iframeId,
      name: iframeId,
      src: source
    });

    // Add the iframe.
    this.context.append(iframe);

    // Make the iframe seamless.
    iframe = iframe.seamless({
      spinner: this.options.spinner,
      styles: this.options.style,
      onConnect: function(data) {
        if (self.options.type == 'registration') {
          // Send them the registration object.
          iframe.send({
            type: 'getRegistration',
            data: self.options.reg
          });
        }
        else if (self.options.type == 'checkout') {
          // Send them the checkout object.
          iframe.send({
            type: 'getCheckout',
            data: self.options.checkout
          });
        }
      }
    });

    /**
     * Method to ensure that an added product is valid.
     *
     * @param {object} product
     *   The product to be added to the registration.
     *
     * @return {boolean}
     *   If this product is a valid product.
     */
    var productValid = function(product) {
      return product.product_uuid &&
        product.price &&
        product.quantity &&
        product.title;
    };

    /**
     * Returns the product input.
     *
     * @param {string} uuid
     *   The uuid for the product input.
     *
     * @return {object}
     *   The jQuery object of the product input.
     */
    var productInput = function(uuid) {
      return $('input[product="' + uuid + '"]');
    };

    /**
     * Returns the product with an updated total.
     *
     * @param {object} product
     *   The product object.
     *
     * @return {object}
     *   The updated product object.
     */
    var productUpdateTotal = function(product) {
      // Add raw price if not already there.
      if (!product.price_raw) {
        product.price_raw = accounting.unformat(product.price) * 100;
      }

      // Format the price.
      product.price = accounting.formatMoney(product.price);

      // Calculate the total price.
      product.total = accounting.formatMoney(
        product.price_raw * product.quantity / 100
      );

      return product;
    };

    /**
     * Add a product to the list of products.
     *
     * @param {array} products
     *   The array of already added products.
     * @param {object} product
     *   The product to add.
     *
     * @return {array}
     *   The updated list of products.
     */
    var addCheckoutProducts = function(products, product) {
      // Add the product info to the list of adhoc products to create.
      var newProduct = true;
      if (products) {
        products = JSON.parse(products);
        // Check if the adhoc product has already been added.
        for (var i = 0; i < products.length; i++) {
          if (
            products[i].title == product.title &&
            products[i].price_raw == product.price_raw
          ) {
            // The product was found so increase the quantity and total price.
            newProduct = false;
            products[i].quantity += product.quantity;
            products[i].total = accounting.formatMoney(
              products[i].price_raw * products[i].quantity /
              100
            );
            product = products[i];
            break;
          }
        }
      }
      else {
        products = [];
      }

      // If a new adhoc product, add it to the list.
      if (newProduct) {
        products.push(product);
      }
      addCheckoutProductInfo(product);

      return products;
    };

    /**
     * Process a checkout.
     *
     * @param {object} checkout
     *   The checkout object.
     * @param {array} adhocProducts
     *   Array of adhoc products.
     * @param {array} existingProducts
     *   Array of existing products.
     * @param {string} src
     *   The source.
     */
    allplayers.app.server.prototype.init.processCheckout = function(
      checkout,
      adhocProducts,
      existingProducts,
      src
    ) {

      // Calculate the order total with the added adhoc/existing products.
      var orderTotal = checkout.commerce_order_total.und[0].amount;
      for (var i = 0; i < adhocProducts.length; i++) {
        orderTotal += adhocProducts[i].price_raw;
      }
      for (i = 0; i < existingProducts.length; i++) {
        orderTotal += existingProducts[i].price_raw;
      }

      // Determine how much the user paid.
      var paid = orderTotal;
      var partialPayment = '#edit-commerce-payment-payment-details-amount';
      if ($(partialPayment)) {
        paid = parseFloat($(partialPayment).val()) * 100;
      }

      // Tell the client to process the checkout.
      iframe.send({
        type: 'processCheckout',
        data: {
          checkout: checkout,
          adhocProducts: adhocProducts,
          existingProducts: existingProducts,
          orderTotal: orderTotal,
          paid: paid
        }
      });
    };

    /**
     * Method to add the checkout product info to the table on the page.
     *
     * @param {object} product
     *   The product to be added.
     */
    var addCheckoutProductInfo = function(product) {
      var newProduct = true;

      // Check if the product is existing or adhoc.
      if (product.product_uuid) {
        // If the product is already listed in the table, update the quantity
        // and total.
        if ($('tr#adhoc-product-' + product.product_uuid).length > 0) {
          $('tr#adhoc-product-' + product.product_uuid + ' .quantity')
            .text(product.quantity);
          $('tr#adhoc-product-' + product.product_uuid + ' .total')
            .text(product.total);
          newProduct = false;
        }
      }
      else {
        // Check if the product is already in the table.
        $('.views-table tbody tr').each(function() {
          var title = $(this).find('.title').text();
          var price = $(this).find('.price').text();
          if (
            title &&
            price &&
            title.indexOf(product.title) !== -1 &&
            price.indexOf(product.price) !== -1
          ) {
            // Update quantity and total and exit the each loop.
            $(this).find('.quantity').text(product.quantity);
            $(this).find('.total').text(product.total);
            newProduct = false;
            return false;
          }
        });
      }

      // Add the product to the table if it's a new product.
      if (newProduct) {
        $('.views-table tbody').append(
          '<tr id="adhoc-product-' + product.product_uuid + '">' +
            '<td class="title">' + product.title + '</td>' +
            '<td class="seller"></td>' +
            '<td class="price">' + product.price + '</td>' +
            '<td class="quantity">' + product.quantity + '</td>' +
            '<td class="total">' + product.total + '</td>' +
          '</tr>'
        );
      }

      // Update the order total.
      var componentTotal = $('td.component-total');
      var total = componentTotal.text();
      total = accounting.unformat(total) + (product.price_raw / 100);
      total = accounting.formatMoney(total);
      componentTotal.text(total);
    };

    /**
     * Set the next button text.
     *
     * @param string text
     *   The next button text to set.
     */
    var setNextText = function(text) {
      $('.actions-wrapper').show();
      $('#edit-next-text').val(text);
      $('.next-button input').val(text);
    };

    // Give them the ability to change the next button.
    iframe.receive('setNext', function(data) {
      if (data) {
        if (data.text) {
          setNextText(data.text);
        }
        else {
          $('.actions-wrapper').hide();
        }
      }
    });

    // Get the totals added to the cart.
    var getTotals = function() {
      var quantity = 0;
      var total = 0;
      $('input[name="add-product[]"]').each(function() {
        var product = JSON.parse($(this).attr('value'));
        var productQuantity = parseInt(product.quantity, 10);
        var productPrice = parseInt(product.price_raw, 10);
        quantity += productQuantity;
        total += (productPrice * productQuantity);
      });

      // Return the results.
      return {
        quantity: quantity,
        total: parseFloat(total / 100).toFixed(2)
      };
    };

    // Ensure we have a products table present.
    var ensureProductsTable = function() {
      if ($('#add-products-table').length === 0) {
        $('<table>').attr({
          id: 'add-products-table',
          class: 'sticky-table'
        }).appendTo('#add-products');

        // Create the products table.
        $('#add-products-table').append(
          '<thead>' +
            '<tr>' +
              '<th>Added Products</th>' +
              '<th>Price</th>' +
              '<th>Quantity</th>' +
              '<th></th>' +
            '</tr>' +
          '</thead>' +
          '<tbody></tbody>' +
          '<tfoot>' +
            '<tr>' +
              '<td style="text-align: right;">Total:</td>' +
              '<td id="price-total"></td>' +
              '<td id="quantity-total"></td>' +
              '<td>&nbsp;</td>' +
            '</tr>' +
          '</tfoot>'
        );
      }
    };

    // Add a new product.
    var addProduct = function(product) {

      // Create the input for the new product.
      $('<input>').attr({
        type: 'hidden',
        product: product.hasOwnProperty('product_uuid') ? product.product_uuid : '',
        name: 'add-product[]',
        value: JSON.stringify(product)
      }).appendTo('form#og-registration-register-app');

      // Make sure this is a visible product being added.
      if (!product.hidden) {

        // Change the next button value.
        setNextText(product.next ? product.next : 'Continue');

        // Add the products table if not already.
        ensureProductsTable();

        var disabledText = '';
        if (product.readonly) {
          disabledText = 'disabled';
        }

        // Create the row.
        var row = $(document.createElement('tr'));
        row.append(
          '<td>' + product.title + '</td>' +
          '<td>' + product.price + '</td>' +
          '<td><input type="text" class="product-quantity" value="' + product.quantity + '" ' + disabledText + '></td>'
        );

        // Add an attribute and remove button if this is not an ad-hoc product.
        if (product.hasOwnProperty('product_uuid')) {
          row.attr('id', 'add-product-display-' + product.product_uuid).append(
            '<td><input type="button" class="remove-product text-button" value="Remove" /></td>'
          );
        }

        // Add the product to the table.
        $('#add-products-table tbody').append(row);
      }
    };

    // Update the totals.
    var updateTotals = function() {
      var totals = getTotals();
      $('#price-total').text('$' + totals.total);
      $('#quantity-total').text(totals.quantity);
    };

    // The addProduct action.
    iframe.receive('addProduct', function(data) {

      // If the product is existing.
      if (data && data.product_uuid) {
        (new allplayers.product({uuid: data.product_uuid})).getProduct(
          data.product_uuid,
          function(result) {
            // Check if the UUIDs match.
            if (result.uuid == data.product_uuid) {
              var uuid = data.product_uuid;
              var product = productInput(uuid).val();
              data.title = result.title;

              // If a product was already found.
              if (product) {

                // Update the quantity.
                product = JSON.parse(product);
                product.quantity = parseInt(product.quantity);
                product.quantity += parseInt(data.quantity);
                productInput(uuid).val(JSON.stringify(product));
                var productCol = '#add-product-display-' + uuid;
                $(productCol + ' input.product-quantity').val(product.quantity);
              }

              // Make sure the product is valid.
              else if (productValid(data)) {

                // If it is a product with a value greater than $0, or price
                // isn't supplied, use the price  assigned to the product in
                // store.
                if (
                  data.price == 'undefined' ||
                  (result.type == 'product' && result.price_raw > 0)
                ) {
                  data.price = result.price_raw / 100;
                }
                data = productUpdateTotal(data);
                addProduct(data);
              }

              // Update the totals.
              updateTotals();
            }
            else {
              alert('There was an error adding the product.');
            }
          }
        );
      }
      // The product is an adhoc product.
      else {
        // Update the product total price.
        data = productUpdateTotal(data);
        data.title += ' (Adhoc)';
        addProduct(data);
        updateTotals();
      }
    });

    // The addCheckoutProduct action.
    iframe.receive('addCheckoutProduct', function(data) {

      // If the product is existing.
      if (data && data.product_uuid) {
        (new allplayers.product({uuid: data.product_uuid})).getProduct(
          data.product_uuid,
          function(result) {
            // Check if the UUIDs match.
            if (result && result.uuid == data.product_uuid) {
              // The product exists.
              var uuid = data.product_uuid;
              var product = productInput(uuid).val();
              var existingProducts = $('#add-existing-products-' +
                self.options.checkout.order_id).val();

              // If a product was already found.
              if (product) {

                // Update the quantity.
                product = JSON.parse(product);
                product.quantity = parseInt(product.quantity);
                product.quantity += parseInt(data.quantity);
                productInput(uuid).val(JSON.stringify(product));
                var productCol = '#adhoc-product-' + uuid;
                $(productCol + ' td.quantity').text(product.quantity);
              }

              // Make sure the product is valid.
              else if (productValid(data)) {

                // If it is a product with a value greater than $0, or price
                // isn't supplied, use the price  assigned to the product in
                // store.
                if (
                  data.price == 'undefined' ||
                  (result.type == 'product' && result.price_raw > 0)
                ) {
                  data.price = result.price_raw / 100;
                  data.price_raw = result.price_raw;
                }
                data.title = result.title;
                data = productUpdateTotal(data);
              }
              existingProducts = addCheckoutProducts(existingProducts, data);
              $('#add-existing-products-' + self.options.checkout.order_id)
                .val(JSON.stringify(existingProducts));
            }
            else {
              alert('There was an error adding the product.');
            }
          }
        );
      }
      // The product is an adhoc product.
      else {
        // Update the product total price.
        data = productUpdateTotal(data);
        data.title += ' (Adhoc)';

        // Add the product info to the list of adhoc products to create.
        var adhocProducts = $('#add-adhoc-products-' +
          self.options.checkout.order_id).val();
        adhocProducts = addCheckoutProducts(adhocProducts, data);

        $('#add-adhoc-products-' + self.options.checkout.order_id)
          .val(JSON.stringify(adhocProducts));
      }
    });

    // The remove product message.
    iframe.receive('removeProduct', function(data) {
      var uuid = data.product_uuid;
      removeProduct(uuid);
    });
    
    $('#add-products-table input.product-quantity').live('change', function() {
      var uuid = $(this).parent().parent().attr('id').replace('add-product-display-', '');
      var product = JSON.parse(productInput(uuid).val());
      var quantity = $(this).val();
      if (quantity != product.quantity) {
        if (!isNaN(quantity)) {
          product.quantity = parseInt(quantity);
          product = productUpdateTotal(product);
          productInput(uuid).val(JSON.stringify(product));
          if (product.quantity != quantity) {
            $(this).val(product.quantity);
          }
        }
        else {
          $(this).val(product.quantity);
        }
      }
    });
    
    $('#add-products-table input.remove-product').live('click', function(e) {
      e.preventDefault();
      var uuid = $(this).parent().parent().attr('id').replace('add-product-display-', '');
      removeProduct(uuid);
    });
    
    function removeProduct(uuid) {
      var product = productInput(uuid).val();
      if (product) {
        // Remove the input and table field.
        productInput(uuid).remove();
        $('#add-product-display-' + uuid).remove();

        // Let the child page know.
        iframe.send({
          type: 'removeProduct',
          data: JSON.parse(product)
        });

        // Update the totals.
        updateTotals();
      }
    }
  };
}(window, document, window.allplayers, jQuery));
