var path        = require('path');
var miss        = require('mississippi');
var spawn       = require('@mh-cbon/c-aghfabsowecwn').spawn;
var oPathToBin   = require('./path-to-bin.js');

var pathToBin = function (p, then) {
  if (process.platform.match(/win/)) return oPathToBin(p + '.cmd', then);
  oPathToBin(p, then);
}
var platformNodebinSpawn = function (bin, args, opts) {
  if (process.platform.match(/win/)) return spawn(bin, args, opts);
  args.unshift(bin)
  return spawn(process.argv[0], args, opts);
}

var createReadStream = function (fPath) {
  var stream = miss.through();
  pathToBin('catf', function (err, binPath) {
    if (err) return stream.emit('error', err);
    fPath = fPath.toString();
    var child = platformNodebinSpawn(binPath, [fPath], {stdio: ['ignore', 'pipe', 'pipe']});

    stream.path = fPath;

    child.on('error', function (err) {
      stream.emit('error', err);
    });

    var stderr = '';
    child.stderr.on('data', function (d) {
      stderr += d.toString();
    });

    child.on('close', function (code) {
      if (code!==0) {
        stream.emit('error', stderr)
      } else {
        stream.emit('end');
        stream.emit('close');
      }
    });

    child.stdout.once('data', function (d) {
      stream.emit('open')
    })
    child.stdout.on('data', function (d) {
      stream.write(d)
    })
  })

  return stream;
}

var createWriteStream = function (fPath, options) {
  var stream = miss.through();
  pathToBin('fwrite', function (err, binPath) {
    if (err) return stream.emit('error', err);
    fPath = fPath.toString();

    stream.path = fPath;

    var child = platformNodebinSpawn(binPath, [fPath], {stdio: 'pipe'});

    stream.bytesWritten = 0;
    stream.on('data', function (d) {
      stream.bytesWritten += d.length;
    });

    child.on('error', function (err) {
      stream.emit('error', err);
    });

    stream.pipe(child.stdin);
    var stderr = '';
    child.stderr.on('data', function (d) {
      stderr += d.toString();
    });
    child.once('close', function (code) {
      if (code!==0) {
        stream.emit('error', stderr)
      } else {
        stream.emit('open')
        stream.emit('close');
      }
    })
  });

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
  pathToBin('mkdirp', function (err, binPath) {
    if (err) return callback(err);

    var args = [fPath]
    if (mod) args.concat(['-m', mod.toString(8)]);

    var child = platformNodebinSpawn(binPath, args, {stdio: 'pipe'});

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
  });
}

var unlink = function (fPath, callback) {
  pathToBin('rimraf', function (err, binPath) {
    if (err) return callback(err);

    var child = platformNodebinSpawn(binPath, [fPath], {stdio: 'pipe'});

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
  })
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
  pathToBin('lsj', function (err, binPath) {
    if (err) return callback(err);

    var dir = path.dirname(fPath);
    var child = platformNodebinSpawn('lsj', [dir], {stdio: 'pipe'});

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

    child.on('close', function (code) {
      if (err) return callback && callback(false);
      if (code!==0) return callback && callback(stderr);
      data = JSON.parse(data);
      callback && callback(
        data.indexOf(path.basename(fPath))>-1
      )
    });
  });
}

var touch = function (fPath, options, callback) {
  if (!callback && typeof(options)==='function') {
    callback = options
    options = {}
  }
  pathToBin('touch', function (err, binPath) {
    if (err) return callback(err);

    var args = [];
    if (options.f || options.force) args.push('--force')
    if (options.t || options.time) args.concat(['--time', options.t || options.time])
    if (options.a===true || options.atime===true) args.concat(['--atime'])
    else if (options.a || options.atime) args.concat(['--atime', options.a || options.atime])
    if (options.m===true || options.mtime===true) args.concat(['--mtime'])
    else if (options.m || options.mtime) args.concat(['--mtime', options.m || options.mtime])
    if (options.r || options.ref) args.concat(['--ref', options.r || options.ref])
    if (options.c || options.nocreate) args.concat(['-c'])

    args.push(fPath)

    var child = platformNodebinSpawn(binPath, args, {stdio: 'pipe'});

    var stdout = '';
    child.stdout.on('data', function (d) {
      stdout += d.toString()
    });

    var stderr = '';
    child.stderr.on('data', function (d) {
      stderr += d.toString()
    });

    var err;
    child.on('error', function (e) {
      err = e
    });

    child.on('close', function (code) {
      if (err) return callback && callback(err);
      if (code!==0) return callback && callback(stderr+stdout);
      callback && callback(null)
    });
  });
}

var fs = {
  createReadStream:   createReadStream,
  createWriteStream:  createWriteStream,

  readFile:   readFile,
  writeFile:  writeFile,

  touch:  touch,
  unlink: unlink,
  rmdir:  unlink,
  mkdir:  mkdir,
  chown:  chown,
  chmod:  chmod,
  exists: exists,
}

module.exports = fs;
