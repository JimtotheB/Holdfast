/**
 * @file Events
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var EventEmitter= require('events').EventEmitter
var _ = require('lodash');
var util = require('util');
var shortId = require('shortid');
var instanceId = shortId.generate() + shortId.generate();
var RedisFactory = require('./ConnectionFactory')("redis://database.internal:6379/0");

var commandHandler = function(pattern, channel, message){
  var channelBase = 'holdfast-commands-'+ this.instance.HostId + '-';
  var parsedChannel = channel.split(channelBase)[1];
  var parsedMessage
  try {
    parsedMessage = JSON.parse(message);
  } catch (e) {
    console.log('Message not valid JSON', message)
    return
  }
  switch (parsedChannel) {
    case 'connected':
      this.emit('manager-connected', parsedMessage)
      break;

    default:
      console.log(parsedChannel);
      console.log(parsedMessage);
  }
  
};

var globalHandler = function(pattern, channel, message){
  var channelBase = 'holdfast-global-';
  var parsedChannel = channel.split(channelBase)[1];
  var parsedMessage
  try {
    parsedMessage = JSON.parse(message);
  } catch (e) {
    console.log('Message not valid JSON', message)
    return
  }
  switch (parsedChannel) {
    case 'manager-connected':
      this.emit('connected', parsedMessage)
      break;
    case 'manager-started':
      this.emit('manager-started', parsedMessage);
      break;
    case 'manager-stopped':
      this.emit('manager-stopped', parsedMessage);
      break;
    default:
      console.log('No handler');
      console.log(parsedChannel);

  }
};

var Events = (function() {
  function Events(){
    var self = this;
    this.instance = {
      HostId: shortId.generate() + shortId.generate()
    };

    /**
     * This is the publisher connection.
     */
    this.managerClient = RedisFactory();

    /**
     *  Listen on holdfast-commands-<instanceId>
     *  These will be management events directed at this host only.
     */
    this.commands = RedisFactory('holdfast-commands-'+ this.instance.HostId + '-*');
    this.commands.on('subscribe', function(channel) {
      console.log('Subscribed to ' + channel +' events.');
      this.commands.on('message', function(p, channel, message){
        commandHandler.apply(this, [p,channel, message]);
      }.bind(this));
    }.bind(this))

    /**
     *  Subscribe to system wide commands.
     */
    this.manager = RedisFactory('holdfast-global-*');
    this.manager.on('subscribe',function(channel) {
      console.log('Subscribed to ' + channel +' events.');
      this.managerClient.publish('holdfast-manager-startup', self.instance)
      this.manager.on('message', function(p, channel, message){
        globalHandler.apply(this, [p, channel, message])
      }.bind(this))
    }.bind(this))
  }


  Events.prototype = _.create(EventEmitter.prototype, {
    constructor: Events,
    exit: function(){
      this.managerClient.publish('holdfast-manager-shutdown', this.instance)
    },
    registerHost: function() {
      this.managerClient.publish('holdfast-manager-startup', this.instance)
    },
    registerContainer: function(image, container, cb){
      this.managerClient.publish('holdfast-manager-register-container', {
        HostId: this.instance.HostId,
        image: image,
        container: container
      }, cb)
    },
    stateTransition: function(state, image, container, cb){
      this.managerClient.publish('holdfast-manager-state-transition', {
        HostId: this.instance.HostId,
        state: state,
        image: image,
        container: container
      }, cb);
    },
    sendUpdate: function(currentContainers) {
      this.managerClient.publish('holdfast-manager-update', {
        HostId: this.instance.HostId,
        containers: currentContainers
      })
    },
    getPayload: function() {
      return this.managerClient.Client.getAsync("octorp:holdfast-payload")
    }
  });
  return new Events()
})();

/**
 * Proxies redis events.
 * @module Events
 */

module.exports = Events