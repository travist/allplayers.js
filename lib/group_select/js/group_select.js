(function($) {
  // Add the group select widget.
  $.fn.group_select = function(params) {

    // Make sure we have default params.
    params = jQuery.extend({
      uuid: 0,
      depth: 8,
      sortby: 'title',
      sort: 'asc',
      include_group_info: 0,
      include_hidden: 0,
      onRoot: null,
      relative_link: false
    },params);

    // Set the sort direction.
    var dir = (params.sort.toLowerCase() === 'asc') ? -1 : 1;

    // Setup the drupal endpoint.
    drupal.endpoint = drupal.endpoint || '/api/v1/rest';

    return $(this).each(function() {

      /**
       * Converts the drupal return of tree structure to the common
       * treeselect control pattern.
       */
      var getTreeNode = function(node) {
        var treenode = {};
        if (!node) {
          return null;
        }
        var has_children = parseInt(node.has_children);
        treenode.id = node.uuid || params.uuid;
        treenode.value = node.nid;
        treenode.title = node.title;
        treenode.url = node.url;
        treenode.has_children = has_children;
        treenode.data = node;
        treenode.sort = treenode[params.sortby];
        treenode.children = [];
        var child = null;
        for (var id in node.below) {
          if (node.below.hasOwnProperty(id)) {
            if (child = getTreeNode(node.below[id])) {
              treenode.children.push(child);
            }
          }
        }

        // Now sort the children.
        if (treenode.children.length > 0) {
          treenode.children.sort(function(a, b) {
            return (a.sort < b.sort) ? dir : ((a.sort > b.sort) ? -dir : 0);
          });
        }

        return treenode;
      };

      /**
       * Called to load a new treenode.
       */
      params.load = function(treenode, callback) {
        (new allplayers.group({id: treenode.id || params.uuid})).getGroupTree({
          depth: params.depth,
          include_group_info: params.include_group_info,
          include_hidden: params.include_hidden,
          root_uuid: params.root_uuid,
          inclusive: 1,
          path: params.relative_link ? window.location.pathname : ''
        }, function(node) {
          var root = getTreeNode(node);
          if (params.onRoot) {
            params.onRoot(root);
          }
          callback(root);
        });
      };

      /**
       * Called when they search a node.
       */
      params.searcher = function(treenode, query, callback) {
        var id = {id: treenode.id || params.uuid};
        (new allplayers.group(id)).find(query, function(nodes) {
          callback(nodes, getTreeNode);
        });
      };

      // Setup the input ID.
      params.inputId = 'chosentree-select-' + params.uuid;

      // Create the chosentree item.
      $(this).chosentree(params);
    });
  };
})(jQuery);
