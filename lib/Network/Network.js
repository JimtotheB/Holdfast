/**
 * @file Network
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */
var NetworkBase = require('./NetworkBase');
var Promise = require('bluebird');
var request = require('request');
var _ = require('lodash');
/**
 * Base class for State objects.
 * @module Network
 */

var Network = (function() {
  function Network(options){
    if(!(this instanceof arguments.callee)) {
      throw new Error('Constructor called as a function');
    }
    /**
     * Provides this.request
     */
    NetworkBase.apply(this, arguments);
    this.dockerConfig = options.dockerConfig;
    this.imageBase = this.dockerConfig.Image;
    this.image = this.imageBase + ':latest';

  };

  Network.prototype = _.create(NetworkBase.prototype, {
    findContainer: function(id) {
      var self = this;
      return this.request.getAsync('containers/' + id + '/json').spread(function(res, body) {
        return {state: body.State, image: body.Config.Image, container: body}
      })
    },
    getContainer: function() {
      var self = this
      return this.request.getAsync('/containers/json')
        .spread(function(res, body) {
          return body[_.findIndex(body, 'Image', self.image)]
        })
    },
    getStoppedContainers: function(){
      var self = this;
      return this.request.getAsync('/containers/json?all=1').spread(function(res, body) {
        return _.filter(body, 'Image', self.image)
      });
    },
    /**
     * Get
     *
     * @returns {promise}
     */
    getAllContainers: function() {
      var self = this;
      return this.request.getAsync('/containers/json?all=1')
        .spread(function(res, body) {
          return _.filter(body, {Image: self.image})
          //return body[_.findIndex(body, 'Image', self.image)]
        })
    },
    startContainer: function(id) {
      return this.request.postAsync('containers/' + id + '/start')
        .spread(function(res, body) {
          var containerStarted = (res.statusCode === 204)
          var containerData = {started: containerStarted}
          return containerData
        })
    },
    getImage: function() {
      return this.request.getAsync('images/' + this.imageBase + '/json').spread(function(res, body) {
        return res.statusCode
      })
    },
    createContainer: function(){
      return this.request.postAsync('/containers/create', {body: this.dockerConfig})
        .spread(function(res, body) {
          var containerCreated = (res.statusCode === 201)
          var containerData = {containerId: body.Id, created: containerCreated}
          return containerData
        });
    },
    /**
     *
     * @returns {promise}
     */
    pullContainer: function() {
      var self = this;
      var error;
      var pullSuccess = new Promise(function(resolve, reject){

        var pullStatus = self.request.post('/images/create?fromImage=' + self.image)

        pullStatus.on('data', function(data){
          var data = JSON.parse(data)
          error = _.has(data, 'error')
        });

        pullStatus.on('error', reject)

        pullStatus.on('end', function(){
          var retVal = {pulled: true}
          if(error){
            retVal.pulled = false
            return resolve(retVal)
          }
          self.getImage().then(function(statusCode){
            var retVal = {pulled: true}
            if(statusCode === 404){
              retVal.pulled = false
            }
            else if(statusCode === 500){
              retVal.pulled = false
            }
            return resolve(retVal);

          });
        });
      });
      return pullSuccess

    },
    stopContainer: function(id) {
      console.log(id);
      return this.request.postAsync('/containers/'+id+'/stop').spread(function(res, body) {
        return {stopped: (res.statusCode === 204 || res.statusCode === 304)};
      })
    },
    shutdown: function(id){
      return this.request.delAsync('/containers/' + id +'?force=1').spread(function(res, body) {
        var sc = res.statusCode
        return {removed: (sc === 204)}
      })
    }
  });
  return Network
})();


module.exports = Network;