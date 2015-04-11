/**
 * @file NetworkBase
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast-client
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var Promise = require('bluebird');
var request = require('request');
var _ = require('lodash');

/**
 * Base Object for docker networking.
 * @module NetworkBase
 */

var NetworkBase = (function() {
  function NetworkBase(options) {
    this.Request = options.Request

  }

  NetworkBase.prototype.stopAllContainers = function(payload) {
    var self = this;
    return this.Request.getAsync('/containers/json?all=1').spread(function(res, body) {
      var currentlyRunning = body

      var stoppedImages = []
      var removedContainers = []

      /**
       * All unique images in payload.
       */
      var imagesInPayload = _.uniq(payload.docker, 'Image');
      var latestImage = _.map(imagesInPayload, function(image) {
        return image.Image + ':latest'
      });

      /**
       * Stop all containers that match the images in the payload.
       */
      _.each(latestImage, function(image) {
        var matching = _.map(_.filter(currentlyRunning, 'Image', image), function(running) {
          return running.Id
        });
        _.each(matching, function(toStop) {
          stoppedImages.push(self.Request.postAsync('/containers/' + toStop + '/stop').spread(function(res, body) {
            return {id: toStop, status: res.statusCode}
          }))
        })
      });
      /**
       * All containers stopped, proceed to remove them.
       */
      return Promise.all(stoppedImages).then(function(stopped) {
        _.each(stopped, function(toRemove) {
          removedContainers.push(self.Request.delAsync('/containers/' + toRemove.id).spread(function(res, body) {
            return {id: toRemove, status: res.statusCode}
          }))
        });
        /**
         * All matching containers removed. Start containers in payload.
         */
        return Promise.all(removedContainers)
      });

    })
  };
  return NetworkBase

})();

module.exports = NetworkBase