var path        = require('path');
var miss        = require('mississippi');
var yasudo      = require('@mh-cbon/c-yasudo');
var pathToBin   = require('./path-to-bin.js');

var createReadStream = function (fPath) {
  var stream = miss.through();
  pathToBin('catf', function (err, binPath) {
    if (err) return stream.emit('error', err);

    fPath = fPath.toString();

    var child = yasudo(process.argv[0], [binPath, fPath], {stdio: ['ignore', 'pipe', 'pipe']});

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
        stream.emit('error', stderr || new Error('return code='+code))
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

    stream.path = fPath;

    var child = yasudo(process.argv[0], [binPath, fPath], {stdio: 'pipe'});

    stream.bytesWritten = 0;
    stream.on('data', function (d) {
      stream.bytesWritten += d.length;
    })

    child.on('error', function (err) {
      stream.emit('error', err);
    });

    var stderr = '';
    child.stderr.on('data', function (d) {
      stderr += d.toString();
    });

    stream.pipe(child.stdin)
    child.once('close', function (code) {
      if (code!==0) {
        stream.emit('error', stderr || new Error('return code='+code))
      } else {
        stream.emit('open')
        stream.emit('close');
      }
    })
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
  .on('end', function () {
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

    var args = [binPath, fPath]
    if (mod) args.concat(['-m', mod.toString(8)]);

    var child = yasudo(process.argv[0], args, {stdio: 'pipe'});

    var err;
    child.on('error', function (e) {
      err = e
    });

    var stdout = '';
    child.stdout.on('data', function (d) {
      stdout += d.toString()
    });

    var stderr = '';
    child.stderr.on('data', function (d) {
      stderr += d.toString()
    });

    child.on('close', function (code) {
      if (code!==0) return callback && callback(stderr+stdout);
      callback && callback(err);
    });
  });
}

var unlink = function (fPath, callback) {

  var child = yasudo('rm', ['-fr', fPath], {stdio: 'pipe'});

  var err;
  child.on('error', function (e) {
    err = e
  });

  var stdout = '';
  child.stdout.on('data', function (d) {
    stdout += d.toString()
  });

  var stderr = '';
  child.stderr.on('data', function (d) {
    stderr += d.toString()
  });

  child.on('close', function (code) {
    if (code!==0) return callback && callback(stderr+stdout);
    callback && callback(err);
  });
}

var chmod = function (fPath, mod, callback) {

  var child = yasudo('chmod', [mod.toString(8), fPath], {stdio: 'pipe'});

  var err;
  child.on('error', function (e) {
    err = e
  });

  var stdout = '';
  child.stdout.on('data', function (d) {
    stdout += d.toString()
  });

  var stderr = '';
  child.stderr.on('data', function (d) {
    stderr += d.toString()
  });

  child.on('close', function (code) {
    if (code!==0) return callback && callback(stderr+stdout);
    callback && callback(err);
  });
}

var chown = function (fPath, uid, gid, callback) {

  var child = yasudo('chown', [uid+':'+gid, fPath], {stdio: 'pipe'});

  var err;
  child.on('error', function (e) {
    err = e
  });

  var stdout = '';
  child.stdout.on('data', function (d) {
    stdout += d.toString()
  });

  var stderr = '';
  child.stderr.on('data', function (d) {
    stderr += d.toString()
  });

  child.on('close', function (code) {
    if (code!==0) return callback && callback(stderr+stdout);
    callback && callback(err);
  });
}

var exists = function (fPath, callback) {
  pathToBin('lsj', function (err, binPath) {
    if (err) return callback(err);

    var dir = path.dirname(fPath);
    var child = yasudo(process.argv[0], [binPath, dir], {stdio: 'pipe'});

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
      if (err) return callback && callback(err);
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

    var args = [binPath];
    if (options.f || options.force) args.push('--force')
    if (options.t || options.time) args.concat(['--time', options.t || options.time])
    if (options.a===true || options.atime===true) args.concat(['--atime'])
    else if (options.a || options.atime) args.concat(['--atime', options.a || options.atime])
    if (options.m===true || options.mtime===true) args.concat(['--mtime'])
    else if (options.m || options.mtime) args.concat(['--mtime', options.m || options.mtime])
    if (options.r || options.ref) args.concat(['--ref', options.r || options.ref])
    if (options.c || options.nocreate) args.concat(['-c'])

    args.push(fPath)

    var child = yasudo(process.argv[0], args, {stdio: 'pipe'});

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
