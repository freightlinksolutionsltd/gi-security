angular.module('gi.security').provider 'Auth', () ->
  ###
  Holds all the requests which failed due to 401 response,
  so they can be re-requested in future, once login is completed.
  ###
  buffer = []

  ###
  Required by HTTP interceptor.
  Function is attached to provider to be invisible for
  regular users of this service.
  ###
  pushToBuffer = (config, deferred) ->
    buffer.push {
      config: config,
      deferred: deferred
    }

  get = ['$rootScope','$injector', '$q', '$filter', 'Role', 'Setting'
  , 'giGeo', 'giLog'
  , ($rootScope, $injector, $q, $filter, Role, Setting, Geo, Log) ->
    #initialized later because of circular dependency problem
    $http = undefined
    loginInfoDirty = true
    firstRequest = true
    me =
      user: null
      isAdmin: false
      isRestricted: true
      loggedIn: false
      countryCode: "N/A"

    retry = (config, deferred) ->
      $http = $http || $injector.get '$http'
      $http(config).then (response) ->
        deferred.resolve response

    retryAll = () ->
      retry(item.config, item.deferred) for item in buffer
      buffer = []

    getRoleName = (settings, settingName, defaultValue) ->
      roleSetting = $filter('filter')(settings, (setting) ->
        setting.key is settingName
      )
      settingName = defaultValue
      if roleSetting?.length > 0
        settingName = roleSetting[0].value
      settingName

    getCountry = (me) ->
      deferred = $q.defer()
      me.countryCode = "N/A"
      deferred.resolve me
      deferred.promise
      ###
      if me?.user?.countryCode?
        me.countryCode = me.user.countryCode
        deferred.resolve me
      else
        Geo.country().then (code) ->
          me.countryCode = code
          deferred.resolve me
        , (error) ->
          me.countryCode = "N/A"
          deferred.resolve me

      deferred.promise
      ###

    getLoggedInUser = ->
      deferred = $q.defer()

      wasLoggedIn = me.loggedIn
      wasLoggedOut = !me.loggedIn

      $http = $http || $injector.get '$http'
      $http.get('/api/user')
      .success (user) ->

        Setting.all().then (settings) ->
          admin = getRoleName settings,"AdminRoleName", "admin"
          restricted = getRoleName settings, "RestrictedRoleName", "restricted"
          sysAdmin = getRoleName settings, "SysAdminRoleName", "sysadmin"
          Role.isInRole(admin, user.roles).then (isAdmin) ->
            Role.isInRole(sysAdmin, user.roles).then (isSysAdmin) ->
              Role.isInRole(restricted, user.roles).then (isRestricted) ->
                loginInfoDirty = false
                me =
                  user: user
                  isAdmin: isAdmin
                  isSysAdmin: isSysAdmin
                  isRestricted: isRestricted
                  loggedIn: true


                getCountry(me).then () ->
                  if wasLoggedOut
                    fireLoginChangeEvent()
                  deferred.resolve me
      .error ->
        loginInfoDirty = false
        me =
          user: null
          isAdmin: false
          isRestricted: true
          loggedIn: false
        getCountry(me).then () ->
          if wasLoggedIn or firstRequest
            fireLoginChangeEvent()
          deferred.resolve me

      deferred.promise

    fireLoginChangeEvent = () ->
      firstRequest = false
      $rootScope.$broadcast 'event:auth-loginChange', me

    loginStatus = () ->
      if loginInfoDirty
        getLoggedInUser()
      else
        deferred = $q.defer()
        deferred.resolve me
        deferred.promise

    loginChanged = () ->
      loginInfoDirty = true
      loginStatus()

    me: loginStatus
    loginChanged: loginChanged
    loginConfirmed: () ->
      loginChanged()
      .then retryAll

    isAdmin: ->
      deferred = $q.defer()
      loginStatus().then ->
        deferred.resolve me.isAdmin
      deferred.promise

    logout: () ->
      deferred = $q.defer()
      $http = $http || $injector.get '$http'
      $http.get('/api/logout')
      .success ->
        ###
        loginChanged().then () ->
          deferred.resolve()
        ###
        me =
          user: null
          isAdmin: false
          isRestricted: true
          loggedIn: false
        fireLoginChangeEvent()
      deferred.promise
  ]

  $get: get
  pushToBuffer: pushToBuffer
