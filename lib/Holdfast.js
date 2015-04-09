/**
 * @file Holdfast
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var sManager = require('./StateManager');
var Network = require('./Network/Network');
var NetworkBase = require('./Network/NetworkBase');
var _ = require('lodash');
var Promise = require('bluebird');
var request = require('request');

var request = Promise.promisifyAll(request.defaults({
  baseUrl: 'http://unix:/var/run/docker.sock:/',
  json: true, encoding: 'UTF-8'
}));

var shortId = require('shortid');
var instanceId = shortId.generate() + shortId.generate();

var runningContainers = [];

var Events = require('./Events/Events');
//Events = new Events(instanceId);

module.exports = function(configObject) {
  console.log(configObject);

  /**
   * If a config object is passed in this is a standalone instance.
   */
  if(configObject){
    Events.getPayload().then(function(data, d, e) {
      console.log(data);
    })
  }
  else {

    Events.on('manager-connected', function(payload) {
      Events.getPayload().then(function(data, d, e) {
        console.log(data);
      });
      var NWB = new NetworkBase({request: request})
      NWB.stopAllContainers(payload).then(function(removed) {
        _.each(payload.docker, function(config) {

          var StateManager = new sManager({
            network: new Network({
              request: request,
              dockerConfig: config
            })
          });
          /**
           * Call our State initialize function, this will register the client with the manager server,
           * the callback is passed over to the redis publish handler. This is to make sure our manager server
           * knows about the container before we start spamming it with state transitions.
           */
          StateManager.initialize(function(err, data) {
            runningContainers.push(StateManager);
            StateManager.maintainState()
          });
        });

      });
    });

    Events.on('manager-started', function(message) {
      console.log(message)
    });

    Events.on('manager-stopped', function(message) {
      console.log(message)
    })

  }
  var shutDownHandler = function() {
    Events.exit();
    process.exit(0)
  };

  process.on('exit', function(code) {
    console.log('Shutting down Holdfast-client', code);
  });
  //process.on('uncaughtExeption', exitHandler.bind(null, {exit: true}));
  process.on('SIGINT', shutDownHandler);
  process.on('SIGTERM', shutDownHandler);
}
/**
 * Listen for the redis connection event to get and start the containers for this host.
 */

