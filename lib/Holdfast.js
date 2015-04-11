/**
 * @file Holdfast
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var StateManager = require('./StateManager');
var Network = require('./Network/Network');
var NetworkBase = require('./Network/NetworkBase');
var _ = require('lodash');
var Promise = require('bluebird');
var request = require('request');

var request = Promise.promisifyAll(request.defaults({
  baseUrl: 'http://unix:/var/run/docker.sock:/',
  json: true, encoding: 'UTF-8'
}));

var redisFactory = require('./Events/ConnectionFactory')("redis://database.internal:6379/0");
var database = require('./Redis/Instance')(redisFactory());
var InstanceManager = require('./InstanceManager')({Redis: database});

var runningContainers = [];

module.exports = function(configObject) {
  /**
   * If a config object is passed in this is a standalone instance.
   */
  InstanceManager.on('connect', function() {
    if(configObject) {
      var NWB = new NetworkBase({Request: request})
      NWB.stopAllContainers(configObject).then(function(removed) {
        _.each(configObject.docker, function(config) {
          var StateM = new StateManager({
            EventManager: false,
            NetworkManaged: false,
            DockerConfig: config,
            DockerImage: config.Image,
            Request: request
          })
          StateM.initialize(function() {
            StateM.enter()
            InstanceManager.addManager(StateM)
          });

        })
      });

    }
    else {
      var Events = require('./Events/Events');
      Events.on('manager-connected', function(payload) {
        console.log(payload);
        var NWB = new NetworkBase({Request: request})
        NWB.stopAllContainers(payload).then(function(removed) {
          _.each(payload.docker, function(config) {

            var StateM = new StateManager({
              EventManager: Events,
              NetworkManaged: true,
              DockerConfig: config,
              DockerImage: config.Image,
              Request: request
            })
            /**
             * Call our State initialize function, this will register the client with the manager server,
             * the callback is passed over to the redis publish handler. This is to make sure our manager server
             * knows about the container before we start spamming it with state transitions.
             */
            StateM.initialize(function(err, data) {
              runningContainers.push(StateM);
              StateM.enter()
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
      if(Events) {
        Events.exit();
      }
      InstanceManager.removeInstance().then(function() {
        process.exit(0)
      });
    };

    process.on('exit', function(code) {
      console.log('Shutting down Holdfast-client', code);
    });
    //process.on('uncaughtExeption', exitHandler.bind(null, {exit: true}));
    process.on('SIGINT', shutDownHandler);
    process.on('SIGTERM', shutDownHandler);
  });

  setInterval(function() {
    InstanceManager.updateManagers()
  }, 60 * 5 * 1000)
};
/**
 * Listen for the redis connection event to get and start the containers for this host.
 */

