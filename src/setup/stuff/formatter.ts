import { getLatestVersion } from '../../utility/index.js'
import type { SubSetup } from '../index.js'
import type SetupGenerator from '../index.js'

export const addFormatter: SubSetup = {
  label: 'oxfmt',
  desc: '格式化 (pkg husky/lint-staged/oxfmt) (oxfmt.config.mts)',
  fn,
}

async function fn(this: SetupGenerator) {
  const versions = await Promise.all([
    getLatestVersion('husky'),
    getLatestVersion('lint-staged'),
    getLatestVersion('oxfmt'),
    getLatestVersion('@magicdawn/configs'),
  ])

  const [huskyV, lintStagedV, oxfmtV, configsV] = versions.map((v) => `^${v}`)

  // deps
  this.fs.extendJSON(this.destinationPath('package.json'), {
    'scripts': {
      prepare: 'husky',
    },
    'devDependencies': {
      '@magicdawn/configs': configsV,
      'husky': huskyV,
      'lint-staged': lintStagedV,
      'oxfmt': oxfmtV,
    },
    'lint-staged': {
      '*.{?(c|m)(j|t)s?(x),json,y?(a)ml}': ['eslint --fix', 'oxfmt --write'],
      '!*.{?(c|m)(j|t)s?(x),json,y?(a)ml}': ['oxfmt --write --no-error-on-unmatched-pattern'],
    },
  })

  this.dotFilesGenerator._copyFiles([
    // git hook
    '.husky/pre-commit',
    // config files
    'oxfmt.config.mts',
  ])
}
