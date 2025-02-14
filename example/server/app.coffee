express = require 'express'
gi = require '@freightlinksolutionsltd/gi-util'
security = require '../../server'

MongoStore = require('connect-mongo')(express)
mongoose = require 'mongoose'

path = require 'path'
dir =  path.normalize __dirname + "/../client"

app = express()

testConf =
  db:
    host: 'localhost'
    port: '27017'
    name: 'gi-security-test'
  security:
    sessionSecret: 'testSecret'

app.configure ->
  gi.common.dal.mongo.connect testConf.db
  app.use express.cookieParser()
  app.use express.bodyParser()

  sessionOpts =
    store: new MongoStore({db: testConf.db.name})
    secret: testConf.security.sessionSecret

  app.use express.session(sessionOpts)

  app.use express.static dir
  app.use '/bower_modules', express.static path.normalize(__dirname + '../../../bower_modules')
  app.use '/bin', express.static path.normalize(__dirname + '../../../bin')

  #configure all of the security settings

  app.models = {}
  app.controllers = {}
  app.middleware = {}

  #configure the module
  security.configure app, gi.common.dal.mongo, testConf.security
  app.use express.errorHandler({ dumpExceptions: true, showStack: true })

  app.get '*', app.middleware.publicAction, (req, res) ->
    res.sendfile "#{dir}/index.html"

exports = module.exports = app