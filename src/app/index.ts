/* eslint-disable @typescript-eslint/ban-types */

import makeDebug from 'debug'
import fs from 'fs'
import gitconfig from 'git-config'
import _ from 'lodash'
import moment from 'moment'
import path from 'path'
import swig from 'swig-templates'
import { PackageJson } from 'type-fest'
import Generator from 'yeoman-generator'

const debug = makeDebug('yo:magicdawn:app')

class AppGeneratorLogic extends Generator {
  constructor(args: string | string[], opts: {}) {
    super(args, opts)
    // eslint-disable-next-line prefer-rest-params
    debug('constructor arguments %j', arguments)
    this.sourceRoot(path.join(__dirname, '../../templates/app/'))
  }

  default() {
    const ok = this.checkPackageJson()
    if (!ok) return

    // 复制文件
    // .eslintrc.yml .jsbeautifyrc .travis.yml .gitignore test/mocha.opts CHANGELOG.md
    this.copyFiles()

    // 生成package.json
    //    deps
    //    scripts test / test-cover
    this.modifyPackageJson()

    // README.md 读 package.json name
    // CHANGELOG.md
    this.copyTpl()
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
    const pkg = this.fs.readJSON(this.templatePath('package.json'))
    const pkgPartial = _.pick(pkg, 'dependencies', 'devDependencies', 'scripts')
    this.fs.extendJSON(this.destinationPath('package.json'), pkgPartial)
  }

  /**
   * 复制文件
   */

  copyFiles() {
    // 原样复制
    const files = [
      '.eslintrc.yml',
      '.mocharc.yml',
      'prettier.config.js',
      '.travis.yml',
      'LICENSE',
      'test/.gitkeep',
    ]

    for (const f of files) {
      const from = this.templatePath(f)
      const to = this.destinationPath(f)
      this.fs.copy(from, to)
    }

    // .gitignore 特殊
    // https://github.com/npm/npm/issues/3763
    this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'))
  }

  utilGetViewBag() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json')) as PackageJson

    // 获取 repoName
    const config = gitconfig.sync(process.cwd() + '/.git/config')
    const giturl = config['remote "origin"'] && config['remote "origin"'].url
    let repoName = giturl && path.basename(giturl, '.git')
    debug('repoName = %s', repoName)
    if (!repoName) repoName = pkg.name

    const currentDate = moment().format('YYYY-MM-DD')
    const packageName = pkg.name
    const packageLocalName = _.camelCase(pkg.name) // 变量名
    const packageDescription = <string>pkg.description // 描述

    return {
      currentDate,
      packageName,
      repoName,
      packageLocalName,
      packageDescription,
    }
  }

  copyTpl() {
    const viewbag = this.utilGetViewBag()

    _.each(
      {
        'CHANGELOG.md': viewbag,
        'README.md': viewbag,
      },
      (v, f) => {
        const from = this.templatePath(f)
        const to = this.destinationPath(f)
        const content = swig.renderFile(from, v)
        this.fs.write(to, content)
      }
    )
  }
}

export default class AppGenerator extends AppGeneratorLogic {
  default() {
    return super.default()
  }
}
