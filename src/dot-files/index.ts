/* eslint-disable @typescript-eslint/ban-types */
import debugFactory from 'debug'
import fse from 'fs-extra'
import Generator from 'yeoman-generator'

const debug = debugFactory('yo:magicdawn:dot-files')

const OPTIONS = [
  // eslint
  {
    name: '.eslintrc.yml',
    desc: 'use @magicdawn/eslint-config',
  },

  // prettier
  {
    name: 'prettier.config.js',
    desc: 'use @magicdawn/prettier-config',
  },

  // ts
  {
    name: 'tsconfig.json',
    desc: 'TypeScript config',
  },

  // .github
  {
    name: '.github/workflows/ci.yml',
    desc: 'GitHub Actions config',
  },
]

export default class extends Generator {
  constructor(...args: [args: string[], opts: {}]) {
    super(...args)
    // project root
    this.sourceRoot(__dirname + '/../../')
  }

  async default() {
    const { dotfiles } = await this._prompt()
    this._copyFiles(dotfiles)
  }

  async _prompt() {
    const answers = await this.prompt<{ dotfiles: string[] }>([
      {
        type: 'checkbox',
        message: '选择 dot-files',
        name: 'dotfiles',
        choices: [
          ...OPTIONS.map((item) => {
            return { name: `${item.name} (${item.desc})`, value: item.name }
          }),
        ],
      },
    ])

    return answers
  }

  _getDotFilePath(name: string) {
    let file: string

    const tryFile = () => {
      // this.fs.exists 不能判断 .github 文件夹
      if (file && fse.existsSync(file)) {
        return file
      } else {
        debug('not exists: %s', file)
      }
    }

    // patch .gitignore
    if (name === '.gitignore') {
      file = this.templatePath('templates/app/' + name.slice(1))
      if (tryFile()) return file
    }

    file = this.templatePath('templates/app/' + name)
    if (tryFile()) return file

    file = this.templatePath('templates/dotfiles/' + name)
    if (tryFile()) return file

    throw new Error(`can not find dotfile name = ${name}`)
  }

  async _copyFiles(dotfiles: string[]) {
    for (const item of dotfiles) {
      const src = this._getDotFilePath(item)
      debug('resolved %s -> %s', item, src)
      const dest = this.destinationPath(item)
      this.fs.copy(src, dest)
    }
  }
}
