import fse from 'fs-extra'
import { createDebug } from 'obug'
import Generator from 'yeoman-generator'

const debug = createDebug('yo:magicdawn:dot-files')

const OPTIONS = [
  // eslint
  {
    name: '.eslintrc.yml',
    desc: 'use @magicdawn/eslint-config',
  },

  // oxfmt
  {
    name: 'oxfmt.config.mts',
    desc: 'use @magicdawn/oxfmt-config',
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

export default class DotFilesGenerator extends Generator {
  constructor(...args: ConstructorParameters<typeof Generator>) {
    super(...args)
    // project root
    this.sourceRoot(import.meta.dirname + '/../../')
  }

  async default() {
    const { dotfiles } = await this.#prompt()
    this._copyFiles(dotfiles)
  }

  async #prompt() {
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

  #getDotFilePath(name: string) {
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

  _copyFiles(dotfiles: string[]) {
    for (const item of dotfiles) {
      const src = this.#getDotFilePath(item)
      debug('resolved %s -> %s', item, src)
      const dest = this.destinationPath(item)
      this.fs.copy(src, dest)
    }
  }
}
