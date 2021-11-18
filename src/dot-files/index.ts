import Generator from 'yeoman-generator'
import fse from 'fs-extra'
import debugFactory from 'debug'

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

  // mocha
  {
    name: '.mocharc.yml',
    desc: 'mocha config file',
  },

  // travis
  {
    name: '.travis.yml',
    desc: 'Travis ci config file',
  },

  // ts
  {
    name: 'tsconfig.json',
    desc: 'TypeScript config',
  },
]

export default class extends Generator {
  constructor(...args: [args: string[], opts: {}]) {
    super(...args)
    // project root
    this.sourceRoot(__dirname + '/../../')
  }

  async default() {
    const {dotfiles} = await this._prompt()
    this._copyFiles(dotfiles)
  }

  async _prompt() {
    const answers = await this.prompt<{dotfiles: string[]}>([
      {
        type: 'checkbox',
        message: '选择 dot-files',
        name: 'dotfiles',
        choices: [
          ...OPTIONS.map((item) => {
            return {name: `${item.name} (${item.desc})`, value: item.name}
          }),
        ],
      },
    ])

    return answers
  }

  _getDotFilePath(name: string) {
    let file: string

    let tryFile = () => {
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
    for (let item of dotfiles) {
      const src = this._getDotFilePath(item)
      const dest = this.destinationPath(item)
      this.fs.copy(src, dest)
    }
  }
}
