util = require 'util'
gint = require 'gint-util'
routes = require './routes'

configure = (app, mongoose, options) ->
  
  gint.common.extend app.models, require('./models')(mongoose, app.models.crud)
  gint.common.extend app.controllers, require('./controllers')(app)
  gint.common.extend app.middleware, require('./authentication')(app, options)
  
  routes.configure app

resetTestDb = (app, mongoose, callback) ->
  app.configure 'test', ->

    resetTestDb = (mongoose, callback) ->
      console.log 'dropping test accounts'
      mongoose.connection.collections['accounts']?.drop () ->
        console.log 'injecting test account'
        dummyAccount =
          name: 'Acme'
          host: 'localhost'
        
        models.accounts.create dummyAccount, (err, result) ->
          {}

      console.log 'dropping test users'
      mongoose.connection.collections['users']?.drop () ->
        console.log 'injecting test dummy admin user'
        dummyAdmin =
          email: 'dummyadmin@test.com'
          firstName: 'Dummy'
          lastName: 'Admin'
          password: 'password'

        alice =
          email: 'alice@test.com'
          firstName: 'Alice'
          lastName: 'Alison'
          password: 'password'

        models.users.create alice, (err, result) ->
          {}
          models.users.create dummyAdmin, (err, result) ->
            callback(models)

module.exports =
  configure: configure
  resetTestDb: resetTestDb