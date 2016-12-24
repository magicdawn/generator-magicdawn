const fs = require('fs')
const basename = require('path').basename
const Base = require('yeoman-generator').Base
const _ = require('lodash')
const co = require('co')
const moment = require('moment')
const debug = require('debug')('yo:magicdawn:app')
const gitconfig = require('git-config')

/**
 * My Generator
 */

const Generator = module.exports = class Generator extends Base {
  constructor($0, $1, $2) {
    debug('constructor arguments %j', arguments)
    super($0, $1, $2)

    this.sourceRoot(__dirname + '/templates')
  }

  /**
   * we starts here
   */

  default () {
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
      console.error('\npackage.json not found, run \`npm init\` first')
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
    const destPath = this.destinationPath('package.json')
    let dest = this.fs.readJSON(destPath)
    let src = this.fs.readJSON(this.templatePath('package.json'))
    src = _.pick(src, 'dependencies', 'devDependencies', 'scripts')

    // defaults
    dest = _.defaultsDeep(dest, src)

    // write
    this.fs.writeJSON(destPath, dest)
  }

  /**
   * 复制文件
   */

  _copyFiles() {
    // 原样复制
    const files = [
      '.babelrc', '.eslintrc.yml', '.jsbeautifyrc',
      'test/mocha.opts',
      '.travis.yml', 'LICENSE',
    ]

    for (let f of files) {
      const from = this.templatePath(f)
      const to = this.destinationPath(f)
      this.fs.copy(from, to)
    }

    // .gitignore 特殊
    // https://github.com/npm/npm/issues/3763
    this.fs.copy(
      this.templatePath('gitignore'),
      this.destinationPath('.gitignore')
    )
  }

  _copyTpl() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'))

    // 获取 repoName
    const config = gitconfig.sync(process.cwd() + '/.git/config')
    const giturl = config['remote "origin"'] && config['remote "origin"'].url
    let repoName = (giturl && basename(giturl, '.git'))
    debug('repoName = %s', repoName)
    if (!repoName) repoName = pkg.name

    _.each({
      'CHANGELOG.md': {
        currentDate: moment().format('YYYY-MM-DD')
      },
      'README.md': {
        packageName: pkg.name,
        repoName,
        packageLocalName: _.camelCase(pkg.name), // 变量名
        packageDescription: pkg.description // 描述
      }
    }, (v, f) => {
      const from = this.templatePath(f)
      const to = this.destinationPath(f)
      this.fs.copyTpl(from, to, v)
    })
  }
}