/**
 * @file Stopping
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var BaseState = require('./BaseState');

/**
 * Stops a running container.
 * @module Stopping
 */

var Stopping = (function() {
  function Stopping(options) {
    BaseState.call(this, options);
    this.name = 'stopping'
  }

  Stopping.prototype = _.create(BaseState.prototype, {
    constructor: Stopping,
    enter: function() {
      var self = this
      this.Network.stopContainer(this.manager.containerId).then(function(status) {
        if(status.stopped){
          self.manager.transitionTo('stopped')
        }
        else {
          self.manager.transitionTo('error')
        }
      })
    },
    run: function() {

    },
    exit: function() {

    }
  });
  return Stopping
})();

module.exports = Stopping;