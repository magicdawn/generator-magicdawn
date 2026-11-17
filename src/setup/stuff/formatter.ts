import { getLatestVersion } from '../../utility/index.js'
import type { SubSetup } from '../index.js'
import type SetupGenerator from '../index.js'

export const addFormatter: SubSetup = {
  label: 'oxfmt',
  desc: '格式化 (pkg husky/lint-staged/oxfmt) (oxfmt.config.mts)',
  fn,
}

async function fn(this: SetupGenerator) {
  const relatedDeps = ['@magicdawn/configs', 'eslint-plugin-oxfmt', 'husky', 'lint-staged', 'oxfmt']
  const versions = await Promise.all(relatedDeps.map((id) => getLatestVersion(id)))
  const depMap = Object.fromEntries(relatedDeps.map((id, index) => [id, `^${versions[index]}`]))

  // deps
  this.fs.extendJSON(this.destinationPath('package.json'), {
    'scripts': {
      prepare: 'husky',
    },
    'devDependencies': {
      ...depMap,
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
