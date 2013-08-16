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
      load_extra_info: 0,
      include_group_info: 1,
      show_register_link: 1,
      include_hidden: 0,
      show_url_link: 1,
      showRoot: 0,
      showtree: 1,
      gotoPath: '',
      gotoText: '',
      gotoClass: 'allplayers-register-link',
      gotoFeature: '',
      onRoot: function(root) {
        rootNode = root;
      },
      onbuild: function(node) {

        // If they wish to include the registration link...
        if (params.include_group_info) {
          if (params.show_register_link) {
            if (!node.has_register_link) {
              node.has_register_link = true;
              if (node.data.roles_enabled) {

                // If on root node, make the register link direct to the first
                // page for registration.
                if (node.root) {
                  node.data.register_link += '/select';
                }

                // Add the documnet URL to the end of the register
                var link = node.data.register_link;
                link += '?destination=';
                link += encodeURIComponent(window.document.URL);
                link += '&from=' + rootNode.id;

                // Add a registration link to the group finder.
                node.link.after($(document.createElement('a')).attr({
                  'class': 'button small allplayers-register-link',
                  href: link
                }).text(node.data.register_text));
              }

              // See if we wish to load all nodes.
              if (params.load_extra_info) {
                var count = 0;
                node.loadAll(function() {
                  // Specify how many children have registration enabled.
                  if (count > 0) {
                    node.link.append($(document.createElement('span')).html(
                      count + ' ' +
                      ((count == 1) ? 'subgroup' : 'subgroups') + ' open'
                    ).attr({
                      'class': 'extra-info'
                    }));
                  }
                  else if (!node.data.roles_enabled) {
                    // Add an unavailable link.
                    node.link.append($(document.createElement('span')).html(
                      params.unavailable_text
                    ).attr({
                      'class': 'extra-info'
                    }));
                  }
                }, function(thisNode) {
                  if (thisNode.id != node.id && thisNode.data.register_link) {
                    count++;
                  }
                }, true);
              }
            }
          }

          // Add a way to provide a generic path.
          if (params.gotoPath && node.data.url && !node.has_goto_link) {

            // Check to see if they have the feature enabled.
            if (
              !params.gotoFeature ||
              (node.data.features && node.data.features[params.gotoFeature])
            ) {
              node.has_goto_link = true;

              // Add the documnet URL to the end of the register
              var link = node.data.url + '/' + params.gotoPath;
              link += '?destination=';
              link += encodeURIComponent(window.document.URL);
              link += '&from=' + rootNode.id;

              // Add a goto link to the group finder.
              node.link.after($(document.createElement('a')).attr({
                'class': params.gotoClass,
                href: link
              }).text(params.gotoText));
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

