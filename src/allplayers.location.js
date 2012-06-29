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
allplayers.location = function(object, callback, options) {

  // Derive from drupal.entity.
  drupal.entity.call(this, object, callback, options);
};

/** Derive from drupal.entity. */
allplayers.location.prototype = new drupal.entity();

/** Reset the constructor */
allplayers.location.prototype.constructor = allplayers.location;

/**
 * Sets the object.
 *
 * @param {object} object The object which contains the data.
 */
allplayers.location.prototype.set = function(object) {
  drupal.entity.prototype.set.call(this, object);

  /** Street Address. */
  this.street = this.street || '';

  /** City */
  this.city = this.city || '';

  /** State / Province */
  this.state = this.state || '';

  /** Postal Code */
  this.zip = this.zip || '';

  /** Country */
  this.country = this.country || '';

  /** Latitude */
  this.latitude = this.latitude || '';

  /** Longitude */
  this.longitude = this.longitude || '';
};

/**
 * Returns the object to send to Services.
 *
 * @return {object} The object to send to the Services endpoint.
 */
allplayers.location.prototype.get = function() {
  return jQuery.extend(drupal.entity.prototype.get.call(this), {
    street: this.street,
    city: this.city,
    state: this.state,
    zip: this.zip,
    country: this.country,
    latitude: this.latitude,
    longitude: this.longitude
  });
};
