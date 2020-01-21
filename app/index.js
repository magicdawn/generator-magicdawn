const fs = require('fs')
const {basename} = require('path')
const _ = require('lodash')
const moment = require('moment')
const Generator = require('yeoman-generator')
const debug = require('debug')('yo:magicdawn:app')
const gitconfig = require('git-config')

const pify = require('promise.ify')
const swig = require('swig-templates')
swig.renderFileAsync = pify(swig.renderFile, swig)

module.exports = class AppGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts)
    debug('constructor arguments %j', arguments)

    this.sourceRoot(__dirname + '/templates')
  }

  /**
   * we starts here
   */

  default() {
    const ok = this._checkPackageJson()
    if (!ok) return

    // 复制文件
    // .eslintrc.yml .jsbeautifyrc .travis.yml .gitignore test/mocha.opts CHANGELOG.md
    this._copyFiles()

    // 生成package.json
    //    deps
    //    scripts test / test-cover
    this._modifyPackageJson()

    // README.md 读 package.json name
    // CHANGELOG.md
    this._copyTpl()
  }

  /**
   * 检查 `package.json` 文件
   */

  _checkPackageJson() {
    const destPackageJsonPath = this.destinationPath('package.json')
    const exists = fs.existsSync(destPackageJsonPath)

    // warn
    if (!exists) {
      console.error('\npackage.json not found, run `npm init` first')
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

  _modifyPackageJson() {
    let pkg = this.fs.readJSON(this.templatePath('package.json'))
    pkg = _.pick(pkg, 'dependencies', 'devDependencies', 'scripts')
    this.fs.extendJSON(this.destinationPath('package.json'), pkg)
  }

  /**
   * 复制文件
   */

  _copyFiles() {
    // 原样复制
    const files = [
      '.eslintrc.yml',
      '.mocharc.yml',
      'prettier.config.js',
      '.travis.yml',
      'LICENSE',
      'test/.gitkeep',
    ]

    for (let f of files) {
      const from = this.templatePath(f)
      const to = this.destinationPath(f)
      this.fs.copy(from, to)
    }

    // .gitignore 特殊
    // https://github.com/npm/npm/issues/3763
    this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'))
  }

  _utilGetViewBag() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'))

    // 获取 repoName
    const config = gitconfig.sync(process.cwd() + '/.git/config')
    const giturl = config['remote "origin"'] && config['remote "origin"'].url
    let repoName = giturl && basename(giturl, '.git')
    debug('repoName = %s', repoName)
    if (!repoName) repoName = pkg.name

    const currentDate = moment().format('YYYY-MM-DD')
    const packageName = pkg.name
    const packageLocalName = _.camelCase(pkg.name) // 变量名
    const packageDescription = pkg.description // 描述

    return {
      currentDate,
      packageName,
      repoName,
      packageLocalName,
      packageDescription,
    }
  }

  _copyTpl() {
    const viewbag = this._utilGetViewBag()

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
