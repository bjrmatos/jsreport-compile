/* eslint no-template-curly-in-string: 0 */

var fs = require('fs')
var path = require('path')

function replaceInFile (pathToFile, toReplace, replacement) {
  var fullPath = path.join(__dirname, '../', pathToFile)
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, fs.readFileSync(fullPath).toString().replace(toReplace, replacement))
  }
}

function prependToFile (pathToFile, prepend) {
  var fullPath = path.join(__dirname, '../', pathToFile)
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, prepend + fs.readFileSync(fullPath).toString())
  }
}

module.exports = function () {
  replaceInFile('node_modules/chokidar/lib/fsevents-handler.js', 'fsevents = require(\'fsevents\');', 'throw new Error()')
  replaceInFile('node_modules/ws/lib/BufferUtil.js', 'module.exports = require(\'bufferutil\')', 'throw new Error()')
  replaceInFile('node_modules/ws/lib/Validation.js', 'module.exports = require(\'utf-8-validate\')', 'throw new Error()')

  var negotiatorRequireTweeks = `
  require('./charset.js')
  require('./encoding.js')
  require('./language.js')
  require('./mediaType.js')
`

  prependToFile('node_modules/engine.io/node_modules/negotiator/lib/negotiator.js', negotiatorRequireTweeks)

  var socketioPath = path.join(__dirname, '../', 'node_modules/socket.io-client/socket.io.js')
  if (fs.existsSync(socketioPath)) {
    var socketioTweeks = "new Buffer('" + fs.readFileSync(socketioPath).toString('base64') + "', 'base64').toString('utf8')"
    replaceInFile('node_modules/socket.io/lib/index.js', `read(require.resolve('socket.io-client/socket.io.js'), 'utf-8');`, socketioTweeks)
  }

  var nconfTweeks = `
  nconf.__defineGetter__('Argv', function () { return require('./nconf/stores/argv')['Argv']})
  nconf.__defineGetter__('Env', function () { return require('./nconf/stores/env')['Env']})
  nconf.__defineGetter__('File', function () { return require('./nconf/stores/file')['File']})
  nconf.__defineGetter__('Literal', function () { return require('./nconf/stores/literal')['Literal']})
  nconf.__defineGetter__('Memory', function () { return require('./nconf/stores/memory')['Memory']})  
  `

  var nconfOriginal = `fs.readdirSync(__dirname + '/nconf/stores').forEach(function (file) {
  var store = file.replace('.js', ''),
      name  = common.capitalize(store);

  nconf.__defineGetter__(name, function () {
    return require('./nconf/stores/' + store)[name];
  });
});`

  replaceInFile('node_modules/nconf/lib/nconf.js', nconfOriginal, nconfTweeks)

  replaceInFile('build/nodejs/7.4.0/node-v7.4.0/lib/internal/bootstrap_node.js', 'throw new Error(`No such native module ${id}`);', 'return global.require(id)')
}