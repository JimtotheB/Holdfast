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
    this.Manager = undefined;
    this.Network = options.Network;
    this.DockerImage = options.DockerImage;
    return this
  }
  BaseState.prototype.init = function(manager) {
    this.Manager = manager;
  };
  return BaseState
})();

module.exports = BaseState