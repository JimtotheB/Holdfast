/**
 * @file Stopped
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var BaseState = require('./BaseState');

/**
 * Default not running state. Listens for start event on run.
 * @module Stopped
 */

var Stopped = (function() {
  function Stopped(options) {
    BaseState.call(this, options);
    this.name = 'stopped'
  }

  Stopped.prototype = _.create(BaseState.prototype, {
    constructor: Stopped,
    enter: function() {
      
    },
    run: function() {

    },
    exit: function() {

    }
  });
  return Stopped
})();

module.exports = Stopped;