/**
 * @file Instance
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */


/**
 * Handles pushins instance data to redis.
 * @module Instance
 */

var InstanceHandler = (function(){
  function InstanceHandler(options){
    this.Redis = options.Redis;
  };
  return InstanceHandler
})();

module.exports = function(redis){
  return new InstanceHandler({Redis: redis})
}