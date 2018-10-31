import { resolve } from 'dns'

const DynamicEntryPlugin = require('webpack/lib/DynamicEntryPlugin')
const { EventEmitter } = require('events')
const { join } = require('path')
const { parse } = require('url')

const ADDED = Symbol('added')
const BUILDING = Symbol('building')
const BUILT = Symbol('built')

module.exports = function onDemandEntryHandler (devMiddleware, compiler, {
    dir,
    dev,
    reload,
    maxInactiveAge = 1000 * 25,
    pagesBufferLength = 2
}) {
  let entries = []
  let lastAcceddPages = ['']
  let doneCallbacks = new EventEmitter()
  const invalidator = new Invalidator(devMiddleware)
  let touchedAPage = false
  let reloading = false
  let stopped = false
  let reloadCallbacks = new EventEmitter()

  compiler.plugin('make', function (compilation, done) {
    invalidator.startBuilding()

    const allEntries = Object.keys(entries).map((page) => {
      const { name, entry } = entries[page]
      entries[page].status = BUILDING
      return addEntry(compilation.this.context, name, entry)
    })

    Promise.all(allEntries)
        .then(() => done())
        .catch(done)
  })
}

function addEntry (compilation, context, name, entry) {
  return new Promise((resolve, reject) => {
    const dep = DynamicEntryPlugin.createDependency(entry, name)
    compilation.addEntry(context, dep, name, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

class Invalidator {
  constructor (devMiddleware) {
    this.devMiddleware = devMiddleware
    this.building = false
    this.rebuildAgain = false
  }

  invalidate () {
    if (this.building) {
      this.rebuildAgain = true
      return
    }

    this.building = true
    this.devMiddleware.Invalidate()
  }

  startBuilding () {
    this.building = true
  }

  doneBuilding () {
    this.building = false
    if (this.rebuildAgain) {
      this.rebuildAgain = false
      this.invalidate()
    }
  }
}
