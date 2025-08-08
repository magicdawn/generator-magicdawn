import { toLatest } from '../../utility/index.js'
import type { SubSetup } from '../index.js'
import type SetupGenerator from '../index.js'

export const addEslint: SubSetup = {
  fn,
  label: 'eslint',
  desc: 'eslint (use @magicdawn/eslint-config flat config)',
}

async function fn(this: SetupGenerator) {
  // config files
  this.dotFilesGenerator._copyFiles(['eslint.config.js'])

  // deps
  this.fs.extendJSON(this.destinationPath('package.json'), {
    devDependencies: await toLatest({
      'eslint': '',
      '@magicdawn/eslint-config': '',
    }),
  })

  const { extraActions } = await this.prompt<{ extraActions: string[] }>([
    {
      name: 'extraActions',
      message: 'extra actions',
      type: 'checkbox',
      choices: [
        {
          name: 'add vscode settings to .vscode/settings.json',
          value: 'vscode',
        },
        {
          name: 'add lint-staged config to package.json',
          value: 'lint-staged',
        },
      ],
    },
  ])

  // vscode settings
  if (extraActions.includes('vscode')) {
    this.fs.extendJSON(this.destinationPath('.vscode/settings.json'), {
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': 'explicit',
      },
    })
  }

  // package.json lint-staged config
  if (extraActions.includes('lint-staged')) {
    this.fs.extendJSON(this.destinationPath('package.json'), {
      'lint-staged': {
        '*.{?(c|m)(j|t)s?(x),json,y?(a)ml}': ['eslint --fix', 'prettier --write'],
        '!*.{?(c|m)(j|t)s?(x),json,y?(a)ml}': ['prettier --write --ignore-unknown'],
      },
    })
  }
}
