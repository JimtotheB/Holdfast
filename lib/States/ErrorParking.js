/**
 * @file ErrorParking
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var BaseState = require('./BaseState');

/**
 * Parks containers unable to run.
 * @module ErrorParking
 */

var ErrorParking = (function() {
  function ErrorParking(options) {
    BaseState.call(this, options);
    this.name = 'error';
  }

  ErrorParking.prototype = _.create(BaseState.prototype, {
    constructor: ErrorParking,
    enter: function() {
      console.log('This is the last stop for', this.currentContainer )
    },
    run: function() {

    },
    exit: function() {

    }
  });
  return ErrorParking
})();

module.exports = ErrorParking;