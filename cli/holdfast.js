#!/usr/bin/env node
/**
 * @file holdfast-client
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast-client
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var path = require('path');
var scriptPath = path.join(__dirname, '../lib', 'Holdfast');

var app = require('commander');

app
  .version('0.0.1')
  .option("-c --config <file>", "Path to .JSON file holding the configuration and docker info for this host")
  .parse(process.argv)

if(app.config){
  require(scriptPath)(app.config)
}
else {

  require(scriptPath)(false)
}
//