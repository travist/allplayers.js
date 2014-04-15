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
