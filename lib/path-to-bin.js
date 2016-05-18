var fs   = require('fs');
var path = require('path');

var pathToBin = function(p, then) {
  var t = path.join(process.cwd(), 'node_modules', '.bin', p);
  fs.stat(t, function (err){
    if(!err) return then(null, t)
    t = path.join(__dirname, '..', 'node_modules', '.bin', p);
    fs.stat(t, function (err){
      if(!err) return then(null, t)
      t = path.join(__dirname, '..', '..', 'node_modules', '.bin', p);
      fs.stat(t, function (err){
        if(!err) return then(null, t)
        t = path.join(__dirname, '..', '..', '..', 'node_modules', '.bin', p);
        fs.stat(t, function (err){
          if(!err) return then(null, t)
          then(err);
        })
      })
    })
  })
}

module.exports = pathToBin;
