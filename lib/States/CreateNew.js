/**
 * @file CreateNew
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var BaseState = require('./BaseState');

/**
 * Creates a new container from image.
 * @module CreateNew
 */

var CreateNew = (function() {
  function CreateNew(options) {
    BaseState.call(this, options);
    this.name = 'create'
  }

  CreateNew.prototype = _.create(BaseState.prototype, {
    constructor: CreateNew,
    enter: function() {
      var self = this;
      this.Network.getImage().then(function(status) {
        self.Network.createContainer({})
          .then(function(container) {
            if(container.created){
              self.manager.containerId = container.containerId;
              self.manager.transitionTo('starting');
            }
            else {
              //self.manager.transitionTo('pulling');
            }
           })
          .catch(function(err) {
            console.log(err);
          })
      })
    },
    run: function() {

    },
    exit: function() {

    }
  });
  return CreateNew
})();

module.exports = CreateNew;