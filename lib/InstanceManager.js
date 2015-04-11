/**
 * @file InstanceManager
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var Promise = require('bluebird');
var _ = require('lodash');

var shortId = require('shortid');
var EventEmitter = require('events').EventEmitter;

/**
 * Manages the Holdfast instance including all StateManagers.
 * @module InstanceManager
 */

var InstanceManager = (function() {
  function InstanceManager(options){
    this.Redis = options.Redis.Redis.Client;
    this.instanceId = shortId.generate() + shortId.generate();
    this.redisKey = 'holdfast-instance:' + this.instanceId;
    this.ttl = 60 * 6
    this.stateManagers = []
    this.Redis.on('connect', function(){
      this.emit('connect')
      this.Redis.hsetAsync(this.redisKey, 'instanceId', this.instanceId).then(function(){

      });
    }.bind(this))
  }
  InstanceManager.prototype = _.create(EventEmitter.prototype, {
    addManager: function(manager) {
      var data = JSON.stringify({
        ManagerId: manager.ManagerId,
        ManagerData: manager.sanitizeContainer(),
        UpdateTime: Date.now()
      })
      this.Redis.multi()
        .hset(this.redisKey, manager.ManagerId, data)
        .expire(this.redisKey, this.ttl)
        .execAsync().then(function() {
          this.stateManagers.push(manager);
      }.bind(this));
    },
    updateManagers: function(){
      var updates = []
      _.each(this.stateManagers, function(manager) {
        var data = JSON.stringify({
          ManagerId: manager.ManagerId,
          ManagerData: manager.sanitizeContainer(),
          UpdateTime: Date.now()
        });
        updates.push(this.Redis.multi()
          .hset(this.redisKey, manager.ManagerId, data)
          .expire(this.redisKey, this.ttl)
          .execAsync())
      }.bind(this));
      return Promise.all(updates)
    },
    removeInstance: function() {
      return this.Redis.delAsync(this.redisKey)
    }
  });
  return InstanceManager
})();


module.exports = function(options){
  return new InstanceManager({Redis: options.Redis});
};