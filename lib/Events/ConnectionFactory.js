/**
 * @file ConnectionFactory
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */


var redis = require('redis');
var EventEmitter = require('events').EventEmitter
var url = require('url');
var _ = require('lodash');

/**
 * An event proxy.
 * Emits events with a unified API.
 *
 * @class RedisConnection
 */
var RedisSubscription = (function(){
  function RedisConnection(redis, subChannel){
    EventEmitter.call(this);
    var self = this
    this.Redis = redis
    this.channelType = (!!~subChannel.indexOf('*')) ? 'psubscribe' : 'subscribe';

    /**
     * Subscribes to either a pattern channel or a regular channel.
     */
    this.Redis[this.channelType](subChannel);

    /**
     * Proxies the event to a unified emit type.
     */
    this.Redis.on(this.channelType, function(channel, count) {
      this.emit('subscribe', channel, count);
    }.bind(this))

    /**
     * Add listeners for pmessage and message, emit message event only.
     */
    if(this.channelType === 'psubscribe'){
      this.Redis.on('pmessage', function(p,c,m){
        this.emit('message', p, c, m)
      }.bind(this));
    }
    else {
      this.Redis.on('message', function(c,m){
        this.emit('message', c, m)
      }.bind(this));
    }


  }
  RedisConnection.prototype = _.create(EventEmitter.prototype, {
    constructor: RedisConnection
  });
  return RedisConnection
})();

/**
 * A standard Redis client.
 *
 * @class RedisClient
 */

var RedisClient = (function(){
  function RedisClient(redis){
    this.Client = redis
  }
  RedisClient.prototype.publish = function(channel, message, cb){
    cb = (typeof cb === "function") ? cb : function(){};
    var serialized
    try {
      serialized = JSON.stringify(message)
    }
    catch(e){
      serialized = message
    }
    this.Client.publish(channel, serialized, cb)
  };
  return RedisClient
})();

/**
 * Returns new Redis connections.
 * @module ConnectionFactory
 */

module.exports = function(redisHost, errorHandler){
  var handleError = errorHandler || function(err){
      console.log(err);
    };
  var host = url.parse(redisHost)


  return function(subChannel) {
    var options = {max_attempts: 10, retry_max_delay: 5000};
    var redisClient = redis.createClient(host.port, host.hostname, options)
    if(subChannel){
      return new RedisSubscription(redisClient, subChannel)
    }
    return new RedisClient(redisClient);

  }
};