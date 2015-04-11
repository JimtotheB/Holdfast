#!/usr/bin/env node
/**
 * @file holdfast-client
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Holdfast-client
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var path = require('path');
var scriptPath = path.join(__dirname, '../lib', 'Holdfast');
var packageVersion = require(path.join(__dirname, '../', 'package.json')).version;
var app = require('commander');

app
  .version(packageVersion)
  .option("-c --config <file>", "Path to .JSON file holding the configuration and docker info for this host")
  .parse(process.argv)

if(app.config){
  var payload = require(app.config)
  require(scriptPath)(payload)
}
else {

  require(scriptPath)(false)
}
//