/**
 * @file StateManager
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var Network = require('./Network/Network');
var CreateNew= require('./States/CreateNew');
var Started = require('./States/Started');
var Starting = require('./States/Starting');
var Stopped = require('./States/Stopped');
var Stopping = require('./States/Stopping');
var Pulling = require('./States/Pulling');
var Error = require('./States/ErrorParking');
var _ = require('lodash');

var shortId = require('shortid');

/**
 *
 * Manages Docker application state and state transitions.
 * @module StateManager
 */

var StateManager = (function() {
  function StateManager(options){
    if(!(this instanceof arguments.callee)) {
      throw new Error('Constructor called as a function');
    }
    this.EventManager = options.EventManager
    this.NetworkManaged = options.NetworkManaged
    this.DockerConfig = options.DockerConfig
    this.DockerImage = options.DockerImage
    this.ManagerId = shortId.generate() + shortId.generate();
    this.Network = new Network({
      Request: options.Request,
      DockerImage: options.DockerImage,
      DockerConfig: options.DockerConfig
    })


    this.containerId = undefined;
    this.currentContainer = undefined;
    this.sanitizedContainer = undefined;
    this.state = undefined;
    var stateConfig = {
      Network:  this.Network,
      DockerImage: this.DockerImage
    }
    this.states = {
      create: new CreateNew(stateConfig),
      started: new Started(stateConfig),
      starting: new Starting(stateConfig),
      stopped: new Stopped(stateConfig),
      stopping: new Stopping(stateConfig),
      pulling: new Pulling(stateConfig),
      error: new Error(stateConfig)
    };

    return this
  }
  StateManager.prototype.sanitizeContainer = function() {
    var sanitize = {
      ManagerId: this.ManagerId,
      DockerImage: this.DockerImage
    }
    if(this.currentContainer !== undefined){
      sanitize.Id = this.currentContainer.Id.substr(0, 10)
      sanitize.Ports = this.currentContainer.NetworkSettings.Ports
      sanitize.Created = this.currentContainer.Created
      sanitize.Name = this.currentContainer.Name
      sanitize.State = this.currentContainer.State
      sanitize.ManagedState = this.state.name;
    }
    return sanitize
  };
  StateManager.prototype.managerStartup = function(){
    this.EventManager.registerContainer(this.DockerImage, this.sanitizeContainer(), function(){
      console.log('registered')
    });
  };
  StateManager.prototype.transitionTo = function(state) {
    console.log(this.DockerImage, 'transitioning', '\n  from:',this.state.name, '\n  to:', state);
    if(this.state !== this.states[state]){
      this.state.exit();
      this.state = this.states[state];
      if(this.NetworkManaged) {
        this.EventManager.stateTransition(this.state.name, this.DockerImage, this.sanitizeContainer(), function() {
          this.state.enter();
        }.bind(this));
      }
      else {
        this.state.enter()
      }
    }
  };
  StateManager.prototype.getRunningData = function() {
    return {
      containerId: this.containerId,
      image: this.image,
      container: this.currentContainer
    }
  };
  StateManager.prototype.setContainerData = function(obj) {
    this.currentContainer = obj;
    this.sanitizedContainer = this.sanitizeContainer()
  };
  StateManager.prototype.getContainerData = function() {
    return this.currentContainer;
  };

  StateManager.prototype.initialize = function(cb) {
    cb = (typeof cb === "function") ? cb : function(){};
    /**
     *  Initialize all of the possible states.
     */
    _.each(this.states, function(state){
      state.init(this)
    }, this);

    /**
     *  Set our initial state to pulling, this will make sure the containers on this host
     *  are updated.
     */
    this.state = this.states.pulling;
    if(this.NetworkManaged){
      this.EventManager.registerContainer(this.DockerImage, this.sanitizeContainer(), cb);
    }
    else {
      cb()
    }


  };

  StateManager.prototype.enter = function() {
    if(this.NetworkManaged){
      this.EventManager.stateTransition(this.state.name , this.DockerImage , this.sanitizeContainer(), function(err, count){
        console.log(err, count);
        this.state.enter();
      }.bind(this));
    }
    else {
      this.state.enter()
    }
    return this
  };
  StateManager.prototype.stop = function() {
    this.state = this.states.stopping;
    this.state.enter()
  };
  StateManager.prototype.shutdown = function() {
    console.log('Shutdown', this.containerId)
    return this.network.shutdown(this.containerId);
  };

  return StateManager
})();


module.exports = StateManager;

