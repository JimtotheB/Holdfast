/**
 * @file Pulling
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var BaseState = require('./BaseState');

/**
 * Pulls the specified docker container.
 * @module Pulling
 */

var Pulling = (function() {
  function Pulling(options) {
    BaseState.call(this, options);
    this.name = 'pulling'
  }

  Pulling.prototype = _.create(BaseState.prototype, {
    constructor: Pulling,
    enter: function() {
      var self = this;
      this.Network.pullContainer()
        .then(function(status) {
          if(!status.pulled){
            return self.manager.transitionTo('error');
          }
          self.manager.transitionTo('create')
        })

      this.run()
    },
    run: function() {

    },
    exit: function() {

    }
  });
  return Pulling
})();

module.exports = Pulling;