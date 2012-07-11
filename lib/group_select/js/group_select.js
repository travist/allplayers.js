(function($) {
  // Add the group select widget.
  $.fn.group_select = function(params) {

    // Make sure we have default params.
    params = jQuery.extend({
      uuid:0,
      depth: 8,
      include_group_info: false
    },params);

    // Setup the drupal endpoint.
    drupal.endpoint = '/api/v1/rest';

    return $(this).each(function() {

      /**
       * Converts the drupal return of tree structure to the common
       * treeselect control pattern.
       */
      var getTree = function(node, nodes) {
        var treenode = {};
        if (nodes) {
          for (var id in nodes) {
            if (nodes.hasOwnProperty(id)) {
              var has_children = parseInt(nodes[id].has_children);
              if (nodes[id].title || has_children) {
                treenode = {
                  id: nodes[id].uuid || params.uuid,
                  value: nodes[id].nid,
                  title: nodes[id].title,
                  has_children: has_children,
                  children: [],
                  data: nodes[id]
                };
                treenode = getTree(treenode, nodes[id].below);
                node.children.push(treenode);
              }
            }
          }
        }
        return node;
      };

      /**
       * Called to load a new node.
       */
      params.load = function(node, callback) {
        (new allplayers.group({id:node.id || params.uuid})).getGroupTree({
          depth: params.depth,
          include_group_info: params.include_group_info
        }, function(nodes) {
          callback(getTree(node, nodes));
        });
      };

      // Setup the input ID.
      params.inputId = 'chosentree-select-' + params.uuid;

      // Create the chosentree item.
      $(this).chosentree(params);
    });
  };
})(jQuery);

