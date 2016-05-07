
var sudoFs;

if (process.platform.match(/win/)) sudoFs = require('./lib/linux.js')
else sudoFs = require('./lib/linux.js')

module.exports = sudoFs;
