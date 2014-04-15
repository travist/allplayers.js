/** The global allplayers object. */
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
  allplayers.embed.prototype.init = function() {};

}(window, document, window.allplayers));
