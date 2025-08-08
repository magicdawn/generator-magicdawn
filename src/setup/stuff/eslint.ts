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

  // vscode settings
  this.fs.extendJSON(this.destinationPath('.vscode/settings.json'), {
    'editor.codeActionsOnSave': {
      'source.fixAll.eslint': 'explicit',
    },
  })

  // package.json lint-staged config
  this.fs.extendJSON(this.destinationPath('package.json'), {
    'lint-staged': {
      '*.{?(c|m)(j|t)s?(x),json,y?(a)ml}': ['eslint --fix', 'prettier --write'],
      '!*.{?(c|m)(j|t)s?(x),json,y?(a)ml}': ['prettier --write --ignore-unknown'],
    },
  })
}
