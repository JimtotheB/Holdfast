/**
 * @file Started
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var BaseState = require('./BaseState');
/**
 * Default state, monitors running container.
 * @module Started
 */

var Started = (function() {
  function Started(options){
    BaseState.call(this,options);
    this.name = 'started';
    this.active = false;
  }
  Started.prototype = _.create(BaseState.prototype, {
    constructor: Started,
    enter: function(){
      var self = this;
      this.Network.findContainer(this.Manager.containerId).then(function(container){
        /**
         * Container exists, and is running. maintain this state.
         */
        if(container.state.Running){
          self.Manager.setContainerData(container.container);
          self.run();
        }
        /**
         * Container is not running.
         */
        else {
          console.log(self.Manager.DockerImage + ' appears down. attempting restart');
          self.Manager.transitionTo('starting');
        }
      });
    },
    run: function(){
      var self = this
      var update = function() {
        clearTimeout(self.timer)
        self.timer = setTimeout(function() {
          self.count += 1
          self.enter();
          update();
        }, 5000)
      };
      update();
    },
    exit: function() {
      this.active = false;
      clearTimeout(this.timer);
    }
  });
  return Started
})();

module.exports = Started