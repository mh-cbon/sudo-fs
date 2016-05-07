var path    = require('path');
var miss    = require('mississippi');
var yasudo  = require('@mh-cbon/c-yasudo');

var createReadStream = function (path) {
  var sPath = path.toString();
  var child = yasudo(process.argv[0], ['node_modules/.bin/catf', sPath], {stdio: ['ignore', 'pipe']});

  var stream = miss.through();
  stream.path = path;

  child.on('error', function (err) {
    stream.emit('error', err);
  });

  child.once('success', function () {
    stream.emit('open')
  })

  child.stdout.pipe(stream);

  return stream;
}

var createWriteStream = function (path, options) {
  var sPath = path.toString();

  var stream = miss.through();
  stream.path = path;

  var child = yasudo(process.argv[0], ['node_modules/.bin/fwrite', sPath], {stdio: 'pipe'});

  stream.bytesWritten = 0;
  child.stdin.on('data', function (d) {
    stream.bytesWritten += d.length;
  });

  child.on('error', function (err) {
    stream.emit('error', err);
  });

  child.once('success', function () {
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
  .on('end', function () {
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

  var child = yasudo(process.argv[0], args);

  var err;
  child.on('error', function (e) {
    err = e
  });

  child.on('close', function () {
    callback && callback(err);
  });
}

var unlink = function (fPath, callback) {

  var child = yasudo('rm', ['-fr', fPath]);

  var err;
  child.on('error', function (e) {
    err = e
  });

  child.on('close', function () {
    callback && callback(err);
  });
}

var chmod = function (fPath, mod, callback) {

  var child = yasudo('chmod', [mod.toString(8), fPath]);

  var err;
  child.on('error', function (e) {
    err = e
  });

  child.on('close', function () {
    callback && callback(err);
  });
}

var chown = function (fPath, uid, gid, callback) {

  var child = yasudo('chown', [uid+':'+gid, fPath]);

  var err;
  child.on('error', function (e) {
    err = e
  });

  child.on('close', function () {
    callback && callback(err);
  });
}

var exists = function (fPath, callback) {

  var dir = path.dirname(fPath);
  var child = yasudo(process.argv[0], ['node_modules/.bin/lsj', dir]);

  var data;
  child.stdout.on('data', function (d) {
    data += d.toString()
  });

  var err;
  child.on('error', function (e) {
    err = e
  });

  child.on('close', function () {
    if (err) return callback && callback(false);
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
