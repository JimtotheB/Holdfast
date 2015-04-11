/**
 * @file Starting
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var BaseState = require('./BaseState');

/**
 * Starts a container.
 * @module Starting
 */

var Starting = (function() {
  function Starting(options){
    BaseState.call(this,options);
    this.name = 'starting'
    this.restartAttempts = 0
  }
  Starting.prototype = _.create(BaseState.prototype, {
    constructor: Starting,
    enter: function(){
      var self = this;

      this.Network.findContainer(this.Manager.containerId)
        .then(function(container) {
          if(!container.state.Running){
            self.run();
          }
          else {
            self.Manager.transitionTo('started')
          }
        })
    },
    run: function(){
      var self = this;
      this.restartAttempts += 1;
      this.Network.startContainer(this.Manager.containerId).then(function(container){
        if(container.started){
          return self.Network.findContainer(self.Manager.containerId).then(function(container){
            self.Manager.setContainerData(container.container);
            return self.Manager.transitionTo('started')
          });
        }
        else {
          if(self.restartAttempts <= 5){
            console.log('%s Restart failed, retrying', self.Manager.DockerImage);
            /**
             *  This could easily be:
             *  setTimeout(self.enter.bind(self), time)
             *  But I prefer to avoid overly clever stuff.
             */
            return setTimeout(function(){
              self.enter()
            }, self.restartAttempts * 1000)
          }
          console.log('%s failed 5 restart attempts.\n Moving to stopped state.', self.Manager.DockerImage)
          self.Manager.transitionTo('error')
        }
      });
    },
    exit: function() {
      this.restartAttempts = 0;
    }
  });
  return Starting
})();

module.exports = Starting