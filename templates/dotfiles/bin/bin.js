#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */

const dev = require('fs').existsSync(__dirname + '/.dev')

if (dev) {
  require('ts-node').register({ project: __dirname + '/../tsconfig.json' })
  require('../src/bin.ts')
} else {
  require('../lib/bin.js')
}
