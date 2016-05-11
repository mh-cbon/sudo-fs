# sudo-fs

Like fs module to use with sudo / elevate.

Works on linux, mac, windows.

Very partial port.

# install

```
npm i @mh-cbon/sudo-fs --save
```

# usage

```js
var fs = require('@mh-cbon/sudo-fs');

fs.createReadStream('some.file').pipe(process.stdout);
fs.createWriteStream('some.file').end('some data');
fs.writeFile('some.file', 'content', {}, function (err, data) {});
fs.readFile('some.file', {}, function (err, data) {});
fs.exists('some.file', function (maybe) {});
fs.chown('some.file', 'me', 'notyou', function (err) {});
fs.chmod('some.file', 0777, function (err) {});
fs.unlink('some.file', function (err) {});
fs.mkdir('some/dir', function (err) {});

```

# todo

- improve compatibility with node fs module.

# Tests

To run the tests you should use those commands,

To check with node API:
```
mode=node mocha
```

To check with linux yasudo API:
```
mode=linux yasudo=<your pwd> mocha
```

To check with windows wtf API:
```
mode=windows mocha
```
