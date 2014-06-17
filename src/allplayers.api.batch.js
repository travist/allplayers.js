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
      error: function(){},

      /**
       * This will keep track of how the users are called into the batch.
       *
       * @var {string|array}
       */
      users: null,

      /**
       * Create a batch reference to iterate through each user.
       */
      eachUser: function (name) {
        return {
          name: name,
          each: this.users
        };
      },

      /**
       * Create a batch reference to a single variable for all users.
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
       */
      add: function (task) {
        this.batch.push(task);
      },

      /**
       * Send batch data to the endpoint for processing.
       *
       * @param {object} batchData
       *   The batch list.
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
            'x-token': this.token
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
       * @param group_uuid
       *   The uuid of the top level group.
       */
      setUsers: function (users, reversed, filter, group_uuid) {
        // If its a reversed list we need to get all the remaining users
        if (reversed) {
          this.batch.push({
            method: 'GET',
            resource: 'group/' + group_uuid + '/members',
            id: 'getGroupMembers',
            query: {
              exclude: users.length > 0 ? users : [],
              uuidOnly: true,
              filter: filter
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
