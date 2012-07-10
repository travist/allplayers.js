(function($) {
  // Add the group select widget.
  $.fn.group_finder = function(params) {

    // Make sure we have default params.
    params = jQuery.extend({
      deepLoad: true,
      inputName: '',
      default_text: 'Search Groups',
      onbuild: function(node) {

        // If they wish to include the registration link...
        if (params.include_registration_info && node.data.register_link && !node.has_register_link) {

          // Add the documnet URL to the end of the register
          var link = node.data.register_link;
          link += window.location.search ? '&' : '?';
          link += 'destination=' + encodeURIComponent(window.document.URL);

          // Add a registration link to the group finder.
          node.has_register_link = true;
          node.link.after($(document.createElement('a')).attr({
            'class': 'allplayers-register-link',
            href: link
          }).text(node.data.register_text));
        }
      }
    },params);

    return $(this).each(function() {

      // Create the group_select item.
      $(this).group_select(params);
    });
  };
})(jQuery);

