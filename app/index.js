'use strict';

/**
 * module dependencies
 */
const Base = require('yeoman-generator').Base;
const inherits = require('util').inherits;
const _ = require('lodash');
const co = require('co');
const fs = require('needle-kit').fs;

/**
 * do exports
 */

module.exports = Generator;

/**
 * Generator Class definition
 *
 * # create .gitignore / .jshintrc / .jsbeautifyrc
 * yo magicdawn
 *
 * # yo magicdawn <file>
 * yo magicdawn jshint
 */

function Generator() {
  Base.apply(this);
  this.sourceRoot(__dirname + '/templates');
}
inherits(Generator, Base);

const g = Generator.prototype;

/**
 * we starts here
 */

g.default = co.wrap(function*() {
  if (!(yield this._checkPackageJson())) return;

  // 复制文件
  // 1 .eslintrc.yml .jsbeautifyrc .travis.yml
  // 2 空 .gitignore test/mocha.opts README.md
});

g._checkPackageJson = co.wrap(function*() {
  const destPackageJsonPath = this.destinationPath('package.json');
  const exists = yield fs.existsAsync(destPackageJsonPath);

  // warn
  if (!exists) {
    console.error('package.json not found, run `npm init` first');
  }

  return exists;
});