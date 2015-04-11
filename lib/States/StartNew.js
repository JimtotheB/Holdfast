/**
 * @file StartNew
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var BaseState = require('./BaseState');

/**
 * Starts a container with the run command.
 * @module StartNew
 */

var StartNew = (function() {
  function StartNew(options) {
    BaseState.call(this, options);
    this.state.name = 'create'
  }

  StartNew.prototype = _.create(BaseState.prototype, {
    constructor: StartNew,
    enter: function() {
      var self = this;
      this.Network.getImage().then(function(status) {
        this.Manager.transitionTo('starting')
      })
    },
    run: function() {

    },
    exit: function() {

    }
  });
  return StartNew
})();

module.exports = StartNew;