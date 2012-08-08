(function($) {
  // Add the group select widget.
  $.fn.group_finder = function(params) {

    // Get the root node.
    var rootNode = {};

    // Make sure we have default params.
    params = jQuery.extend({
      deepLoad: 1,
      inputName: '',
      input_placeholder: 'Find subgroups',
      input_type: 'search',
      no_results_text: 'No groups found',
      unavailable_text: 'Unavailable',
      include_group_info: 1,
      show_register_link: 1,
      include_hidden: 0,
      show_url_link: 1,
      showtree: 1,
      onRoot: function(root) {
        rootNode = root;
      },
      onbuild: function(node) {

        // If they wish to include the registration link...
        if (params.include_group_info) {
          if (params.show_register_link) {
            if (!node.has_register_link) {
              node.has_register_link = true;
              if (node.data.register_link) {

                // Add the documnet URL to the end of the register
                var link = node.data.register_link;
                link += '?destination=' + encodeURIComponent(window.document.URL);
                link += '&from=' + rootNode.id;

                // Add a registration link to the group finder.
                node.link.after($(document.createElement('a')).attr({
                  'class': 'allplayers-register-link',
                  href: link
                }).text(node.data.register_text));
              }
              else if (params.unavailable_text) {

                // Add an unavailable link.
                node.link.after($(document.createElement('a')).attr({
                  'class': 'register allplayers-register-link allplayers-register-unavailable',
                }).text(params.unavailable_text));
              }
            }
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
      }
    },params);

    return $(this).each(function() {

      // Create the group_select item.
      $(this).group_select(params);
    });
  };
})(jQuery);

