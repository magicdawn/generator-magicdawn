const yeoman = require('yeoman-environment')
const env = yeoman.createEnv()
const AppGenerator = require('../app/index')

describe('AppGenerator', function () {
  let g
  beforeEach((done) => {
    env.lookup(function () {
      g = env.create('magicdawn:app')
      done()
    })
  })

  it('#_utilGetViewBag', () => {
    const viewbag = g._utilGetViewBag()
    viewbag.should.be.ok()
  })
})
