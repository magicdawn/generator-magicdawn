'use strict';

/**
 * module dependencies
 */
const Base = require('yeoman-generator').Base;
const inherits = require('util').inherits;
const _ = require('lodash');

/**
 * Generator Class definition
 *
 * # create .gitignore / .jshintrc / .jsbeautifyrc
 * yo magicdawn
 *
 * # yo magicdawn <file>
 * yo magicdawn jshint
 */
module.exports = class Generator extends Base {
  constructor() {
    super();

    this.fileMap = {
      hint: '.jshintrc',
      jshint: '.jshintrc',
      beautify: '.jsbeautifyrc',
      jsbeautify: '.jsbeautifyrc'
    };

    this.argument('file', {
      required: false,
      type: 'String',
      desc: '生成什么文件'
    });

    this.sourceRoot(__dirname + '/../');
    this.fileSrcMap = {
      '.jshintrc': this.templatePath('app/templates/.jshintrc'),
      '.jsbeautifyrc': this.templatePath('.jsbeautifyrc')
    };
  }

  default () {
    const files = this
      ._getFiles()
      .filter(x => Boolean(x));

    files.forEach(item => {
      const src = this.fileSrcMap[item];
      const dest = this.destinationPath(item);
      this.fs.copy(src, dest);
    });
  }

  _getFiles() {
    const files = _.values(this.fileMap);
    const empty = [];

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
    const target = this.fileMap[this.file];
    if (!target) {
      this.log(`file not found: ${ this.file }`);
      return empty;
    }

    return [target];
  }
};