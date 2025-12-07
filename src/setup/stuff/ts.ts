import { trimEnd } from 'es-toolkit'
import fg from 'fast-glob'
import { getLatestVersion } from '../../utility/index.js'
import type { SubSetup } from '../index.js'
import type SetupGenerator from '../index.js'
import type { PackageJson, TsConfigJson } from 'type-fest'

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
    outdir = trimEnd(outdir, '/')
  }

  // src/index.ts
  const dir = this.destinationPath('src')
  const srcTsCount = fg.sync('./**/*.{ts,tsx}', { cwd: dir, suppressErrors: true }).length
  if (!srcTsCount) {
    this.fs.write(this.destinationPath('src/index.ts'), `console.log('Hello TypeScript ~')`)
  }

  type Action = 'add-tsc-watch' | 'add-tsup'
  const { actions } = await this.prompt<{ actions: Action[] }>([
    {
      type: 'checkbox',
      name: 'actions',
      message: '选择操作',
      choices: [
        {
          value: 'add-tsc-watch',
          checked: false,
          name: 'add-tsc-watch: 添加 scripts.dev = `tsc -w` etc',
        },
        {
          value: 'add-tsup',
          checked: false,
          name: 'tsup: dep, tsup.config.ts, scripts.dev & build',
        },
      ].filter(Boolean),
    },
  ])

  console.log('selected actions =', actions)

  const extendPkgjson = (payload: Partial<PackageJson>) => {
    this.fs.extendJSON(this.destinationPath('package.json'), payload)
  }

  if (actions.includes('add-tsc-watch')) {
    extendPkgjson({
      scripts: {
        dev: 'tsc -w --incremental',
        build: `rm -rf ${outdir}; rm tsconfig.tsbuildinfo; tsc`,
        prepublishOnly: 'npm run build',
      },
    })
  }

  if (actions.includes('add-tsup')) {
    extendPkgjson({
      scripts: {
        dev: 'tsup --watch',
        build: `tsup`,
        prepublishOnly: 'npm run build',
      },
      devDependencies: {
        tsup: `^${await getLatestVersion('tsup')}`,
      },
    })

    this.dotFilesGenerator._copyFiles(['tsup.config.ts'])
  }

  // latest tsc version
  const latestTsVersion = await getLatestVersion('typescript')
  extendPkgjson({
    devDependencies: {
      typescript: `^${latestTsVersion}`,
    },
  })

  // .gitignore
  this.ensureGitIgnore(
    'ts',
    ...['**/*.tsbuildinfo', `/${outdir}`, actions.includes('add-tsup') ? '/dist' : ''].filter(Boolean),
  )
}
