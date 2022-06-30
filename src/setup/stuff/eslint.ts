import SetupGenerator, { SubSetup } from '..'

export const addEslint: SubSetup = {
  fn,
  label: 'eslint',
  desc: 'eslint (pkg eslint/@magicdawn/eslint-config) (.eslintrc.yml)',
}

async function fn(this: SetupGenerator) {
  // deps
  this.fs.extendJSON(this.destinationPath('package.json'), {
    devDependencies: {
      '@magicdawn/eslint-config': 'latest',
      'eslint': '^6.8.0',
    },
  })

  // config files
  this.dotFilesGenerator._copyFiles(['.eslintrc.yml'])
}
