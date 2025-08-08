#!/usr/bin/env node

const dev = require('node:fs').existsSync(__dirname + '/.dev')
if (dev) {
  require('ts-node').register({ project: __dirname + '/../tsconfig.json' })
  require('../src/bin.ts')
} else {
  require('../lib/bin.js')
}
