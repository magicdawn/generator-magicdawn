import { PackageJson, TsConfigJson } from 'type-fest'
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

  const currentPkg = this.fs.readJSON(this.destinationPath('package.json')) as PackageJson
  const currentConfigHasBin =
    (typeof currentPkg.bin === 'string' && currentPkg.bin) ||
    (typeof currentPkg.bin === 'object' && Object.keys(currentPkg.bin).length)

  const { actions } = await this.prompt<{ actions: ('add-bin' | 'add-tsc-watch')[] }>([
    {
      type: 'checkbox',
      name: 'actions',
      message: '选择操作',
      choices: [
        !currentConfigHasBin && {
          value: 'add-bin',
          checked: false,
          name: 'add-bin: 添加 bin/.dev bin ts-node etc',
        },
        {
          value: 'add-tsc-watch',
          checked: false,
          name: 'add-tsc-watch: 添加 scripts.dev = `tsc -w` etc',
        },
      ].filter(Boolean),
    },
  ])

  console.log(actions)

  if (actions.includes('add-bin')) {
    // bin/.dev
    await this.dotFilesGenerator._copyFiles(['bin/.dev'])

    // bin/[bin-name]
    let binName = currentPkg.name
    if (binName.includes('@') && binName.includes('/')) binName = binName.split('/')[1]
    binName = _.kebabCase(currentPkg.name)
    const binFile = this.destinationPath(`bin/${binName}`)
    const binTplFile = this.dotFilesGenerator._getDotFilePath('bin/bin.js')
    this.fs.copy(binTplFile, binFile)

    // pkg.bin
    this.fs.extendJSON(this.destinationPath('package.json'), {
      bin: {
        [binName]: `bin/${binName}`,
      },
    })
  }

  if (actions.includes('add-tsc-watch')) {
    const scripts = {
      dev: 'tsc -w --incremental',
      build: `rm -rf ${outdir}; rm tsconfig.tsbuildinfo; tsc`,
      prepublishOnly: 'npm run build',
    }
    // scripts
    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts,
    })
  }

  // latest tsc version
  const latestTsVersion = await getLatestVersion('typescript')
  this.fs.extendJSON(this.destinationPath('package.json'), {
    devDependencies: {
      typescript: `^${latestTsVersion}`,
    },
  })

  // .gitignore
  this.ensureGitIgnore('ts', '**/*.tsbuildinfo', `/${outdir}`)
}
