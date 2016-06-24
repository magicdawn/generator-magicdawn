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
const debug = require('debug')('yo:magicdawn:app');

/**
 * do exports
 */

module.exports = Generator;

/**
 * Generator Class definition
 */

function Generator() {
  Base.apply(this, arguments);
  debug('constructor arguments %j', arguments);

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
  let dest = this.fs.readJSON(destPath);
  let src = this.fs.readJSON(this.templatePath('package.json'));
  src = _.pick(src, 'dependencies', 'devDependencies', 'scripts');

  // defaults
  dest = _.defaultsDeep(dest, src);

  // write
  this.fs.writeJSON(destPath, dest);
};

/**
 * 复制文件
 */

g._copyFiles = function() {
  // 原样复制
  const files = [
    '.eslintrc.yml', '.jsbeautifyrc',
    '.travis.yml', 'test/mocha.opts',
    'LICENSE'
  ];

  for (let f of files) {
    const from = this.templatePath(f);
    const to = this.destinationPath(f);
    this.fs.copy(from, to);
  }

  // .gitignore 特殊
  // https://github.com/npm/npm/issues/3763
  this.fs.copy(
    this.templatePath('gitignore'),
    this.destinationPath('.gitignore')
  );
};

g._copyTpl = function() {
  const pkg = this.fs.readJSON(this.destinationPath('package.json'));

  _.each({
    'CHANGELOG.md': {
      currentDate: moment().format('YYYY-MM-DD')
    },
    'README.md': {
      packageName: pkg.name,
      packageLocalName: _.camelCase(pkg.name), // 变量名
      packageDescription: pkg.description // 描述
    }
  }, (v, f) => {
    const from = this.templatePath(f);
    const to = this.destinationPath(f);
    this.fs.copyTpl(from, to, v);
  });
};