angular.module('gi.security').directive 'auth'
, ['$location', '$rootScope'
, ($location, $rootScope) ->
  link = (scope, elem, attrs) ->

    path = $location.path()

    scope.$on 'event:auth-loginRequired', () ->
      path = $location.path()
      $location.path '/login'

    scope.$on 'event:auth-loginConfirmed', () ->
      if path == '/logout' or path == '/login'
        alert 'auth.coffee redirect to /'
        path = '/'
      $location.path path

  link: link
  restrict: 'C'
]
