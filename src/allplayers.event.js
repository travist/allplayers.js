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

  /** Set to TRUE if this is an all day event */
  this.allDay = object.allDay || this.allDay || false;

  /** An array of group UUID's that have this Event. */
  this.gids = object.gids || this.gids || [];

  /** The description for this event. */
  this.description = object.description || this.description || '';

  /** An array of resource UUID's that are associated with this Event.*/
  this.resources = object.resources || this.resources || [];

  /**
    * An associative array of competitor information, where the key is the
    * UUID of the competitor and each entry contains a label and score like
    * the following.
    *
    * <pre><code>
    *   var competitors = {
    *     '123456789' => {
    *       'label':'Competitor 1',
    *       'score':5
    *     },
    *     '232342342' => {
    *       'label':'Competitor 2',
    *       'score':10
    *     }
    *   };
    * </code></pre>
    */
  this.competitors = object.competitors || this.competitors || {};

  /**
    * <p>The category of this event.</p>
    * <ul>
    * <li>Game</li>
    * <li>Meeting</li>
    * <li>Other</li>
    * <li>Party</li>
    * <li>Practice</li>
    * <li>Scrimmage</li>
    * </ul>
    * <p><em>Game</em> and <em>Scrimmage</em> categories require competitors
    * array to be passed and will override the title.</p>
    */
  this.category = object.category || this.category || 'Other';

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
