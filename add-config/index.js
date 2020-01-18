const fs = require('fs')
const _ = require('lodash')
const {basename} = require('path')
const moment = require('moment')
const Generator = require('yeoman-generator')
const debug = require('debug')('yo:magicdawn:add-config')
const DotFilesGenerator = require('../dot-files/index.js')
const PKG_TPL = require('../app/templates/package.json')

module.exports = class AddConfigGenerator extends Generator {
  constructor(args, opts) {
    debug('constructor arguments %j', arguments)
    super(args, opts)

    this.dotFilesGenwrator = new DotFilesGenerator(args, opts)
  }

  /**
   * we starts here
   */

  async default() {
    const {action} = await this._promptAction()

    if (action === 'add-prettier') {
      return this._addPrettier()
    }

    if (action === 'add-mocha') {
      return this._addMocha()
    }
  }

  async _promptAction() {
    const answers = await this.prompt([
      {
        type: 'list',
        name: 'action',
        message: '想干啥',
        choices: [
          {
            name: '添加 husky/lint-staged/prettier',
            value: 'add-prettier',
          },
          {
            name: '添加测试 mocha/nyc/codecov',
            value: 'add-mocha',
          },
        ],
      },
    ])

    return answers
  }

  _addPrettier() {
    // deps
    this.fs.extendJSON(this.destinationPath('package.json'), {
      'devDependencies': {
        'husky': 'latest',
        'prettier': 'latest',
        'lint-staged': 'latest',
      },
      'husky': {
        hooks: {
          'pre-commit': 'lint-staged',
        },
      },
      'lint-staged': {
        '*.{js,less,vue}': [
          // ignore
          'prettier --write',
          'git add',
        ],
      },
    })

    // config files
    this.dotFilesGenwrator._copyFiles(['prettier.config.js'])
  }

  _addMocha() {
    // deps
    this.fs.extendJSON(this.destinationPath('package.json'), {
      devDependencies: _.pick(PKG_TPL.devDependencies, ['codecov', 'mocha', 'nyc', 'should']),
      scripts: _.pick(PKG_TPL.scripts, ['test', 'test-cover', 'report-cover']),
    })

    // mocha config
    this.dotFilesGenwrator._copyFiles(['.mocharc.yml'])
  }

  /**
   * 检查 `package.json` 文件
   */

  _checkPackageJson() {
    const destPackageJsonPath = this.destinationPath('package.json')
    const exists = fs.existsSync(destPackageJsonPath)

    // warn
    if (!exists) {
      this.log('\npackage.json not found, run `npm init` first')
      return false
    }

    // ok
    return true
  }
}
