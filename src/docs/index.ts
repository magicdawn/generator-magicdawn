/* eslint-disable prefer-rest-params */

import fs from 'node:fs'
import path from 'node:path'
import debugFactory from 'debug'
import fg from 'fast-glob'
import Generator from 'yeoman-generator'
import type { PackageJson } from 'type-fest'

const debug = debugFactory('yo:magicdawn:docs')

export default class DocsGenerator extends Generator {
  constructor(args: string[], opts: {}) {
    debug('constructor arguments %j', arguments)
    super(args, opts)
  }

  /**
   * we starts here
   */
  default() {
    this._addDocs()
  }

  _addDocs() {
    this.sourceRoot(import.meta.dirname + '/docs')

    const destDirName = path.basename(this.destinationRoot())
    let pkg: PackageJson | undefined
    if (fs.existsSync(this.destinationPath('package.json'))) {
      pkg = this.fs.readJSON(this.destinationPath('package.json')) as PackageJson
    }
    const data = {
      name: pkg?.name || destDirName,
      description: pkg?.description || 'An awesome project',
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
      },
    )

    // 要使用 copyTpl
    const useTplFiles = ['md/index.md', 'website/siteConfig.js']

    for (const f of files) {
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
