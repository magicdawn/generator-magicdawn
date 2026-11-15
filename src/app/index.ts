import fs from 'node:fs'
import path from 'node:path'
import consola from 'consola'
import dayjs from 'dayjs'
import { camelCase, omit } from 'es-toolkit'
import gitconfig from 'git-config'
import { Liquid } from 'liquidjs'
import { createDebug } from 'obug'
import Generator from 'yeoman-generator'
import type { PackageJson } from 'type-fest'

const debug = createDebug('yo:magicdawn:app')
const APP_TEMPLATES_DIR = path.join(import.meta.dirname, '../../templates/app/')
const liquid = new Liquid({ root: APP_TEMPLATES_DIR })

export default class AppGenerator extends Generator {
  constructor(...args: ConstructorParameters<typeof Generator>) {
    super(...args)

    // set skip install
    this.options.skipInstall = true

    debug('constructor arguments %O', args)
    this.sourceRoot(APP_TEMPLATES_DIR)
  }

  default() {
    const ok = this.#checkPackageJson()
    if (!ok) return

    // 生成package.json
    //    deps
    //    scripts test / test-cover
    this.#modifyPackageJson()

    // 复制文件
    this.#copyFiles()
  }

  /**
   * 检查 `package.json` 文件
   */
  #checkPackageJson() {
    const destPackageJsonPath = this.destinationPath('package.json')
    const exists = fs.existsSync(destPackageJsonPath)

    // warn
    if (!exists) {
      consola.error('package.json not found, run `npm init` first')
      return false
    }

    // ok
    return true
  }

  /**
   * 修改 package.json
   * 	- deps
   * 	- scripts.{ test, test-cover }
   */
  #modifyPackageJson() {
    const pkg = this.fs.readJSON(this.templatePath('package.json')) as PackageJson
    const pkgPartial = omit(pkg, ['name', 'version', 'private'])
    this.fs.extendJSON(this.destinationPath('package.json'), pkgPartial)
  }

  /**
   * 复制文件
   */
  #copyFiles() {
    const locals = this.#getTemplateLocals()

    const files: (string | { name: string; locals?: object })[] = [
      // eslint
      'eslint.config.mjs',

      // edit
      '.editorconfig',

      // prettier
      '.prettierignore',
      'prettier.config.cjs',
      '.husky',

      // test
      'test/.gitkeep',

      // ci
      '.github',

      // package related
      { name: 'LICENSE' },
      { name: 'CHANGELOG.md' },
      { name: 'README.md' },

      // ts
      'src',
      'tsconfig.json',
    ]

    for (const f of files) {
      // write as same
      if (typeof f === 'string') {
        const from = this.templatePath(f)
        const to = this.destinationPath(f)
        this.fs.copy(from, to)
        continue
      }

      // render & write
      else {
        const { name, locals: currentLocals } = f
        const to = this.destinationPath(name)
        const content = liquid.renderFileSync(name, currentLocals ?? locals)
        this.fs.write(to, content)
      }
    }

    // .gitignore 特殊
    // https://github.com/npm/npm/issues/3763
    this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'))
  }

  #getTemplateLocals() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json')) as PackageJson

    // 获取 repoName
    const getRepoName = () => {
      let repoName: string

      const giturl = (gitconfig.sync(process.cwd() + '/.git/config') as any)?.['remote "origin"']?.url
      repoName = giturl && path.basename(giturl, '.git')
      if (repoName) {
        debug('repoName from git url: %s', repoName)
        return repoName
      }

      // pkg.name as fallback
      repoName = pkg.name!
      debug('repoName from pkg.name: %s', repoName)
      return repoName
    }

    const currentYear = dayjs().format('YYYY')
    const currentDate = dayjs().format('YYYY-MM-DD')
    const packageName = pkg.name
    const packageLocalName = camelCase(pkg.name || '') // 变量名
    const packageDescription = (pkg.description as string) || '' // 描述

    return {
      currentYear,
      currentDate,
      packageName,
      repoName: getRepoName(),
      packageLocalName,
      packageDescription,
    }
  }
}
