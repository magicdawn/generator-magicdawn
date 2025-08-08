import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import yeoman from 'yeoman-environment'
import type AppGenerator from '../src/app'

// @ts-ignore
const env = yeoman.createEnv()

describe('AppGenerator', function () {
  let g: AppGenerator | undefined = undefined
  beforeEach(() => {
    env.register(path.join(__dirname, '../'))
    g = env.create('magicdawn:app', []) as AppGenerator
  })

  it('#getTemplateLocals', () => {
    const viewbag = g?.getTemplateLocals()
    expect(viewbag).toBeTruthy()
  })
})
