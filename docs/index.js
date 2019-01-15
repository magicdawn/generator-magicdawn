const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const {basename} = require('path')
const moment = require('moment')
const Generator = require('yeoman-generator')
const debug = require('debug')('yo:magicdawn:docs')
const fg = require('fast-glob')

module.exports = class DocsGenerator extends Generator {
  constructor(args, opts) {
    debug('constructor arguments %j', arguments)
    super(args, opts)
  }

  /**
   * we starts here
   */

  async default() {
    this._addDocs()
  }

  _addDocs() {
    this.sourceRoot(__dirname + '/docs')

    const destDirName = path.basename(this.destinationRoot())
    let pkg = {}
    if (fs.existsSync(this.destinationPath('package.json'))) {
      pkg = this.fs.readJSON(this.destinationPath('package.json'))
    }
    const data = {
      name: pkg.name || destDirName,
      description: pkg.description || 'An awesome project',
    }

    // website
    const files = fg.sync(
      [
        'website/**/*.*',
        '!**/node_modules',
        'md/*.md',
        '!md/changelog.md',
        '.gitignore',
      ],
      {
        cwd: this.sourceRoot(),
      }
    )

    // 要使用 copyTpl
    const useTplFiles = ['md/index.md', 'website/siteConfig.js']

    for (let f of files) {
      if (useTplFiles.includes(f)) {
        this.fs.copyTpl(
          this.templatePath(f),
          this.destinationPath('docs/' + f),
          data
        )
      } else {
        this.fs.copy(this.templatePath(f), this.destinationPath('docs/' + f))
      }
    }
  }
}
