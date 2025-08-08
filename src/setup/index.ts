import { createRequire } from 'node:module'
import debugFactory from 'debug'
import fse from 'fs-extra'
import _ from 'lodash'
import swig from 'swig-templates'
import Generator, { type BaseOptions } from 'yeoman-generator'
import AppGenerator from '../app/index.js'
import DotFilesGenerator from '../dot-files/index.js'
import { addEslint, addPackage, addPrettier, addTs } from './stuff/index.js'

const require = createRequire(import.meta.url)
const PKG_TPL = require('../../templates/app/package.json')
const debug = debugFactory('yo:magicdawn:setup')

export interface SubSetup {
  label: string
  desc: string
  fn: (this: SetupGenerator) => void | Promise<void>
}

const MORE_SETUPS: SubSetup[] = [addPrettier, addEslint, addTs, addPackage]

class SetupGenerator extends Generator<BaseOptions & { all: boolean }> {
  dotFilesGenerator: DotFilesGenerator
  appGenerator: AppGenerator

  get subSetups(): SubSetup[] {
    return [
      ...MORE_SETUPS,
      {
        label: 'Unit Test (vitest)',
        desc: '单测 (package.json: scripts & deps)',
        fn: this.addUnitTest,
      },
      {
        label: 'readme',
        desc: 'README (readme/layout.md readme/api.md readme/)',
        fn: this.addReadme,
      },
    ]
  }

  constructor(args: string[], opts: {}) {
    super(args, opts)
    // eslint-disable-next-line prefer-rest-params
    debug('constructor arguments %j', arguments)

    this.options.skipInstall = true

    // templates root
    this.sourceRoot(import.meta.dirname + '/../../templates/app')

    // select action use --flag
    for (const item of this.subSetups) {
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
      const { actions } = await this.promptAction()
      return this._run(actions)
    }
  }

  async _run(actions: string[]) {
    for (const action of actions) {
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

  async promptAction() {
    const answers = await this.prompt([
      {
        type: 'checkbox',
        name: 'actions',
        message: 'Setup Actions',
        choices: this.subSetups.map((setup) => ({
          name: setup.desc,
          value: setup.label,
        })),
      },
    ])

    return answers
  }

  addUnitTest() {
    // deps
    this.fs.extendJSON(this.destinationPath('package.json'), {
      devDependencies: _.pick(PKG_TPL.devDependencies, ['vitest', '@vitest/coverage-v8']),
      scripts: _.pick(PKG_TPL.scripts, ['test', 'test:dev', 'test-cover']),
    })

    // github CI
    // this.dotFilesGenerator._copyFiles(['.github'])
  }

  addReadme() {
    const files = ['readme/readme.md', 'readme/layout.md', 'readme/api.md']
    const viewbag = this.appGenerator.getTemplateLocals()

    // should generate file
    const shouldGenerate = (file: string) => {
      if (!this.fs.exists(file)) return true

      const content = fse.readFileSync(file, 'utf8')
      if (/<!-- AUTO_GENERATED_UNTOUCHED_FLAG -->/.test(content)) {
        return true
      }

      return false
    }

    for (const f of files) {
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
  checkPackageJson() {
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
  ensureGitIgnore(label: 'ts', ...items: Array<string | string[]>) {
    const gitignoreFile = this.destinationPath('.gitignore')
    if (!this.fs.exists(gitignoreFile)) {
      this.dotFilesGenerator._copyFiles(['.gitignore'])
    }

    const currentContent = this.fs.read(gitignoreFile) || ''
    let currentLines = currentContent.split('\n').map((line) => line.trim())

    // ensure a blank line before a block label
    currentLines = currentLines.reduce((ret, line, index, arr) => {
      if (line.startsWith('#') && index > 0) {
        const prevLine = arr[index - 1]
        if (prevLine && !prevLine.startsWith('#')) {
          ret.push('') // add blank line before comment line
        }
      }
      ret.push(line)
      return ret
    }, [] as string[])

    let newLines: string[] = []
    let ignores = _.uniq(_.flattenDeep(items))

    const labelContent = `# ${label}`
    if (currentLines.includes(labelContent)) {
      const labelIndex = currentLines.indexOf(labelContent)
      let index = labelIndex
      do {
        index++
      } while (currentLines[index] && !currentLines[index].startsWith('#'))

      const labelItems = currentLines.slice(labelIndex, index)
      ignores = ignores.filter((item) => !labelItems.includes(item))

      const forwardCount = (newLines = [...currentLines.slice(0, index), ...ignores, '', ...currentLines.slice(index)])
    } else {
      newLines = [...currentLines, '', labelContent, ...ignores, '']
    }

    let newContent = newLines.join('\n')

    newContent = newContent
      .replaceAll(/\n{3,}/g, '\n\n') // 清理多余空行
      .replaceAll(/\n{2,}$/g, '\n') // 末尾只留一个 \n

    debug('ensureGitIgnore: newContent=%s', newContent)
    this.fs.write(gitignoreFile, newContent)
  }
}

export default class SetupGeneratorWrapper extends SetupGenerator {
  default() {
    return super.default()
  }
}
