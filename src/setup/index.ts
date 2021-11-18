import fse from 'fs-extra'
import _ from 'lodash'
import Generator from 'yeoman-generator'
import debugFactory from 'debug'
import swig from 'swig-templates'
import DotFilesGenerator from '../dot-files/index.js'
import AppGenerator from '../app/index'
import {getLatestVersion} from '../utility'

// @ts-ignore
const PKG_TPL = require('../../templates/app/package.json')
const debug = debugFactory('yo:magicdawn:setup')

import addTs from './stuff/ts'
import addYarn2 from './stuff/yarn2'

export interface ISetupAction {
  label: string
  desc: string
  fn: (this: SetupGenerator) => void | Promise<void>
}

export default class SetupGenerator extends Generator {
  dotFilesGenerator: DotFilesGenerator
  appGenerator: AppGenerator

  // _addElectron = _addElectron
  _addYarn2 = addYarn2.fn
  _addTs = addTs.fn

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

    ...[addTs, addYarn2].map((action) => ({
      name: action.desc,
      value: action.label,
    })),
  ]

  constructor(args: string[], opts: {}) {
    super(args, opts)
    debug('constructor arguments %j', arguments)

    // templates root
    this.sourceRoot(__dirname + '/../../templates/app')

    // select action use --flag
    for (let item of this.actions) {
      const {value} = item
      this.option(value, {
        type: Boolean,
        default: false,
      })
    }

    // --all
    this.option('all', {
      type: Boolean,
      default: false,
    })

    // dotfiles
    this.dotFilesGenerator = new DotFilesGenerator(args, opts)

    // app
    this.appGenerator = new AppGenerator(args, opts)
  }

  /**
   * we starts here
   */

  async default() {
    // --all flag
    if (this.options.all) {
      const actions = this.actions.map((i) => i.value)
      return this._run(actions)
    }

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
    for (let action of actions) {
      const method = `_add${_.upperFirst(action)}`
      if (this[method]) {
        await this[method]()
      }

      // more
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

  async _addPrettier() {
    const versions = await Promise.all([
      // getLatestVersion('husky'),
      getLatestVersion('lint-staged'),
      getLatestVersion('prettier'),
      getLatestVersion('@magicdawn/prettier-config'),
    ])

    const [v2, v3, v4] = versions.map((v) => `^${v}`)

    // deps
    this.fs.extendJSON(this.destinationPath('package.json'), {
      'devDependencies': {
        'husky': '^4',
        'lint-staged': v2,
        'prettier': v3,
        '@magicdawn/prettier-config': v4,
      },
      'husky': {
        hooks: {
          'pre-commit': 'lint-staged',
        },
      },
      'lint-staged': {
        '*.{js,less,jsx,ts,tsx}': ['prettier --write'],
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
      if (!this.fs.exists(file)) return true

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

  /**
   * 添加项目到 .gitignore 中
   */
  _ensureGitIgnore(label: 'ts' | 'yarn2' | string, ...items: Array<string | string[]>) {
    const gitignoreFile = this.destinationPath('.gitignore')
    if (!this.fs.exists(gitignoreFile)) {
      this.dotFilesGenerator._copyFiles(['.gitignore'])
    }

    const currentContent = this.fs.read(gitignoreFile) || ''
    let currentLines = currentContent.split('\n').map((line) => line.trim())

    // ensure a blank line before a block label
    currentLines = currentLines.reduce((ret, line, index, arr) => {
      if (line.startsWith('#')) {
        if (index > 0) {
          const prevLine = arr[index - 1]
          if (prevLine && !prevLine.startsWith('#')) {
            ret.push('') // add blank line before comment line
          }
        }
      }
      ret.push(line)
      return ret
    }, [])

    let newLines: string[] = []
    let ignores = _.uniq(_.flattenDeep(items))

    const labelContent = `# ${label}`
    if (currentLines.includes(labelContent)) {
      let labelIndex = currentLines.indexOf(labelContent)
      let index = labelIndex
      do {
        index++
      } while (currentLines[index] && !currentLines[index].startsWith('#'))

      const labelItems = currentLines.slice(labelIndex, index)
      ignores = ignores.filter((item) => !labelItems.includes(item))

      const forwardCount = (newLines = [
        ...currentLines.slice(0, index),
        ...ignores,
        '',
        ...currentLines.slice(index),
      ])
    } else {
      newLines = [...currentLines, '', labelContent, ...ignores, '']
    }

    let newContent = newLines.join('\n')

    newContent = newContent
      .replace(/\n{3,}/g, '\n\n') // 清理多余空行
      .replace(/\n{2,}$/g, '\n') // 末尾只留一个 \n

    debug('ensureGitIgnore: newContent=%s', newContent)
    this.fs.write(gitignoreFile, newContent)
  }
}
