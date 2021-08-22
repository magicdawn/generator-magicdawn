import BaseGenerator, {ISetupAction} from '../'
import execa from 'execa'

export default {
  label: 'yarn2',
  desc: 'Yarn2 support',
  async fn() {
    // update
    await execa.command('yarn set version berry')
    await execa.command('yarn set version latest')

    // .gitignore
    this._ensureGitIgnore('yarn2', [
      '.yarn/*',
      '!.yarn/patches',
      '!.yarn/releases',
      '!.yarn/plugins',
      '!.yarn/sdks',
      '!.yarn/versions',
      '.pnp.*',
    ])

    // .yarnrc.yml
    {
      const file = this.destinationPath('.yarnrc.yml')
      const content = this.fs.read(file)
      const lines = content.split('\n')
      const toadd = [
        'enableGlobalCache: true',
        'nodeLinker: node-modules',
        'npmRegistryServer: https://registry.npm.taobao.org/',
      ]
      const newLines = [...lines, '', toadd.filter((add) => !lines.includes(add))]
      const newContent = newLines.join('\n')
      this.fs.write(file, newContent)
    }

    // yarn
    // await execa('yarn', {stdio: 'inherit'})
  },
} as ISetupAction
