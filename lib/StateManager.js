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
var Events = require('./Events/Events');

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
    this.options = options || {}
    this.network = options.network
    this.ManagerId = shortId.generate() + shortId.generate();
    this.containerId = undefined;
    this.image = options.network.image
    this.currentContainer = undefined;
    this.sanitizedContainer = undefined;
    this.state = undefined;
    this.states = {
      create: new CreateNew({network: this.network}),
      started: new Started({network: this.network}),
      starting: new Starting({network: this.network}),
      stopped: new Stopped({network: this.network}),
      stopping: new Stopping({network: this.network}),
      pulling: new Pulling({network: this.network}),
      error: new Error({network: this.network})
    };

    return this
  }
  StateManager.prototype.sanitizeContainer = function() {
    var sanitize = {
      ManagerId: this.ManagerId
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
    Events.registerContainer(this.image, this.sanitizeContainer(), function(){
      console.log('registered')
    });
  };
  StateManager.prototype.transitionTo = function(state) {
    //console.log(this.image, 'transitioning', '\n  from:',this.state.name, '\n  to:', state);
    if(this.state !== this.states[state]){
      this.state.exit();
      this.state = this.states[state];
      Events.stateTransition(this.state.name , this.image , this.sanitizeContainer(), function(){
        this.state.enter();
      }.bind(this));
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
    Events.registerContainer(this.image, this.sanitizeContainer(), cb);

  };

  StateManager.prototype.maintainState = function() {
    Events.stateTransition(this.state.name , this.image , this.sanitizeContainer(), function(){
      this.state.enter();
    }.bind(this));
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

