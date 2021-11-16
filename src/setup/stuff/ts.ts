import fse from 'fs-extra'
import JSON5 from 'json5'
import {TsConfigJson} from 'type-fest'
import _ from 'lodash'
import SetupGenerator, {ISetupAction} from '../'
import {getLatestVersion} from '../../utility'

export default {
  label: 'ts',
  desc: 'TypeScript (tsconfig.json / package.json ...)',
  fn,
} as ISetupAction

async function fn(this: SetupGenerator) {
  const tsconfig = this.destinationPath('tsconfig.json')

  // copy when needed
  if (!fse.existsSync(tsconfig)) {
    this.dotFilesGenerator._copyFiles(['tsconfig.json'])
  }

  let outdir = 'lib'
  if (fse.existsSync(tsconfig)) {
    const content = fse.readFileSync(tsconfig, 'utf8')
    const currentConfig = JSON5.parse(content) as TsConfigJson
    outdir = currentConfig.compilerOptions?.outDir || outdir
    outdir = _.trimEnd(outdir, '/')
  }

  // latest tsc version
  const latestTsVersion = await getLatestVersion('typescript')

  // ts-node or not
  const {tstype} = await this.prompt<{tstype: 'ts-node' | 'tsc-watch'}>([
    {
      type: 'list',
      name: 'tstype',
      message: 'Select TypeScript dev type',
      choices: [
        {
          name: 'ts-node',
          checked: true,
        },
        {
          name: 'tsc-watch',
          checked: false,
        },
      ],
    },
  ])

  const scripts = {
    build: `rm -rf ${outdir}; rm tsconfig.tsbuildinfo; tsc`,
    prepublishOnly: 'npm run build',
  }

  // ts-node
  if (tstype === 'ts-node') {
    Object.assign(scripts, {
      'start': 'ts-node ./src/index.ts',
      'start:debug': 'node --inspect-brk -r ts-node/register ./src/index.ts',
    })

    const [latestTsNodeVersion, latestSwcCoreVersion, latestSwcHelpersVersion] = await Promise.all([
      getLatestVersion('ts-node'),
      getLatestVersion('@swc/core'),
      getLatestVersion('@swc/helpers'),
    ])
    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts,
      devDependencies: {
        '@swc/core': `^${latestSwcCoreVersion}`,
        '@swc/helpers': `^${latestSwcHelpersVersion}`,
        'ts-node': `^${latestTsNodeVersion}`,
        'typescript': `^${latestTsVersion}`,
      },
    })

    this.fs.extendJSON(tsconfig, {
      'ts-node': {
        transpileOnly: true,
        transpiler: 'ts-node/transpilers/swc-experimental',
      },
    })
  }

  // tsc-watch
  else {
    Object.assign(scripts, {
      dev: 'tsc -w --incremental',
    })

    // scripts
    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts,
      devDependencies: {
        typescript: `^${latestTsVersion}`,
      },
    })
  }

  // .gitignore
  this._ensureGitIgnore('ts', '**/*.tsbuildinfo', `/${outdir}`)
}
