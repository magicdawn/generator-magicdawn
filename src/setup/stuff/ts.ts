import fse from 'fs-extra'
import JSON5 from 'json5'
import {TsConfigJson} from 'type-fest'
import _ from 'lodash'
import Setup, {ISetupAction} from '../'

export default {
  label: 'ts',
  desc: 'TypeScript (tsconfig.json / package.json ...)',
  fn,
} as ISetupAction

function fn(this: Setup) {
  const tsconfig = this.destinationPath('tsconfig.json')

  // copy when needed
  if (!fse.existsSync(tsconfig)) {
    this.dotFilesGenerator._copyFiles(['tsconfig.json'])
  }

  let outdir = 'lib'
  if (fse.existsSync(tsconfig)) {
    const content = fse.readFileSync(tsconfig, 'utf8')
    const currentConfig = JSON5.parse(content) as TsConfigJson
    outdir = currentConfig.compilerOptions.outDir
    outdir = _.trimEnd(outdir, '/')
  }

  // scripts
  this.fs.extendJSON(this.destinationPath('package.json'), {
    scripts: {
      dev: 'tsc -w --incremental',
      build: `rm -rf ${outdir}; rm tsconfig.tsbuildinfo; tsc`,
      prepublishOnly: 'npm run build',
    },
    devDependencies: {
      typescript: '^4',
    },
  })

  // .gitignore
  this._ensureGitIgnore('ts', '**/*.tsbuildinfo')
}
