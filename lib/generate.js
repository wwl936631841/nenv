const { join } = require('path')
const Metalsmith = require('metalsmith')
module.exports = function generate (name, src, dest, done) {
  const metalsmith = Metalsmith(src)
  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(),
    noEscape: true
  })
  console.log(`${name};${src};${dest} done`)

  metalsmith.clean(false)
    .source('.')
    .destination(dest)
    .build((err, files) => {
      done(err)
    })
}
