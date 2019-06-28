# Changelog

## v0.16.0 2019-06-28

- 添加 `yo magicdawn:dot-files` 生成器

## v0.15.1 2019-06-27

- fix 没有拷贝 `prettier.config.js` 问题

## v0.15.0 2019-06-27

- 使用 `@magicdawn/prettier-config` & `@magicdawn/eslint-config`

## v0.14.0 2019-05-01

- back to mocha

## v0.13.0 2019-01-30

- mocha -> jest
- .travis.yml 去除 node v7.6.0
- `yo magicdawn` dep 更新

## v0.12.0 2019-01-15

- 为项目本身添加 husky/lint-staged/prettier
- 升级依赖
- 增加一个 `yo magicdawn:docs` generator, 生成 [docusaurus](https://docusaurus.io/docs/en/installation) 基本结构

## v0.11.1 2018-11-16

- fix dot files

## v0.11.0 2018-11-16

- 添加 yo magicdawn:add-config sub generator 可以添加 husky/lint-staged/prettier 开发依赖

## v0.10.1 2017-09-30

- publish problems

## v0.10.0 2017-09-30

- use prettier instead of jsbeautify
- update eslint and other deps
- update yeoman generator

## v0.9.1 2017-05-29

- add copy behavior for `test/.eslintrc.yml`

## v0.9.0 2017-05-29

- update deps
- rm co-mocha, just use async-await
- add test/.eslintrc.yml for async-await ES8
- add missing istanbul

## v0.8.0 2017-01-26

- totally rm `babel` / `.babelrc`
- update LICENSE file to year@2017

## v0.7.0 2016-12-24

- back to `co-mocha`, if use cnpm, run `npm i co-mocha` again, see https://github.com/blakeembrey/co-mocha/issues/24

## v0.6.1 2016-11-12

- add `test/.eslintrc.yml`

## v0.6.0 2016-11-12

- use no semi
- use `async/await` instead of `co-mocha`
- use `nyc` instead of `istanbul`

## v0.5.1 2016-09-03

- remove log

## v0.5.0 2016-09-03

- fix `repoName`, use `git-config` instead of `git-repo-name`

## v0.4.1 2016-09-02

- fix codecov badge link

## v0.4.0 2016-09-02

- update deps
- use codecov instead of coveralls
- modify .travis.yml to use codecov
- update .eslintrc.yml

## v0.3.4 2016-07-10

- update deps
- update template deps
- update template README badge, rm coveralls branch
- update license

## v0.3.2 / v0.3.3 2016-06-25

- try to get `.gitignore` published. At last I take the rename strategy,
  rename `gitignore` -> `.gitignore`

## v0.3.1 2016-05-17

- add `.npmignore` to include `.gitignore`

## v0.3.0 2016-05-17

- use for generate whole project

## v0.2.\* unknown date

- use for generate some files
