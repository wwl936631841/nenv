const mv = require('mv')
const { join } = require('path')
const getConfig = require('../config')

module.exports = async function replaceCurrentBuild (dir, buildDir) {
  const dist = getConfig(dir).distDir
  const _dir = join(dir, dist)
  const _buildDir = join(buildDir, '.nenv')
  const oldDir = join(buildDir, '.nenv.old')

  try {
    await move(_dir, oldDir)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  await move(_buildDir, _dir)
  return oldDir
}

function move (from, to) {
  return new Promise((resolve, reject) => {
    mv(from, to, err => err ? reject(err) : resolve())
  })
}
