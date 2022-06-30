import debugFactory from 'debug'
import fse from 'fs-extra'
import _ from 'lodash'
import swig from 'swig-templates'
import Generator from 'yeoman-generator'
import AppGenerator from '../app/index'
import DotFilesGenerator from '../dot-files/index.js'
import { addTs, addPrettier, addEslint } from './stuff'

// @ts-ignore
const PKG_TPL = require('../../templates/app/package.json')
const debug = debugFactory('yo:magicdawn:setup')

export interface SubSetup {
  label: string
  desc: string
  fn: (this: SetupGenerator) => void | Promise<void>
}

const MORE_SETUPS: SubSetup[] = [addPrettier, addTs, addEslint]

export default class SetupGenerator extends Generator {
  dotFilesGenerator: DotFilesGenerator
  appGenerator: AppGenerator

  get subSetups(): SubSetup[] {
    return [
      ...MORE_SETUPS,
      {
        label: 'mocha',
        desc: '测试 (pkg mocha/nyc/codecov) (.mocharc.yml .travis.yml)',
        fn: this._addMocha,
      },
      {
        label: 'readme',
        desc: 'README (readme/layout.md readme/api.md readme/)',
        fn: this._addReadme,
      },
    ]
  }

  constructor(args: string[], opts: {}) {
    super(args, opts)
    debug('constructor arguments %j', arguments)

    // templates root
    this.sourceRoot(__dirname + '/../../templates/app')

    // select action use --flag
    for (let item of this.subSetups) {
      const { label } = item
      this.option(label, {
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
      const actions = this.subSetups.map((i) => i.label)
      return this._run(actions)
    }

    // check flag
    if (this.subSetups.some(({ label: value }) => this.options[value])) {
      const actions = this.subSetups.map((i) => i.label).filter((value) => this.options[value])
      return this._run(actions)
    }

    // prompt
    {
      const { actions } = await this._promptAction()
      return this._run(actions)
    }
  }

  async _run(actions: string[]) {
    for (let action of actions) {
      // find in subSetups
      const sub = this.subSetups.find((setup) => setup.label === action)
      if (sub) {
        await sub.fn.call(this)
        continue
      }

      // more
      throw new Error(`unexpected action ${action}`)
    }
  }

  async _promptAction() {
    const answers = await this.prompt([
      {
        type: 'checkbox',
        name: 'actions',
        message: 'Setup Actions',
        choices: [...this.subSetups],
      },
    ])

    return answers
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

  // 检查 `package.json` 文件
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

  /** 添加项目到 .gitignore 中 */
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
