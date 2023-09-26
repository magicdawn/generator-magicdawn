import { PackageJson } from 'type-fest'
import SetupGenerator, { SubSetup } from '../'

// yo magicdawn:setup --package
export const addPackage: SubSetup = {
  label: 'package',
  desc: 'package.json config',
  fn,
}

async function fn(this: SetupGenerator) {
  type Action = 'publishConfig.registry'
  const { actions } = await this.prompt<{ actions: Action[] }>([
    {
      type: 'checkbox',
      name: 'actions',
      message: '选择操作',
      choices: [
        {
          value: 'publishConfig.registry',
          checked: false,
          name: 'add publishConfig.registry',
        },
      ].filter(Boolean),
    },
  ])

  const extendPkgjson = (payload: Partial<PackageJson>) => {
    this.fs.extendJSON(this.destinationPath('package.json'), payload)
  }

  console.log('selected actions = ', actions)

  if (actions.includes('publishConfig.registry')) {
    extendPkgjson({
      publishConfig: {
        registry: 'https://registry.npmjs.org/',
      },
    })
  }
}
