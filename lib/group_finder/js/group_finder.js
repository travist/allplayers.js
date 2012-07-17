(function($) {
  // Add the group select widget.
  $.fn.group_finder = function(params) {

    // Make sure we have default params.
    params = jQuery.extend({
      deepLoad: true,
      inputName: '',
      input_placeholder: 'Find subgroups of this group',
      input_type: 'search',
      no_results_text: 'No groups found',
      include_group_info: true,
      show_register_link: true,
      show_url_link: true,
      showtree: true,
      onbuild: function(node) {

        // If they wish to include the registration link...
        if (params.include_group_info) {

          if (params.show_register_link && node.data.register_link && !node.has_register_link) {
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

          if (params.show_url_link && node.data.url && !node.has_url_link) {
            node.has_url_link = true;
            node.link.after($(document.createElement('a')).attr({
              'class': 'allplayers-url-link',
              href: node.data.url
            }).append($(document.createElement('span')).attr({
              'class': 'ui-icon ui-icon-circle-arrow-e'
            })));
          }
        }
      },
      postbuild: function(node) {

        // Remove the url-link from the search item.
        $('.allplayers-url-link', node.searchItem).remove();
      }
    },params);

    return $(this).each(function() {

      // Create the group_select item.
      $(this).group_select(params);
    });
  };
})(jQuery);

