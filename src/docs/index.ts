import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import Generator from 'yeoman-generator'
import fg from 'fast-glob'
import debugFactory from 'debug'
import pkg from '../../package.json'

const debug = debugFactory('yo:magicdawn:docs')
type Pkg = typeof pkg

export default class DocsGenerator extends Generator {
  constructor(args: string[], opts: {}) {
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
    let pkg: Pkg
    if (fs.existsSync(this.destinationPath('package.json'))) {
      pkg = this.fs.readJSON(this.destinationPath('package.json')) as Pkg
    }
    const data = {
      name: pkg.name || destDirName,
      description: pkg.description || 'An awesome project',
    }

    // website
    const files = fg.sync(
      [
        '!**/node_modules',

        // website
        'website/**/*.*',
        '!website/translated_docs',
        '!website/build/',
        '!website/yarn.lock',
        '!website/node_modules',
        '!website/i18n/',

        // md
        'md/*.md',
        '!md/changelog.md',

        // .git
        '.gitignore',
        '!gitignore',
      ],
      {
        cwd: this.sourceRoot(),
      }
    )

    // 要使用 copyTpl
    const useTplFiles = ['md/index.md', 'website/siteConfig.js']

    for (let f of files) {
      if (useTplFiles.includes(f)) {
        this.fs.copyTpl(this.templatePath(f), this.destinationPath('docs/' + f), data)
      } else {
        this.fs.copy(this.templatePath(f), this.destinationPath('docs/' + f))
      }
    }

    // npm 发布会去除 .gitignore
    if (!fs.existsSync(this.templatePath('.gitignore'))) {
      this.fs.copy(this.templatePath('gitignore'), this.destinationPath('docs/.gitignore'))
    }
  }
}
