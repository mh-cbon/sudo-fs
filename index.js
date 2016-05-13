
var sudoFs;

if (process.platform.match(/^win/)) sudoFs = require('./lib/windows.js')
else sudoFs = require('./lib/linux.js')

module.exports = sudoFs;
