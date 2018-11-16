const fs = require('fs')
const _ = require('lodash')
const {basename} = require('path')
const moment = require('moment')
const Generator = require('yeoman-generator')
const debug = require('debug')('yo:magicdawn:add-config')

module.exports = class AddConfigGenerator extends Generator {
  constructor(args, opts) {
    debug('constructor arguments %j', arguments)
    super(args, opts)
  }

  /**
   * we starts here
   */

  async default() {
    const {action} = await this._promptAction()
    if (action === 'add-prettier') {
      return this._addPrettier()
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
        ],
      },
    ])

    return answers
  }

  _addPrettier() {
    // const ok = this._checkPackageJson()
    // if (!ok) return

    this.fs.extendJSON(this.destinationPath('package.json'), {
      devDependencies: {
        husky: 'latest',
        prettier: 'latest',
        'lint-staged': 'latest',
      },
      husky: {
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
