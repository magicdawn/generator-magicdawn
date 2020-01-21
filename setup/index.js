const fs = require('fs')
const _ = require('lodash')
const {basename} = require('path')
const moment = require('moment')
const Generator = require('yeoman-generator')
const debug = require('debug')('yo:magicdawn:add-config')
const DotFilesGenerator = require('../dot-files/index.js')
const AppGenerator = require('../app/index')
const PKG_TPL = require('../app/templates/package.json')
const swig = require('swig-templates')

module.exports = class extends Generator {
  constructor(args, opts) {
    debug('constructor arguments %j', arguments)
    super(args, opts)

    // templates root
    this.sourceRoot(__dirname + '/../app/templates')

    this.actions = [
      {
        name: '格式化 (pkg husky/lint-staged/prettier) (prettier.config.js)',
        value: 'prettier',
      },
      {
        name: 'eslint (pkg eslint/@magicdawn/eslint-config) (.eslintrc.yml)',
        value: 'eslint',
      },
      {
        name: '测试 (pkg mocha/nyc/codecov) (.mocharc.yml .travis.yml)',
        value: 'mocha',
      },
      {
        name: 'README (readme/layout.md readme/api.md readme/)',
        value: 'readme',
      },
    ]

    // select action use --flag
    for (let item of this.actions) {
      const {value} = item
      this.option(value)
    }

    // dotfiles
    this.dotFilesGenwrator = new DotFilesGenerator(args, opts)

    // app
    this.appGenerator = new AppGenerator(args, opts)
  }

  /**
   * we starts here
   */

  async default() {
    // check flag
    if (this.actions.some(({value}) => this.options[value])) {
      const actions = this.actions.map(i => i.value).filter(value => this.options[value])
      return this._run(actions)
    }

    // prompt
    {
      const {actions} = await this._promptAction()
      return this._run(actions)
    }
  }

  async _run(actions) {
    if (actions.includes('prettier')) {
      this._addPrettier()
    }

    if (actions.includes('eslint')) {
      this._addEslint()
    }

    if (actions.includes('mocha')) {
      this._addMocha()
    }

    if (actions.includes('readme')) {
      this._addReadme()
    }
  }

  async _promptAction() {
    const answers = await this.prompt([
      {
        type: 'checkbox',
        name: 'actions',
        message: 'Setup Actions',
        choices: [...this.actions],
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
        '@magicdawn/prettier-config': 'latest',
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

  _addEslint() {
    // deps
    this.fs.extendJSON(this.destinationPath('package.json'), {
      devDependencies: {
        '@magicdawn/eslint-config': 'latest',
        'eslint': '^6.8.0',
      },
    })

    // config files
    this.dotFilesGenwrator._copyFiles(['.eslintrc.yml'])
  }

  _addMocha() {
    // deps
    this.fs.extendJSON(this.destinationPath('package.json'), {
      devDependencies: _.pick(PKG_TPL.devDependencies, ['codecov', 'mocha', 'nyc', 'should']),
      scripts: _.pick(PKG_TPL.scripts, ['test', 'test-cover', 'report-cover']),
    })

    // config file
    // mocha config
    // travis config
    this.dotFilesGenwrator._copyFiles(['.mocharc.yml', '.travis.yml'])
  }

  _addReadme() {
    const files = ['readme/readme.md', 'readme/layout.md', 'readme/api.md']
    const viewbag = this.appGenerator._utilGetViewBag()

    // should generate file
    const shouldGenerate = file => {
      if (!fs.existsSync(file)) return true

      const content = fs.readFileSync(file, 'utf8')
      if (/<!-- AUTO_GENERATED_UNTOUCHED_FLAG -->/.exec(content)) {
        return true
      }

      return false
    }

    for (let f of files) {
      const from = this.templatePath(f)
      const to = this.destinationPath(f)

      if (shouldGenerate(from)) {
        const content = swig.renderFile(from, viewbag)
        this.fs.write(to, content)
      } else {
        console.log('[setup-readme]: skip %s because modified', f)
      }
    }

    // config
    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts: {
        'gen-readme': 'swig render ./readme/readme.md > README.md && prettier --write README.md',
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
