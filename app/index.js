'use strict';

/**
 * module dependencies
 */
var Base = require('yeoman-generator').Base;
var inherits = require('util').inherits;
var _ = require('lodash');

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
  Base.apply(this, arguments);

  this.fileMap = {
    hint: '.jshintrc',
    jshint: '.jshintrc',
    beautify: '.jsbeautifyrc',
    jsbeautify: '.jsbeautifyrc'
  };

  this.sourceRoot(__dirname + '/../');
  this.fileSrcMap = {
    '.jshintrc': this.templatePath('app/templates/.jshintrc'),
    '.jsbeautifyrc': this.templatePath('.jsbeautifyrc')
  };

  this.argument('file', {
    required: false,
    type: 'String',
    desc: '生成什么文件'
  });
}
inherits(Generator, Base);

/**
 * we starts here
 */
Generator.prototype.default = function() {
  var files = this
    ._getFiles()
    .filter(x => Boolean(x));

  files.forEach(item => {
    var src = this.fileSrcMap[item];
    var dest = this.destinationPath(item);
    this.fs.copy(src, dest);
  });
};

Generator.prototype._getFiles = function() {
  var files = _.values(this.fileMap);
  var empty = [];

  // all
  if (!this.file) {
    return files;
  }

  // .
  if (_.startsWith(this.file, '.')) {
    if (~files.indexOf(this.file)) {
      this.log(`file not found: ${ this.file }`);
      return empty;
    }
  }

  //
  var target = this.fileMap[this.file];
  if (!target) {
    this.log(`file not found: ${ this.file }`);
    return empty;
  }

  return [target];
};