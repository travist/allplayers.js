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
allplayers.event = function(object, callback, options) {
  drupal.node.call(this, object, callback, options);
};

/** Derive from node. */
allplayers.event.prototype = new drupal.node();

/** Reset the constructor. */
allplayers.event.prototype.constructor = allplayers.event;

/** Declare the event api. */
allplayers.event.api = jQuery.extend(new drupal.api(), {
  resource: 'events'
});

/**
 * Returns an index of events.
 *
 * @param {object} query The query parameters.
 * @param {function} callback The callback function.
 * @param {object} options Options used to govern functionality.
 */
allplayers.event.index = function(query, callback, options) {
  drupal.entity.index(allplayers.event, query, callback, options);
};

/**
 * Sets the object.
 *
 * @param {object} object The object which contains the data.
 */
allplayers.event.prototype.set = function(object) {
  drupal.node.prototype.set.call(this, object);

  /** The name of this entity. */
  this.entityName = 'event';

  /** Set the api to the drupal.node.api. */
  this.api = allplayers.event.api;

  /** Set the id based on the uuid of the object. */
  this.id = this.id || object.uuid || object.id || '';

  // Set the values for this entity.
  this.setValues({
    allDay: false,
    gids: [],
    description: '',
    resources: [],
    competitors: {},
    category: 'Other'
  }, object);

  /** The date-time object */
  this.date = new allplayers.date(object.start, object.end);
  this.start = this.date.start;
  this.end = this.date.end;
};

/**
 * Returns the object to send to Services.
 *
 * @return {object} The object to send to the Services endpoint.
 */
allplayers.event.prototype.get = function() {
  return jQuery.extend(drupal.node.prototype.get.call(this), {
    allDay: this.allDay,
    gids: this.gids,
    description: this.description,
    resources: this.resources,
    competitors: this.competitors,
    category: this.category,
    date_time: this.date.get()
  });
};
