passport = require 'passport'
_ = require 'underscore'
async = require 'async'

permissionFilter = require './permissionFilter'

module.exports = (app) ->
  permissionsMiddleware = permissionFilter app

  passport.serializeUser (user, done) ->
    obj =
      _id: user._id
      systemId: user.systemId

    done null, obj

  passport.deserializeUser (obj, done) ->
    app.models.users.findById obj._id, obj.systemId, (err, user) ->
      if err
        done err, null
      else
        done null, user

  getSecuritySetting = (name, param, req, cb) ->
    app.models.settings.get name, req.systemId, req.environmentId
    , (err, result) ->
      if err
        cb() if cb
      else if result?.value
        cb(null, param) if cb
      else
        cb() if cb

  getSystemStrategies = (req, callback) ->
    async.parallel [
      (cb) ->
        getSecuritySetting 'loginWithFacebook', 'facebook', req, cb
      , (cb) ->
        getSecuritySetting 'loginWithBasic', 'Basic', req, cb
      , (cb) ->
        getSecuritySetting 'loginWithHmac', 'Hmac', req, cb
      , (cb) ->
        getSecuritySetting 'loginWithPlay', 'Play', req, cb
    ], (err, results) ->
      if err
        callback(err, null) if callback
      else
        filteredResults = _.filter results, (value) -> return value or false
        callback(err, filteredResults) if callback

  systemCheck = (req, res, next) ->
    #find environment by host
    if req?.hostname
      app.models.environments.forHost req.hostname, (err, result) -> #Changed 'req.host' to 'req.hostname' for express 4.x compatibility
        if err
          res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else if result
          req.systemId = result.systemId
          req.environmentId = result._id
          exports._getSystemStrategies req, (err, strategies) ->
            if strategies? and not err
              req.strategies = strategies
            exports._findUser req, res, next
        else
          res.status(404).json({message: 'environment not found'}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    else
      res.status(500).json({message: 'host not found on request object'}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  addExtraUserInfo = (req, res, next) ->
    if req.user.toObject?
      req.user = req.user.toObject()
    isAdmin req.user, (adminBool) ->
      req.user.isAdmin = adminBool?
      isSysAdmin req.user, (sysAdminBool) ->
        req.user.isSysAdmin = sysAdminBool?
        next()

  findUser = (req, res, next) ->
    if req.isAuthenticated()
      addExtraUserInfo(req, res, next)
    else
      exports._hmacAuth req, res, (err, user) =>
        if user and (not err)
          addExtraUserInfo(req, res, next)
        else
          exports._playAuth req, res, (err, user) ->
            if user and (not err)
              addExtraUserInfo(req, res, next)
            else
              exports._basicAuth req, res, (err, user) ->
                if user and (not err)
                  addExtraUserInfo(req, res, next)
                else
                  next()

  publicAction = (req, res, next) ->
    exports._systemCheck req, res, next

  publicReadAction = (req, res, next) ->
    systemCheck req, res, () ->
      if req.user?
        isAdmin req.user, (admin) ->
          if admin?
            next()
          else
            if req.route.method is 'get'
              #if we're not an admin, enforce public-read acl
              if not req.query?
                req.query = {}
              req.query.acl = 'public-read'
              next()
            else
              res.status(401).json({msg: 'not authorized'}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      else
        if req.route.method is 'get'
          #if we're not an admin, enforce public-read acl
          if not req.query?
            req.query = {}
          req.query.acl = 'public-read'
          next()
        else
          res.status(401).json({msg: 'not authorized'}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  publicRegisterAction = (req, res, next) ->
    systemCheck req, res, () ->
      getSecuritySetting 'allowPublicRegistration'
      , 'allowPublicRegistration', req, (err, setting) ->
        if setting
          next()
        else
          res.status(403).json({message: 'Public user registration is not enabled'}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  hmacAuth = (req, res, next) ->
    if _.indexOf(req.strategies, 'Hmac') is -1
      next 'Hmac strategy not supported', null
    else
      passport.authenticate('hmac', (err, user, info) ->
        if err
          next err, null
        else if not user
          next info, null
        else
          req.user = user
          next null, user
      )(req, res, next)

  basicAuth = (req, res, next) ->
    if _.indexOf(req.strategies, 'Basic') is -1
      next 'Basic strategy not supported', null
    else
      passport.authenticate('basic', (err, user, info) ->
        if err
          next err, null
        else if not user
          next info, null
        else
          req.user = user
          next null, user
      )(req, res, next)

  playAuth = (req, res, next) ->
    if _.indexOf(req.strategies, 'Play') is -1
      next 'Play strategy not supported', null
    else
      passport.authenticate('play', (err, user, info) ->
        if err
          next err, null
        else if not user
          next info, null
        else
          req.user = user
          next null, user
      )(req, res, next)

  userAction = (req, res, next) ->
    exports.publicAction req, res, () =>
      if req.user?
        permissionsMiddleware req, res, next
      else
        res.status(401).json({}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  adminAction = (req, res, next) ->
    userAction req, res, () ->
      isAdmin req.user, (ok) ->
        if ok
          next()
        else
          res.status(401).json({}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  sysAdminAction = (req, res, next) ->
    userAction req, res, () ->
      isSysAdmin req.user, (ok) ->
        if ok
          next()
        else
          res.status(401).json({}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
  
  mgrAction = (req, res, next) ->
    userAction req, res, () ->
      isInRole 'Manager', req.user, (inRole) ->
        if inRole
          next()
        else
          res.status(403).end()

  isInRole = (role, user, callback) ->
    result = false
    settingName = role + 'RoleName'

    app.models.settings.get settingName, user.systemId, (err, result) ->
      roleName = role
      if result?.value
        roleName = result.value
      app.models.roles.findOneBy 'name', roleName, user.systemId
      , (err, obj) ->
        if obj and not err
          _.each(user.roles, (role) ->
            if role.toString() is obj._id.toString()
              result = true
          )
          callback(result) if callback
        else
          callback(false) if callback

  isRestricted = (user, callback) ->
    isInRole 'Restricted', user, callback
    return

  isAdmin = (user, callback) ->
    isInRole 'Admin', user, (result) ->
      if result
        callback(result) if callback
      else
        isSysAdmin user, callback
    return

  isSysAdmin = (user, callback) ->
    isInRole 'SysAdmin', user, callback
    return

  logout = (req, res) ->
    req.logout()
    res.send 200

  #Configure Passport authentication strategies
  users = app.models.users
  basic = require('./basic')(users)
  facebook = require('./facebook')(users)
  require('./hmac')(users)
  require('./play')(users)

  app.use passport.initialize()
  app.use passport.session()
  #app.use app.router #Removed 'app.router' for express 4.x compatibility

  #Having fired up passport authentication
  #link in the authentication routes:

  app.get   '/api/logout', logout
  basic.routes app, publicAction
  facebook.routes app, publicAction

  exports =
  #Export the authentiaction action middleware
    publicAction: publicAction
    publicReadAction: publicReadAction
    userAction: userAction
    adminAction: adminAction
    sysAdminAction: sysAdminAction
    publicRegisterAction: publicRegisterAction
    mgrAction: mgrAction
    _getSystemStrategies: getSystemStrategies
    _systemCheck: systemCheck
    _hmacAuth: hmacAuth
    _basicAuth: basicAuth
    _playAuth: playAuth
    _findUser: findUser

  exports
