require('should');

var fs      = require('fs')
var miss    = require('mississippi');
var sudoFs  = require('../index.js')

var mode = process.env['mode'] || 'auto';

if (mode==='node') {
  sudoFs = require('fs');
  console.error("Using node api");
  sudoFs.touch = function (fPath, options, callback) {
    if (!callback && typeof(options)==='function') {
      callback = options
      options = {}
    }
    options = options || {};
    options.flag = 'a';
    sudoFs.writeFile(fPath, '', options, callback);
  }
} else if (mode==='windows') {
  sudoFs = require('../lib/windows.js');
  console.error("Using windows api");
} else if (mode==='linux') {
  sudoFs = require('../lib/linux.js');
  console.error("Using linux api");
}

describe('sudo-fs', function () {
  it('should read file with a stream', function (done) {
    var content = '';
    sudoFs.createReadStream(__dirname + '/fixtures/read')
    .pipe(miss.through(function (data, enc, cb) {
      content += data.toString();
      cb(null, data)
    }, function () {
      content.should.eql("content\nto\nread\n");
      done();
    }))
  })
  it('should properly emits events when stream reading a file', function (done) {
    var events = '';
    sudoFs.createReadStream(__dirname + '/fixtures/read')
    .on('close', function () {
      events += 'close'
    })
    .on('open', function () {
      events += 'open'
    })
    .on('error', function () {
      events += 'error'
    })
    .on('end', function () {
      events += 'end'
    }).resume()
    setTimeout(function(){
      events.should.eql('openendclose');
      done();
    }, 500)
  })
  it('should properly fail to read stream a file', function (done) {
    var events = '';
    sudoFs.createReadStream(__dirname + '/fixtures/nop')
    .on('open', function () {
      events += 'open'
    })
    .on('error', function () {
      events += 'error'
    })
    .on('close', function () {
      events += 'close'
    })
    .on('end', function () {
      events += 'end'
    })
    setTimeout(function(){
      events.should.eql('error');
      done();
    }, 500)
  })
  it('should read a file', function (done) {
    sudoFs.readFile(__dirname + '/fixtures/read', function (err, content) {
      err && console.error(err);
      (!!err).should.eql(false);
      content.toString().should.eql("content\nto\nread\n");
      done();
    })
  })
  it('should write file with a stream', function (done) {
    var stream = sudoFs.createWriteStream(__dirname + '/var/write');
    stream.on('close', function () {
      var content = '';
      sudoFs.createReadStream(__dirname + '/var/write')
      .pipe(miss.through(function (data, enc, cb) {
        content += data.toString();
        cb(null, data)
      }, function () {
        content.should.eql("content\nto\nwrite\n");
        done();
      }))
    });
    stream.end("content\nto\nwrite\n")
  })
  it('should properly emits events when stream writing a file', function (done) {
    var events = '';
    sudoFs.createWriteStream(__dirname + '/fixtures/write2')
    .on('close', function () {
      events += 'close'
    })
    .on('open', function () {
      events += 'open'
    })
    .on('error', function () {
      events += 'error'
    // voluntarly ignore end event...
    // })
    // .on('end', function () {
    //   events += 'end'
    }).end('some')
    setTimeout(function(){
      events.should.eql('openclose');
      done();
    }, 500)
  })
  it('should properly fail to write stream a file', function (done) {
    var events = '';
    sudoFs.createWriteStream('nop:///dev/null')
    .on('open', function () {
      events += 'open'
    })
    .on('error', function () {
      events += 'error'
    })
    .on('close', function () {
      events += 'close'
    })
    .on('end', function () {
      events += 'end'
    })
    setTimeout(function(){
      events.should.eql('error');
      done();
    }, 500)
  })
  it('should write a file', function (done) {
    sudoFs.writeFile(__dirname + '/var/write', "content\nto\nwrite\n", function (err, content) {
      err && console.error(err);
      (!!err).should.eql(false);
      sudoFs.readFile(__dirname + '/var/write', function (err, content) {
        err && console.error(err);
        (!!err).should.eql(false);
        content.toString().should.eql("content\nto\nwrite\n");
        done();
      })
    })
  })

  it('should unlink a file', function (done) {
    sudoFs.unlink(__dirname + '/var/write', function (err) {
      err && console.error(err);
      (!!err).should.eql(false);
      fs.exists(__dirname + '/var/write', function (err) {
        (!!err).should.eql(false);
        done();
      })
    })
  })
  it('should touch a file', function (done) {
    sudoFs.touch(__dirname + '/var/touch', function (err) {
      err && console.error(err);
      (!!err).should.eql(false);
      fs.exists(__dirname + '/var/touch', function (err) {
        (!!err).should.eql(true);
        fs.unlinkSync(__dirname + '/var/touch');
        done();
      })
    })
  })
  it('should create a dir', function (done) {
    sudoFs.mkdir(__dirname + '/var/dir', function (err) {
      err && console.error(err);
      (!!err).should.eql(false);
      fs.exists(__dirname + '/var/dir', function (exists) {
        (!!exists).should.eql(true);
        done();
      })
    })
  })
  it('should unlink a dir', function (done) {
    sudoFs.rmdir(__dirname + '/var/dir', function (err) {
      err && console.error(err);
      (!!err).should.eql(false);
      fs.exists(__dirname + '/var/dir', function (exists) {
        (!!exists).should.eql(false);
        done();
      })
    })
  })
})
