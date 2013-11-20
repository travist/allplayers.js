/*
    json2.js
    2013-05-26

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function () {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
(function(){var a=false,b=/xyz/.test(function(){xyz})?/\b_super\b/:/.*/;this.Class=function(){};Class.extend=function(g){var f=this.prototype;a=true;var e=new this();a=false;for(var d in g){e[d]=typeof g[d]=="function"&&typeof f[d]=="function"&&b.test(g[d])?(function(h,i){return function(){var k=this._super;this._super=f[h];var j=i.apply(this,arguments);this._super=k;return j}})(d,g[d]):g[d]}function c(){if(!a&&this.init){this.init.apply(this,arguments)}}c.prototype=e;c.prototype.constructor=c;c.extend=arguments.callee;return c}})();(function(c){var b={trace:function(d){if(c.console!==undefined){c.console.log("Porthole: "+d)}},error:function(d){if(c.console!==undefined){c.console.error("Porthole: "+d)}}};b.WindowProxy=function(){};b.WindowProxy.prototype={post:function(e,d){},addEventListener:function(d){},removeEventListener:function(d){}};b.WindowProxyBase=Class.extend({init:function(d){if(d===undefined){d=""}this.targetWindowName=d;this.origin=c.location.protocol+"//"+c.location.host;this.eventListeners=[]},getTargetWindowName:function(){return this.targetWindowName},getOrigin:function(){return this.origin},getTargetWindow:function(){return b.WindowProxy.getTargetWindow(this.targetWindowName)},post:function(e,d){if(d===undefined){d="*"}this.dispatchMessage({data:e,sourceOrigin:this.getOrigin(),targetOrigin:d,sourceWindowName:c.name,targetWindowName:this.getTargetWindowName()})},addEventListener:function(d){this.eventListeners.push(d);return d},removeEventListener:function(g){var d;try{d=this.eventListeners.indexOf(g);this.eventListeners.splice(d,1)}catch(h){this.eventListeners=[]}},dispatchEvent:function(f){var d;for(d=0;d<this.eventListeners.length;d++){try{this.eventListeners[d](f)}catch(g){}}}});b.WindowProxyLegacy=b.WindowProxyBase.extend({init:function(d,e){this._super(e);if(d!==null){this.proxyIFrameName=this.targetWindowName+"ProxyIFrame";this.proxyIFrameLocation=d;this.proxyIFrameElement=this.createIFrameProxy()}else{this.proxyIFrameElement=null;throw new Error("proxyIFrameUrl can't be null")}},createIFrameProxy:function(){var d=document.createElement("iframe");d.setAttribute("id",this.proxyIFrameName);d.setAttribute("name",this.proxyIFrameName);d.setAttribute("src",this.proxyIFrameLocation);d.setAttribute("frameBorder","1");d.setAttribute("scrolling","auto");d.setAttribute("width",30);d.setAttribute("height",30);d.setAttribute("style","position: absolute; left: -100px; top:0px;");if(d.style.setAttribute){d.style.setAttribute("cssText","position: absolute; left: -100px; top:0px;")}document.body.appendChild(d);return d},dispatchMessage:function(e){var d=c.encodeURIComponent;if(this.proxyIFrameElement){var f=this.proxyIFrameLocation+"#"+d(b.WindowProxy.serialize(e));this.proxyIFrameElement.setAttribute("src",f);this.proxyIFrameElement.height=this.proxyIFrameElement.height>50?50:100}}});b.WindowProxyHTML5=b.WindowProxyBase.extend({init:function(d,e){this._super(e);this.eventListenerCallback=null},dispatchMessage:function(d){this.getTargetWindow().postMessage(b.WindowProxy.serialize(d),d.targetOrigin)},addEventListener:function(e){if(this.eventListeners.length===0){var d=this;this.eventListenerCallback=function(f){d.eventListener(d,f)};c.addEventListener("message",this.eventListenerCallback,false)}return this._super(e)},removeEventListener:function(d){this._super(d);if(this.eventListeners.length===0){c.removeEventListener("message",this.eventListenerCallback);this.eventListenerCallback=null}},eventListener:function(e,d){var f=b.WindowProxy.unserialize(d.data);if(f&&(e.targetWindowName==""||f.sourceWindowName==e.targetWindowName)){e.dispatchEvent(new b.MessageEvent(f.data,d.origin,e))}}});if(typeof c.postMessage!=="function"){b.trace("Using legacy browser support");b.WindowProxy=b.WindowProxyLegacy.extend({})}else{b.trace("Using built-in browser support");b.WindowProxy=b.WindowProxyHTML5.extend({})}b.WindowProxy.serialize=function(d){if(typeof JSON==="undefined"){throw new Error("Porthole serialization depends on JSON!")}return JSON.stringify(d)};b.WindowProxy.unserialize=function(g){if(typeof JSON==="undefined"){throw new Error("Porthole unserialization dependens on JSON!")}try{var d=JSON.parse(g)}catch(f){return false}return d};b.WindowProxy.getTargetWindow=function(d){if(d===""){return top}else{if(d==="top"||d==="parent"){return c[d]}}return parent.frames[d]};b.MessageEvent=function a(f,d,e){this.data=f;this.origin=d;this.source=e};b.WindowProxyDispatcher={forwardMessageEvent:function(i){var g,h=c.decodeURIComponent,f,d;if(document.location.hash.length>0){g=b.WindowProxy.unserialize(h(document.location.hash.substr(1)));f=b.WindowProxy.getTargetWindow(g.targetWindowName);d=b.WindowProxyDispatcher.findWindowProxyObjectInWindow(f,g.sourceWindowName);if(d){if(d.origin===g.targetOrigin||g.targetOrigin==="*"){d.dispatchEvent(new b.MessageEvent(g.data,g.sourceOrigin,d))}else{b.error("Target origin "+d.origin+" does not match desired target of "+g.targetOrigin)}}else{b.error("Could not find window proxy object on the target window")}}},findWindowProxyObjectInWindow:function(d,g){var f;if(d.RuntimeObject){d=d.RuntimeObject()}if(d){for(f in d){if(d.hasOwnProperty(f)){try{if(d[f]!==null&&typeof d[f]==="object"&&d[f] instanceof d.Porthole.WindowProxy&&d[f].getTargetWindowName()===g){return d[f]}}catch(h){}}}}return null},start:function(){if(c.addEventListener){c.addEventListener("resize",b.WindowProxyDispatcher.forwardMessageEvent,false)}else{if(document.body.attachEvent){c.attachEvent("onresize",b.WindowProxyDispatcher.forwardMessageEvent)}else{b.error("Cannot attach resize event")}}}};if(typeof c.exports!=="undefined"){c.exports.Porthole=b}else{c.Porthole=b}})(this);/** The global allplayers object. */
window.allplayers = window.allplayers || {};

(function(window, document, allplayers, undefined) {
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
}(window, document, window.allplayers));
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
      return $();
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
  $(document).bind('DOMSubtreeModified', function() {
    if (throttle) {
      clearTimeout(throttle);
    }
    throttle = setTimeout(function() {
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

        case 'chromePluginReady':
          window.postMessage(event, '*');
          break;

        case 'addStyle':
          // Inject the style into the page.
          if (event.data) {
            // Keep them from escaping the <style> tag.
            var styles = event.data.replace(/[<>]/g, '');
            var lastStyle = $('link[type="text/css"]');
            if (lastStyle.length) {
              lastStyle = lastStyle.eq(lastStyle.length - 1);
              lastStyle.after($(document.createElement('style')).attr({
                type: 'text/css'
              }).append(styles));
            }
          }
          break;
      }
    }
  });

  // Trigger the resizing events.
  this.resize();

  // Server is now ready.
  this.proxy.post({event: {'name': 'serverReady'}});
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
  $('a[href^="https://www."]', this.container).each(function() {

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
}(window, document, window.allplayers, jQuery));
