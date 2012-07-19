/** The allplayers namespace. */
var allplayers = allplayers || {};

/**
 * @constructor
 * @extends drupal.entity
 * @class The AllPlayers event class
 *
 * @param {object} object The node object.
 * @param {function} callback The function to be called once the node has
 * been retrieved from the server.
 * @param {object} options Options used to govern functionality.
 */
allplayers.group = function(object, callback, options) {
  drupal.node.call(this, object, callback, options);
};

/** Derive from node. */
allplayers.group.prototype = new drupal.node();

/** Reset the constructor. */
allplayers.group.prototype.constructor = allplayers.group;

/** Declare the event api. */
allplayers.group.api = jQuery.extend(new drupal.api(), {
  resource: 'groups'
});

/**
 * Returns an index of groups.
 *
 * @param {object} query The query parameters.
 * @param {function} callback The callback function.
 * @param {object} options Options used to govern functionality.
 */
allplayers.group.index = function(query, callback, options) {
  drupal.entity.index(allplayers.group, query, callback, options);
};

/**
 * Sets the object.
 *
 * @param {object} object The object which contains the data.
 */
allplayers.group.prototype.set = function(object) {
  drupal.node.prototype.set.call(this, object);

  /** The name of this entity. */
  this.entityName = 'group';

  /** Set the api. */
  this.api = allplayers.group.api;

  /** Set the id based on the uuid of the object. */
  this.id = object.uuid || object.id || this.id || '';

  /** See if this group has children. */
  var has_value = object.hasOwnProperty('has_children');
  this.has_children = has_value ? object.has_children : !!this.has_children;

  /** A {@link allplayers.location} object. */
  this.location = object.location || this.location || new allplayers.location();

  // Set the values for this entity.
  this.setValues({
    activity_level: 0,
    list_in_directory: 0,
    active: false,
    registration_fees_enabled: '',
    approved_for_payment: '',
    accept_amex: '',
    primary_color: '',
    secondary_color: '',
    node_status: 0,
    logo: '',
    url: '',
    groups_above_uuid: [],
    registration_link: '',
    registration_text: ''
  }, object);
};

/**
 * Returns the object to send to Services.
 *
 * @return {object} The object to send to the Services endpoint.
 */
allplayers.group.prototype.get = function() {
  return jQuery.extend(drupal.node.prototype.get.call(this), {
    location: this.location.get(),
    activity_level: this.activity_level,
    list_in_directory: this.list_in_directory,
    active: this.active,
    registration_fees_enabled: this.registration_fees_enabled,
    approved_for_payment: this.approved_for_payment,
    accept_amex: this.accept_amex,
    primary_color: this.primary_color,
    secondary_color: this.secondary_color,
    node_status: this.node_status,
    logo: this.logo,
    uri: this.uri,
    url: this.url,
    groups_above_uuid: this.groups_above_uuid,
    registration_link: this.registration_link,
    registration_text: this.registration_text
  });
};

/**
 * Returns the events for this group.
 *
 * @param {object} query An object of the following parameters.
 * <ul>
 * <li><strong>start</strong> - The start date to get the events.</li>
 * <li><strong>end</strong> - The end date to get the events.</li>
 * <li><strong>fields</strong> - The fields to get.</li>
 * <li><strong>limit</strong> - The limit of events to get.</li>
 * <li><strong>offset</strong> - The offset of events for pagination.</li>
 * </ul>
 *
 * @param {function} callback The callback function to get the events.
 */
allplayers.group.prototype.getEvents = function(query, callback) {

  // Get the events within this group.
  this.api.get(this, 'events', query, function(events) {

    // Iterate through the events and create an event object out of them.
    for (var i in events) {
      events[i] = new allplayers.event(events[i]);
    }

    // Call the callback.
    callback(events);
  }, true);
};

/**
 * Returns the upcoming events for this group.
 *
 * @param {object} query An object of the following parameters.
 * <ul>
 * <li><strong>start</strong> - The start date to get the events.</li>
 * <li><strong>end</strong> - The end date to get the events.</li>
 * <li><strong>fields</strong> - The fields to get.</li>
 * <li><strong>limit</strong> - The limit of events to get.</li>
 * <li><strong>offset</strong> - The offset of events for pagination.</li>
 * </ul>
 *
 * @param {function} callback The callback function to get the events.
 */
allplayers.group.prototype.getUpcomingEvents = function(query, callback) {

  // Get the events within this group.
  this.api.get(this, 'events/upcoming', query, function(events) {

    // Iterate through the events and create an event object out of them.
    for (var i in events) {
      events[i] = new allplayers.event(events[i]);
    }

    // Call the callback.
    callback(events);
  }, true);
};

/**
 * Returns a hierachy tree of all the subgroups within this group.
 *
 * @param {object} query The query to add to the subgroups tree call.
 * @param {function} callback The callback function to get the subgroup tree.
 */
allplayers.group.prototype.getGroupTree = function(query, callback) {

  // Get the subgroups tree.
  this.api.get(this, 'subgroups/tree', query, callback, true);
};
