import Generator from 'yeoman-generator'

const OPTIONS = [
  // eslint
  {
    source: '',
    name: '.eslintrc.yml',
    desc: 'use @magicdawn/eslint-config',
  },

  // prettier
  {
    source: '',
    name: 'prettier.config.js',
    desc: 'use @magicdawn/prettier-config',
  },

  // mocha
  {
    source: '',
    name: '.mocharc.yml',
    desc: 'mocha config file',
  },

  // travis
  {
    source: '',
    name: '.travis.yml',
    desc: 'Travis ci config file',
  },
]

export default class extends Generator {
  constructor(...args: [args: string[], opts: {}]) {
    super(...args)
    // project root
    this.sourceRoot(__dirname + '/../')
  }

  async default() {
    const {dotfiles} = await this._prompt()
    this._copyFiles(dotfiles)
  }

  async _prompt() {
    const answers = await this.prompt<{ dotfiles: string[] }>([
      {
        type: 'checkbox',
        message: '选择 dot-files',
        name: 'dotfiles',
        choices: [
          ...OPTIONS.map(item => {
            return {name: `${item.name} (${item.desc})`, value: item.name}
          }),
        ],
      },
    ])

    return answers
  }

  async _copyFiles(dotfiles: string[]) {
    const srcTpl = name => this.templatePath('app/templates/' + name)
    for (let item of dotfiles) {
      const src = srcTpl(item)
      const dest = this.destinationPath(item)
      this.fs.copy(src, dest)
    }
  }
}