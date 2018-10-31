const { tmpdir } = require('os')
const { join } = require('path')
const fs = require('mz/fs')
const uuid = require('uuid')
const del = require('del')
const webpack = require('./webpack')
const replaceCurrentBuild = require('./replace')
const md5File = require('md5-file/promise')

module.exports = async function build (dir, conf = null) {
  const buildId = uuid.v4()
  const tempDir = tmpdir()
  const buildDir = join(tempDir, uuid.v4())

  try {
    await fs.access(tempDir, fs.constants.W_OK)
  } catch (err) {
    console.error(`> Failed, build directory is not writeable`)
    throw err
  }

  const compiler = await webpack(dir, { buildDir, conf })
  try {
    const stats = await runCompiler(compiler)
    await writeBuildStats(buildDir, stats)
    await writeBuildId(buildDir, buildId)
  } catch (err) {
    console.log(`> Failed to build on ${buildDir}`)
    throw err
  }

  await replaceCurrentBuild(dir, buildDir)

  del(buildDir, { force: true })
}

function runCompiler (compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err)

      const jsonStats = stats.toJson()

      if (jsonStats.errors.length > 0) {
        const error = new Error(jsonStats.errors[0])
        error.errors = jsonStats.errors
        error.warnings = jsonStats.warnings
        return reject(error)
      }

      resolve(jsonStats)
    })
  })
}

async function writeBuildStats (dir, stats) {
  const assetHashMap = {
    'app.js': {
      hash: await md5File(join(dir, '.nenv', 'app.js'))
    }
  }
  const buildStatsPath = join(dir, '.nenv', 'build-stats.json')
  await fs.writeFile(buildStatsPath, JSON.stringify(assetHashMap))
}

async function writeBuildId (dir, buildId) {
  const buildIdPath = join(dir, '.nenv', 'BUILD_ID')
  await fs.writeFile(buildIdPath, buildId, 'utf8')
}
