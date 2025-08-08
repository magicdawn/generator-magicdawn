import { toLatest } from '../../utility/index.js'
import type { SubSetup } from '../index.js'
import type SetupGenerator from '../index.js'

export const addEslint: SubSetup = {
  fn,
  label: 'eslint',
  desc: 'eslint (pkg eslint/@magicdawn/eslint-config) (.eslintrc.yml)',
}

async function fn(this: SetupGenerator) {
  // config files
  this.dotFilesGenerator._copyFiles(['.eslintrc.yml', '.eslintignore'])

  // deps
  this.fs.extendJSON(this.destinationPath('package.json'), {
    devDependencies: await toLatest({
      'eslint': '',
      '@typescript-eslint/parser': '',
      '@typescript-eslint/eslint-plugin': '',
      'eslint-config-prettier': '',
    }),
  })
}
