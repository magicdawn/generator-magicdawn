import fse from 'fs-extra'
import _ from 'lodash'
import Generator from 'yeoman-generator'
import debugFactory from 'debug'
import swig from 'swig-templates'
import JSON5 from 'json5'
import {TsConfigJson} from 'type-fest'
import DotFilesGenerator from '../dot-files/index.js'
import AppGenerator from '../app/index'

// @ts-ignore
const PKG_TPL = require('../../templates/app/package.json')
const debug = debugFactory('yo:magicdawn:add-config')

export default class extends Generator {
  dotFilesGenerator: DotFilesGenerator
  appGenerator: AppGenerator

  actions = [
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
    {
      name: 'TypeScript (tsconfig.json / package.json ...)',
      value: 'ts',
    },
  ]

  constructor(args: string[], opts: {}) {
    super(args, opts)
    debug('constructor arguments %j', arguments)

    // templates root
    this.sourceRoot(__dirname + '/../app/templates')

    // select action use --flag
    for (let item of this.actions) {
      const {value} = item
      this.option(value, {
        type: Boolean,
        default: false,
      })
    }

    // dotfiles
    this.dotFilesGenerator = new DotFilesGenerator(args, opts)

    // app
    this.appGenerator = new AppGenerator(args, opts)
  }

  /**
   * we starts here
   */

  async default() {
    // check flag
    if (this.actions.some(({value}) => this.options[value])) {
      const actions = this.actions.map((i) => i.value).filter((value) => this.options[value])
      return this._run(actions)
    }

    // prompt
    {
      const {actions} = await this._promptAction()
      return this._run(actions)
    }
  }

  async _run(actions: string[]) {
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

    if (actions.includes('ts')) {
      this._addTs()
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
        ],
      },
    })

    // config files
    this.dotFilesGenerator._copyFiles(['prettier.config.js'])
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
    this.dotFilesGenerator._copyFiles(['.eslintrc.yml'])
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
    this.dotFilesGenerator._copyFiles(['.mocharc.yml', '.travis.yml'])
  }

  _addReadme() {
    const files = ['readme/readme.md', 'readme/layout.md', 'readme/api.md']
    const viewbag = this.appGenerator._utilGetViewBag()

    // should generate file
    const shouldGenerate = (file: string) => {
      if (!fse.existsSync(file)) return true

      const content = fse.readFileSync(file, 'utf8')
      if (/<!-- AUTO_GENERATED_UNTOUCHED_FLAG -->/.exec(content)) {
        return true
      }

      return false
    }

    for (let f of files) {
      const from = this.templatePath(f)
      const to = this.destinationPath(f)

      if (shouldGenerate(to)) {
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
   * 添加 ts 支持
   */

  _addTs() {
    const tsconfig = this.destinationPath('tsconfig.json')

    // copy when needed
    if (!fse.existsSync(tsconfig)) {
      this.dotFilesGenerator._copyFiles(['tsconfig.json'])
    }

    let outdir = 'lib'
    if (fse.existsSync(tsconfig)) {
      const content = fse.readFileSync(tsconfig, 'utf8')
      const currentConfig = JSON5.parse(content) as TsConfigJson
      outdir = currentConfig.compilerOptions.outDir
      outdir = _.trimEnd(outdir, '/')
    }

    // scripts
    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts: {
        dev: 'tsc -w --incremental',
        build: `rm -rf ${outdir}; rm tsconfig.tsbuildinfo; tsc`,
        prepublishOnly: 'npm run build',
      },
      devDependencies: {
        typescript: '^4',
      },
    })
  }

  /**
   * 检查 `package.json` 文件
   */

  _checkPackageJson() {
    const destPackageJsonPath = this.destinationPath('package.json')
    const exists = fse.existsSync(destPackageJsonPath)

    // warn
    if (!exists) {
      this.log('\npackage.json not found, run `npm init` first')
      return false
    }

    // ok
    return true
  }
}
