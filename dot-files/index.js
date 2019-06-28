const Generator = require('yeoman-generator')

const OPTIONS = [
  // eslint
  {
    source: '',
    name: '.eslintrc.yml',
    desc: '(use @magicdawn/eslint-config)',
  },

  // prettier
  {
    source: '',
    name: 'prettier.config.js',
    desc: '(use @magicdawn/eslint-config)',
  },

  // travis
  {
    source: '',
    name: '.travis.yml',
    desc: 'Travis ci config file',
  },
]

module.exports = class extends Generator {
  constructor(...args) {
    super(...args)

    // project root
    this.sourceRoot(__dirname + '/../')
  }

  async default() {
    const {dotfiles} = await this._prompt()
    // console.log(dotfiles)

    const srcTpl = name => this.templatePath('app/templates/' + name)
    for (let item of dotfiles) {
      const src = srcTpl(item)
      const dest = this.destinationPath(item)
      this.fs.copy(src, dest)
    }
  }

  async _prompt() {
    const answers = await this.prompt([
      {
        type: 'checkbox',
        message: '选择 dot-files',
        name: 'dotfiles',
        choices: [
          ...OPTIONS.map(item => {
            return {name: `${item.name} ${item.desc}`, value: item.name}
          }),
        ],
      },
    ])

    return answers
  }
}
