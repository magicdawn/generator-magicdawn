import { TsConfigJson } from 'type-fest'
import _ from 'lodash'
import SetupGenerator, { SubSetup } from '../'
import { getLatestVersion } from '../../utility'

export const addTs: SubSetup = {
  label: 'ts',
  desc: 'TypeScript (tsconfig.json / package.json ...)',
  fn,
}

async function fn(this: SetupGenerator) {
  const tsconfig = this.destinationPath('tsconfig.json')

  // copy when needed
  if (!this.fs.exists(tsconfig)) {
    this.dotFilesGenerator._copyFiles(['tsconfig.json'])
  }

  let outdir = 'lib'
  if (this.fs.exists(tsconfig)) {
    const currentConfig = this.fs.readJSON(tsconfig) as TsConfigJson
    outdir = currentConfig.compilerOptions?.outDir || outdir
    outdir = _.trimEnd(outdir, '/')
  }

  // src/index.ts
  if (!this.fs.exists(this.destinationPath('src/index.ts'))) {
    this.fs.write(this.destinationPath('src/index.ts'), `console.log('Hello TypeScript ~')`)
  }

  // latest tsc version
  const latestTsVersion = await getLatestVersion('typescript')

  // ts-node or not
  const { tstype } = await this.prompt<{ tstype: 'ts-node' | 'tsc-watch' }>([
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
  this.ensureGitIgnore('ts', '**/*.tsbuildinfo', `/${outdir}`)
}
