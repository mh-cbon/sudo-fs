var sudoFs = require('./index.js');

// sudoFs.createReadStream('./index.js')
// .on('open', function () {
//   console.log('open')
// })
// .on('error', function (err) {
//   console.log(err)
// })
// .on('end', function () {
//   console.log('end')
// })
// .pipe(process.stdout);


sudoFs.createWriteStream('./test')
.on('open', function () {
  console.log('open')
})
.on('error', function (err) {
  console.log(err);
})
.on('end', function () {
  console.log('end')
})
.end('some data');
