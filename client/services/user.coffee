angular.module('gi.security').provider 'User', () ->
  passwordRequirements = null

  @setPasswordRequirements = (reqs) ->
    passwordRequirements = reqs

  @$get = ['$q', '$http', 'Auth', 'giCrud', 'giLog'
  , ($q, $http, Auth, Crud, Log) ->
    crud = Crud.factory 'users'

    testPassword = (pwd) ->
      if passwordRequirements?
        return passwordRequirements.regexp.test pwd
      else
        return true

    register = (item) ->
      $http.post '/api/user/register', item

    login = (cred) ->
      deferred = $q.defer()
      $http.post('/api/login', cred).success( () ->
        Auth.loginConfirmed()
        deferred.resolve()
      ).error () ->
        Auth.loginChanged()
        deferred.reject()
      deferred.promise

    saveMe = (item) ->
      deferred = $q.defer()
      $http.put('/api/user', item).success( () ->
        deferred.resolve()
      ).error () ->
        deferred.reject
      deferred.promise

    isUsernameAvailable = (username) ->
      deferred = $q.defer()
      if username?
        $http.get('/api/user/isAvailable?username=' +
          encodeURIComponent(username)).success( (data) ->
            deferred.resolve data.available
        ).error (data) ->
          Log.warn("Is Username Available Errored")
          Log.warn(data)
          deferred.reject()
      else
        deferred.resolve false

      deferred.promise

    crud.register = register
    crud.login = login
    crud.saveMe = saveMe
    crud.testPassword = testPassword
    crud.isUsernameAvailable = isUsernameAvailable
    crud
  ]

  @
