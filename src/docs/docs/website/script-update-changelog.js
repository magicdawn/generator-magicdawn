#!/usr/bin/env node

require('shelljs/global')
const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')

const prefix = _.trimStart(`
---
id: changelog
title: CHANGELOG
---

`)

const templatePath = path.join(import.meta.dirname, '../../CHANGELOG.md')
const template = fs.readFileSync(templatePath, 'utf-8')
const targetPath = path.join(import.meta.dirname, '../md/changelog.md')
fs.writeFileSync(targetPath, prefix + template, 'utf-8')
console.log('[CHANGELOG]: updated')
