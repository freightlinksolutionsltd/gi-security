angular.module('gi.security').controller 'loginController'
, ['$scope', '$http', '$filter'
, 'Auth', 'Facebook', 'Setting'
, ( $scope, $http, $filter
, Auth, Facebook, Setting) ->
  #when we're in this controller we should keep testing to see
  #if the user has managed to login yet.
  $scope.loginStatus =
    failed: false

  $scope.verify = () ->
    #$scope.tokenMode = true
    creds =
      email: $scope.cred.username
      password: $scope.cred.password
    $http.post('/api/verifyUser', creds).success( (user) ->
      if user.valid
        if user.twoFactorEnabled
          $scope.tokenMode = true
        else
          $scope.login()
      else
        $scope.tokenMode = false
        $scope.loginStatus.failed = true
    ).error () ->
      $scope.tokenMode = false
      $scope.loginStatus.failed = true
    
  $scope.login = () ->
    $http.post('/api/login', $scope.cred).success( () ->
      Auth.loginConfirmed()
    ).error () ->
      $scope.tokenMode = false
      $scope.loginStatus.failed = true

  $scope.loginWithFacebook = () ->
    Facebook.login().then (loggedIn) ->
      if loggedIn
        Auth.loginConfirmed()

  $scope.dismissLoginAlert = () ->
    $scope.loginStatus.failed = false

  Setting.all().then (settings) ->
    allowFacebookLogin = $filter('filter')(settings, (setting) ->
      setting.key is 'loginWithFacebook'
    )
    if allowFacebookLogin?.length > 0
      $scope.allowFacebookLogin = allowFacebookLogin[0].value
    else
      $scope.allowFacebookLogin = false
      
    if $scope.allowFacebookLogin
      appId = $filter('filter')(settings, (setting) ->
        setting.key is 'facebookAppId'
      )
      if appId?.length > 0
        Facebook.init appId[0].value
      else
        console.log 'error initializing facebook login'

]