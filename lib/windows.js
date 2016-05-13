var path    = require('path');
var miss    = require('mississippi');
var spawn   = require('@mh-cbon/c-aghfabsowecwn').spawn;

var createReadStream = function (path) {
  var sPath = path.toString();
  var child = spawn(process.argv[0], ['node_modules/.bin/catf', sPath], {stdio: ['ignore', 'pipe', 'pipe']});

  var stream = miss.through();
  stream.path = path;

  child.on('error', function (err) {
    stream.emit('error', err);
  });

  child.once('started', function () {
    stream.emit('open')
  })
  var stderr = '';
  child.stderr.on('data', function (d) {
    stderr += d.toString();
  });

  child.on('close', function (code) {
    if (code!==0 && stderr) {
      stream.emit('error', stderr)
    }
    stream.emit('close');
  });

  child.stdout.pipe(stream);

  return stream;
}

var createWriteStream = function (path, options) {
  var sPath = path.toString();

  var stream = miss.through();
  stream.path = path;

  var child = spawn(process.argv[0], ['node_modules/.bin/fwrite', sPath], {stdio: 'pipe'});

  stream.bytesWritten = 0;
  child.stdin.on('data', function (d) {
    stream.bytesWritten += d.length;
  });

  child.on('error', function (err) {
    stream.emit('error', err);
  });

  child.once('started', function () {
    stream.emit('open')
  })
  stream.pipe(child.stdin);
  child.once('close', function () {
    stream.emit('close')
  })

  return stream;
}

var writeFile = function (fPath, content, options, callback) {
  if (!callback && typeof(options)==='function') {
    callback = options
    options = {}
  }
  var err;
  createWriteStream(fPath, options)
  .on('error', function (e) {
    err = e;
  })
  .on('close', function () {
    callback(err)
  })
  .end(content)
}

var readFile = function (fPath, options, callback) {
  if (!callback && typeof(options)==='function') {
    callback = options
    options = {}
  }
  var err;
  var data = '';
  createReadStream(fPath, options)
  .on('data', function (d) {
    data += d.toString();
  })
  .on('error', function (e) {
    err = e;
  })
  .on('close', function () {
    callback(err, data)
  })
}

var mkdir = function (fPath, mod, callback) {
  if (!callback && typeof(mod)==='function') {
    callback = mod
    mod = ''
  }

  var args = ['node_modules/.bin/mkdirp', fPath]
  if (mod) args.concat(['-m', mod.toString(8)]);

  var child = spawn(process.argv[0], args, {stdio: 'pipe'});

  var stdout = '';
  child.stdout.on('data', function (d) {
    stdout += d.toString();
  })
  var stderr = '';
  child.stderr.on('data', function (d) {
    stderr += d.toString();
  })

  var err;
  child.on('error', function (e) {
    err = e
  });

  child.on('close', function (code) {
    callback && callback(code!==0 ? (err || stdout + stderr) : null);
  });
}

var unlink = function (fPath, callback) {

  var child = spawn(process.argv[0], ['node_modules/.bin/rimraf', fPath], {stdio: 'pipe'});

  var stdout = '';
  child.stdout.on('data', function (d) {
    stdout += d.toString();
  })
  var stderr = '';
  child.stderr.on('data', function (d) {
    stderr += d.toString();
  })

  var err;
  child.on('error', function (e) {
    err = e
  });

  child.on('close', function (code) {
    callback && callback(code!==0 ? (err || stdout + stderr) : null);
  });
}

var chmod = function (fPath, mod, callback) {
  // mhh, not really sure what to do here.
  callback()
}

var chown = function (fPath, uid, gid, callback) {
  // mhh, not really sure what to do here.
  callback()
}

var exists = function (fPath, callback) {

  var dir = path.dirname(fPath);
  var child = yasudo(process.argv[0], ['node_modules/.bin/lsj', dir]);

  var data = '';
  child.stdout.on('data', function (d) {
    data += d.toString()
  });

  var stderr = '';
  child.stderr.on('data', function (d) {
    stderr += d.toString()
  });

  var err;
  child.on('error', function (e) {
    err = e
  });

  child.on('close', function () {
    if (err) return callback && callback(false);
    if (code!==0) return callback && callback(stderr);
    data = JSON.parse(data);
    callback && callback(
      data.indexOf(path.basename(fPath))>-1
    )
  });
}

var fs = {
  createReadStream:   createReadStream,
  createWriteStream:  createWriteStream,

  readFile:   readFile,
  writeFile:  writeFile,

  unlink: unlink,
  rmdir:  unlink,
  mkdir:  mkdir,
  chown:  chown,
  chmod:  chmod,
  exists: exists,
}

module.exports = fs;
