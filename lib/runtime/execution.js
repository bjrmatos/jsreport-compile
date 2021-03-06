'use strict'

let fs = require('fs-extra')
const path = require('path')
const tmpdir = require('os').tmpdir()
const Promise = require('bluebird')
fs = Promise.promisifyAll(fs)

/**
 * Class used to resolve resources and modules inside bundle
 * The instance is accessible on jsreport.execution
 */
class Execution {
  constructor (resources, includes, version, shortid) {
    this.resources = resources
    this.includes = includes

     // path where are stored resources like phantomjs.exe
    this.tmpPath = path.join(tmpdir, `jsreport-${version}-${shortid}`)

    if (!fs.existsSync(this.tmpPath)) {
      fs.mkdirSync(this.tmpPath)
    }
  }

  /**  */
  resource (name) {
    if (!this.resources[name]) {
      return null
    }

    return this._nexeres[this.resources[name].path]
  }

  /** get path into resource located in temp */
  resourceTempPath (name) {
    return path.join(this.tmpPath, name)
  }

  /** resolve path to additionaly included module in the bundle */
  resolve (name) {
    return this.includes[name]
  }

  /** Nexeres require is slow because it involves reading all resources, we do it lazily here */
  get _nexeres () {
    return require('nexeres')
  }

  /** Nexeres require is slow because it involves reading all resources, we do it lazily here */
  get tempDirectory () {
    return this.tmpPath
  }

  /** Persist resources flaged with temp into the temp folder   */
  createTempResources () {
    return Promise.all(Object.keys(this.resources).filter((r) => this.resources[r].temp).map((r) => {
      const resource = this.resources[r]

      const filePath = resource.directory ? path.join(this.tmpPath, resource.directory, resource.pathInDirectory) : path.join(this.tmpPath, r)
      return fs.statAsync(filePath).catch(() => {
        return fs.ensureDirAsync(path.dirname(filePath))
          .then(() => fs.writeFileAsync(filePath, this._nexeres[this.resources[r].path]))
          .then(() => {
            delete this._nexeres[this.resources[r].path]
            return fs.chmodAsync(filePath, 0o777)  // eslint-disable-line
          })
      })
    }))
  }

  ensureWinRunExeResource () {
    return fs.statAsync(path.join(this.tmpPath, 'WinRun.exe')).catch(() => this.createTempResources())
  }
}

module.exports = Execution
