import fs from 'fs'
import {basename} from 'path'
import _ from 'lodash'
import moment from 'moment'
import Generator from 'yeoman-generator'
import debugFactory from 'debug'
import gitconfig from 'git-config'
import pify from 'promise.ify'
import swig from 'swig-templates'

const pkg = require('../../package.json')
type Pkg = typeof pkg

const debug = debugFactory('yo:magicdawn:app')
swig.renderFileAsync = pify(swig.renderFile, swig)

interface Options {}

export default class AppGenerator extends Generator {
  constructor(args: string | string[], opts: Options) {
    super(args, opts)
    debug('constructor arguments %j', arguments)
    this.sourceRoot(__dirname + '../../templates/app/')
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

  private _checkPackageJson() {
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

  private _modifyPackageJson() {
    const pkg = this.fs.readJSON(this.templatePath('package.json'))
    const pkgPartial = _.pick(pkg, 'dependencies', 'devDependencies', 'scripts')
    this.fs.extendJSON(this.destinationPath('package.json'), pkgPartial)
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
    const pkg = this.fs.readJSON(this.destinationPath('package.json')) as Pkg

    // 获取 repoName
    const config = gitconfig.sync(process.cwd() + '/.git/config')
    const giturl = config['remote "origin"'] && config['remote "origin"'].url
    let repoName = giturl && basename(giturl, '.git')
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
