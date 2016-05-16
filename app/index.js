'use strict';

/**
 * module dependencies
 */
const Base = require('yeoman-generator').Base;
const inherits = require('util').inherits;
const _ = require('lodash');
const co = require('co');
const fs = require('needle-kit').fs;
const moment = require('moment');

/**
 * do exports
 */

module.exports = Generator;

/**
 * Generator Class definition
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
  // .eslintrc.yml .jsbeautifyrc .travis.yml .gitignore test/mocha.opts CHANGELOG.md
  this._copyFiles();

  // 生成package.json
  //    deps
  //    scripts test / test-cover
  this._modifyPackageJson();

  // README.md 读 package.json name
  // CHANGELOG.md
  this._copyTpl();
});

/**
 * 检查 `package.json` 文件
 */

g._checkPackageJson = co.wrap(function*() {
  const destPackageJsonPath = this.destinationPath('package.json');
  const exists = yield fs.existsAsync(destPackageJsonPath);

  // warn
  if (!exists) {
    console.error('package.json not found, run `npm init` first');
  }

  return exists;
});

/**
 * 修改 package.json
 *
 * 	- deps
 * 	- scripts.{ test, test-cover }
 */

g._modifyPackageJson = function() {
  const destPath = this.destinationPath('package.json');
  let dest = require(destPath);
  let src = require(this.templatePath('package.json'));
  src = _.pick(src, 'dependencies', 'devDependencies', 'scripts');

  // defaults
  dest = _.defaultsDeep(dest, src);

  // write
  this.fs.writeJson(destPath, dest);
};

/**
 * 复制文件
 */

g._copyFiles = function() {
  // 原样复制
  const files = [
    '.eslintrc.yml', '.jsbeautifyrc',
    '.travis.yml', 'test/mocha.opts',
    '.gitignore'
  ];

  for (let f of files) {
    const from = this.templatePath(f);
    const to = this.destinationPath(f);
    this.fs.copy(from, to);
  }
};

g._copyTpl = function() {
  _.each({
    'CHANGELOG.md': {
      currentDate: moment().format('YYYY-MM-DD')
    },
    'README.md': {

    }
  }, (v, f) => {
    const from = this.templatePath(f);
    const to = this.destinationPath(f);
    this.fs.copyTpl(from, to, v);
  });
};