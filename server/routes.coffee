configure = (app, rest) ->
  #user routes
  app.get '/api/user'
  , app.middleware.userAction, app.controllers.user.showMe

  app.put '/api/user'
  , app.middleware.userAction, app.controllers.user.updateMe

  app.del '/api/user'
  , app.middleware.userAction, app.controllers.user.destroyMe

  app.post '/api/user/register'
  , app.middleware.publicRegisterAction, app.controllers.user.create

  app.post '/api/user/apiSecret'
  , app.middleware.userAction, app.controllers.user.generateAPISecretForMe

  app.post '/api/user/resetPassword'
  , app.middleware.publicAction, app.controllers.user.resetPassword

  app.post '/api/user/getResetToken'
  , app.middleware.adminAction, app.controllers.user.getResetToken

  app.post '/api/user/verify'
  , app.middleware.userAction, app.controllers.user.verify

  app.post '/api/checkUserToken'
  , app.middleware.publicAction, app.controllers.user.checkResetToken

  rest.routeResource 'roles', app
  , app.middleware.userAction, app.controllers.role

  rest.routeResource 'users', app
  , app.middleware.adminAction, app.controllers.user

  rest.routeResource 'settings', app
  , app.middleware.publicReadAction, app.controllers.setting

  rest.routeResource 'activities', app
  , app.middleware.userAction, app.controllers.activity

  rest.routeResource 'categories', app
  , app.middleware.userAction, app.controllers.category

  rest.routeResource 'systems', app
  , app.middleware.sysAdminAction, app.controllers.system

  rest.routeResource 'environments', app
  , app.middleware.sysAdminAction, app.controllers.environment

  rest.routeResource 'files', app
  , app.middleware.userAction, app.controllers.file

  rest.routeResource 'permissions', app
  , app.middleware.adminAction, app.controllers.permission

exports.configure = configure
