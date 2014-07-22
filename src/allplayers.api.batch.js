/** The allplayers namespace. */
var allplayers = allplayers || {};
allplayers.api = allplayers.api || {};

/**
 * Define a handle for API batches.
 */
allplayers.api.batch = {
  /**
   * Create a new batch handler.
   *
   * @returns {object}
   *   The batch handler.
   */
  newBatch: function (settings) {
    var batch = {
      /**
       * A list of batch operations.
       *
       * @var {array}
       */
      batch: [],

      /**
       * A settable error callback function.
       *
       * @var {function}
       */
      error: function() {},

      /**
       * This will keep track of how the users are called into the batch.
       *
       * @var {string|array}
       */
      users: null,

      /**
       * Create a batch reference to iterate through each user.
       *
       * @param {string} name
       *   The name of the variable that should be send in the request.
       */
      eachUser: function (name) {
        return {
          name: name,
          each: this.users
        };
      },

      /**
       * Create a batch reference to a single variable for all users.
       *
       * @param {string} name
       *   The name of the variable that should be sent in the request.
       */
      allUsers: function (name) {
        var users = {name: name};
        if (typeof this.users == 'string') {
          users.source = this.users;
        } else {
          users.value = this.users;
        }
        return users;
      },

      /**
       * Add a new item to the batch.
       *
       * @param {object} task
       *   A single batch task to append to the batch.
       */
      add: function (task) {
        this.batch.push(task);
      },

      /**
       * Send batch data to the endpoint for processing.
       *
       * @param {function} callback
       *   A callback to run when the batch is returned.
       */
      send: function (callback) {
        $.ajax({
          url: allplayers.api.root + '/batch',
          type: 'POST',
          dataType: 'json',
          xhrFields: {
            withCredentials: true
          },
          data: {
            batch: this.batch,
            'x-token': this.token,
            'group': this.group
          },
          success: callback,
          error: function (jqXHR, textStatus, errorThrown) {
            this.error(jqXHR, textStatus, errorThrown)
          }
        });
      },

      /**
       * Set the users to an explicit or excluded list.
       *
       * @param {array} users
       *   A list of selected uuids.
       * @param {boolean} reversed
       *   Whether the list is reverse.
       * @param {object} filter
       *   The kendo filter properties in case we need to search.
       * @param {string} group_uuid
       *   The uuid of the top level group.
       * @param {string} form_uuid
       *   The uuid of the form to filter.
       */
      setUsers: function (users, reversed, filter, groups, group_uuid, form_uuid) {
        // If it's a reversed list we need to get all the remaining users.
        if (reversed) {
          this.batch.push({
            method: 'GET',
            resource: 'group/' + group_uuid + '/members',
            id: 'getGroupMembers',
            query: {
              exclude: users.length > 0 ? users : [],
              uuidOnly: true,
              filter: filter,
              groups: groups,
              form: form_uuid
            }
          });

          this.users = 'getGroupMembers';
        } else {
          this.users = users;
        }
      }
    };

    settings = settings || {};
    return $.extend(batch, settings);
  }
}
