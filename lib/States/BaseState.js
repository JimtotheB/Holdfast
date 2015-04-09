/**
 * @file BaseState
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

/**
 * State Inheritance Object.
 * @module BaseState
 */

var BaseState = (function() {
  function BaseState(options){
    this.manager = undefined;
    this.Network = options.network;
    this.imageName = this.Network.imageBase;
    return this
  }
  BaseState.prototype.init = function(manager) {
    this.manager = manager;
  };
  return BaseState
})();

module.exports = BaseState