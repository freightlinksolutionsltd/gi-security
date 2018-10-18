angular.module('gi.security').config ['$routeProvider', '$locationProvider'
, ($routeProvider, $locationProvider) ->
  $routeProvider
  .when '/login',
    controller: 'loginController'
    templateUrl: 'gi-login.html'
  .when '/user',
    controller: 'userController'
    templateUrl: 'gi-user.html'
  .when '/logout',
    controller: 'logoutController'
    templateUrl: 'gi-logout.html'
  .when '/roles',
    controller: 'roleController'
    templateUrl: 'gi-role.html'
  .when '/users',
    controller: 'usersController'
    templateUrl: 'gi-userManagement.html'
  .when '/permissions',
    controller: 'permissionController'
    templateUrl: 'gi-permissions.html'
]
