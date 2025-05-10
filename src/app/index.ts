/* eslint-disable @typescript-eslint/ban-types */

import makeDebug from 'debug'
import fs from 'fs'
import gitconfig from 'git-config'
import _ from 'lodash'
import moment from 'moment'
import path from 'path'
import swig from 'swig-templates'
import type { PackageJson } from 'type-fest'
import Generator from 'yeoman-generator'

const debug = makeDebug('yo:magicdawn:app')

class AppGeneratorLogic extends Generator {
  constructor(args: string | string[], opts: {}) {
    super(args, opts)

    // set skip install
    this.options.skipInstall = true

    // eslint-disable-next-line prefer-rest-params
    debug('constructor arguments %j', arguments)
    this.sourceRoot(path.join(import.meta.dirname, '../../templates/app/'))
  }

  default() {
    const ok = this.checkPackageJson()
    if (!ok) return

    // 生成package.json
    //    deps
    //    scripts test / test-cover
    this.modifyPackageJson()

    // 复制文件
    this.copyFiles()
  }

  /**
   * 检查 `package.json` 文件
   */

  checkPackageJson() {
    const destPackageJsonPath = this.destinationPath('package.json')
    const exists = fs.existsSync(destPackageJsonPath)

    // warn
    if (!exists) {
      console.error('\n[error]: package.json not found, run `npm init` first')
      return false
    }

    // ok
    return true
  }

  /**
   * 修改 package.json
   *
   * 	- deps
   * 	- scripts.{ test, test-cover }
   */

  modifyPackageJson() {
    const pkg = this.fs.readJSON(this.templatePath('package.json')) as PackageJson
    const pkgPartial = _.omit(pkg, ['name', 'version', 'private'])
    this.fs.extendJSON(this.destinationPath('package.json'), pkgPartial)
  }

  /**
   * 复制文件
   */

  copyFiles() {
    const locals = this.getTemplateLocals()

    const files: (string | { name: string; locals?: object })[] = [
      // eslint
      '.eslintrc.yml',
      '.eslintignore',

      // edit
      '.editorconfig',

      // prettier
      '.prettierignore',
      'prettier.config.js',
      '.husky',

      // test
      'test/.gitkeep',

      // ci
      '.github',

      // package related
      { name: 'LICENSE' },
      { name: 'CHANGELOG.md' },
      { name: 'README.md' },

      // ts
      'src',
      'tsconfig.json',
    ]

    for (const f of files) {
      // write as same
      if (typeof f === 'string') {
        const from = this.templatePath(f)
        const to = this.destinationPath(f)
        this.fs.copy(from, to)
      }

      // render & write
      else {
        const { name, locals: currentLocals } = f
        const from = this.templatePath(name)
        const to = this.destinationPath(name)
        const content = swig.renderFile(from, currentLocals ?? locals)
        this.fs.write(to, content)
      }
    }

    // .gitignore 特殊
    // https://github.com/npm/npm/issues/3763
    this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'))
  }

  getTemplateLocals() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json')) as PackageJson

    // 获取 repoName
    const getRepoName = () => {
      let repoName: string

      const giturl = gitconfig.sync(process.cwd() + '/.git/config')?.['remote "origin"']?.url
      repoName = giturl && path.basename(giturl, '.git')
      if (repoName) {
        debug('repoName from git url: %s', repoName)
        return repoName
      }

      // pkg.name as fallback
      repoName = pkg.name!
      debug('repoName from pkg.name: %s', repoName)
      return repoName
    }

    const currentYear = moment().format('YYYY')
    const currentDate = moment().format('YYYY-MM-DD')
    const packageName = pkg.name
    const packageLocalName = _.camelCase(pkg.name) // 变量名
    const packageDescription = <string>pkg.description || '' // 描述

    return {
      currentYear,
      currentDate,
      packageName,
      repoName: getRepoName(),
      packageLocalName,
      packageDescription,
    }
  }
}

export default class AppGenerator extends AppGeneratorLogic {
  default() {
    return super.default()
  }
}
