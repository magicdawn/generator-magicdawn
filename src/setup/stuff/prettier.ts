import SetupGenerator, { SubSetup } from '../index.js'
import { getLatestVersion } from '../../utility/index.js'

export const addPrettier: SubSetup = {
  fn,
  label: 'prettier',
  desc: '格式化 (pkg husky/lint-staged/prettier) (prettier.config.js)',
}

async function fn(this: SetupGenerator) {
  const versions = await Promise.all([
    getLatestVersion('husky'),
    getLatestVersion('lint-staged'),
    getLatestVersion('prettier'),
    getLatestVersion('@magicdawn/prettier-config'),
  ])

  const [huskyV, lintStagedV, prettierV, prettierConfigV] = versions.map((v) => `^${v}`)

  // deps
  this.fs.extendJSON(this.destinationPath('package.json'), {
    'scripts': {
      prepare: 'husky install',
    },
    'devDependencies': {
      '@magicdawn/prettier-config': prettierConfigV,
      'husky': huskyV,
      'lint-staged': lintStagedV,
      'prettier': prettierV,
    },
    'lint-staged': {
      '*.{js,jsx,ts,tsx,less,md}': ['prettier --write'],
    },
  })

  this.dotFilesGenerator._copyFiles([
    // git hook
    '.husky/pre-commit',

    // config files
    'prettier.config.js',
  ])
}
