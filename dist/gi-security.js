angular.module('gi.security', ['ngResource', 'gi.util', 'gi.ui']);

angular.module('gi.security').config([
  '$routeProvider',
  '$locationProvider',
  function($routeProvider,
  $locationProvider) {
    return $routeProvider.when('/login',
  {
      controller: 'loginController',
      templateUrl: 'gi-login.html'
    //.when '/user',
    //  controller: 'userController'
    //  templateUrl: 'gi-user.html'
    }).when('/logout',
  {
      controller: 'logoutController',
      templateUrl: 'gi-logout.html'
    });
  }
]);

//.when '/roles',
//  controller: 'roleController'
//  templateUrl: 'gi-role.html'
//.when '/users',
//  controller: 'usersController'
//  templateUrl: 'gi-userManagement.html'
//.when '/permissions',
//  controller: 'permissionController'
//  templateUrl: 'gi-permissions.html'

angular.module('gi.security').directive('auth', [
  '$location',
  '$rootScope',
  function($location,
  $rootScope) {
    var link;
    link = function(scope,
  elem,
  attrs) {
      var path;
      path = $location.path();
      scope.$on('event:auth-loginRequired',
  function() {
        path = $location.path();
        return $location.path('/login');
      });
      return scope.$on('event:auth-loginConfirmed',
  function() {
        if (path === '/logout' || path === '/login') {
          alert('auth.coffee redirect to /');
          path = '/';
        }
        return $location.path(path);
      });
    };
    return {
      link: link,
      restrict: 'C'
    };
  }
]);

angular.module('gi.security').directive('giRolePicker', [
  '$filter',
  function($filter) {
    return {
      restrict: 'E',
      scope: {
        model: '='
      },
      templateUrl: 'gi-rolePicker.html',
      link: {
        pre: function($scope) {
          var refresh;
          $scope.my = {};
          refresh = function() {
            $scope.model.chosenItems = [];
            $scope.model.availableItems = [];
            return angular.forEach($scope.model.roles,
  function(role) {
              var found;
              found = false;
              angular.forEach($scope.model.chosen,
  function(memberId) {
                if (memberId.toString() === role._id.toString()) {
                  return found = true;
                }
              });
              if (found) {
                return $scope.model.chosenItems.push(role);
              } else {
                return $scope.model.availableItems.push(role);
              }
            });
          };
          $scope.$watch('model.roles',
  function(newVal,
  oldVal) {
            if (newVal != null) {
              return refresh();
            }
          });
          return $scope.$watch('model.item',
  function(newVal,
  oldVal) {
            if ((newVal != null) && newVal._id !== (oldVal != null ? oldVal._id : void 0)) {
              return refresh();
            }
          });
        }
      }
    };
  }
]);

angular.module('gi.security').directive('giPassword', [
  'giUser',
  function(User) {
    return {
      restrict: 'A',
      require: 'ngModel',
      compile: function(elem,
  attrs) {
        var linkFn;
        linkFn = function($scope,
  elem,
  attrs,
  controller) {
          var $viewValue,
  ngModelController;
          ngModelController = controller;
          $viewValue = function() {
            return ngModelController.$viewValue;
          };
          return ngModelController.$validators.giPassword = function(x) {
            return User.testPassword(x);
          };
        };
        //return the linking function
        return linkFn;
      }
    };
  }
]);

angular.module('gi.security').directive('permissionForm', [
  '$q',
  '$timeout',
  '$http',
  '$filter',
  'Resource',
  'giUser',
  'Permission',
  function($q,
  $timeout,
  $http,
  $filter,
  Resource,
  User,
  Permission) {
    return {
      restrict: 'E',
      templateUrl: 'gi-permissionForm.html',
      scope: {
        permission: '=',
        submit: '&',
        destroy: '&',
        submitText: '@'
      },
      link: function(scope,
  elm,
  attrs) {
        var getRelatedKeys,
  getResources,
  getSelectedKeys,
  getSelectedResourceType,
  getSelectedUser,
  getUsers,
  pluralise,
  refreshPermissionFields;
        scope.resourceTypes = [];
        scope.keys = [];
        scope.selectedKeys = [];
        scope.users = [];
        scope.showDelete = true;
        scope.showDeleteModal = false;
        scope.restrictions = Permission.restrictions;
        scope.$watch('permission',
  function(newVal,
  oldVal) {
          return refreshPermissionFields();
        });
        scope.$watch('selectedResourceType',
  function(newVal,
  oldVal) {
          if (newVal != null ? newVal.name : void 0) {
            scope.selectedKeys = [];
            return getRelatedKeys(newVal.name);
          }
        });
        pluralise = function(str) {
          var result,
  suffix;
          if (str != null) {
            result = str.toLowerCase();
            suffix = 'y';
            if (result.indexOf(suffix,
  result.length - suffix.length) !== -1) {
              result = result.substring(0,
  result.length - 1) + 'ies';
            } else {
              result += 's';
            }
            return result;
          } else {
            return str;
          }
        };
        getRelatedKeys = function(name) {
          var uri;
          uri = '/api/' + pluralise(name);
          return $http.get(uri).success(function(data) {
            scope.selectedKeys = [];
            scope.keys = data;
            angular.forEach(scope.keys,
  function(key) {
              return key.id = key._id;
            });
            return getSelectedKeys();
          });
        };
        scope.deletePermission = function() {
          scope.destroy({
            permission: scope.permission
          });
          return scope.showDeleteModal = false;
        };
        scope.confirmDelete = function() {
          return scope.showDeleteModal = true;
        };
        getUsers = function() {
          var deferred;
          deferred = $q.defer();
          User.all(function(users) {
            scope.users = users;
            angular.forEach(scope.users,
  function(user) {
              return user.id = user._id;
            });
            deferred.resolve();
          });
          return deferred.promise;
        };
        getResources = function() {
          var deferred;
          deferred = $q.defer();
          Resource.all().then(function(resources) {
            scope.resourceTypes = resources;
            angular.forEach(scope.resourceTypes,
  function(resource) {
              return resource.id = resource._id;
            });
            deferred.resolve();
          });
          return deferred.promise;
        };
        getSelectedResourceType = function() {
          scope.selectedResourceType = {};
          if (scope.permission) {
            if (scope.permission.resourceType) {
              return angular.forEach(scope.resourceTypes,
  function(resource) {
                if (resource.name === scope.permission.resourceType) {
                  return scope.selectedResourceType = resource;
                }
              });
            }
          }
        };
        getSelectedUser = function() {
          scope.selectedUser = {};
          if (scope.permission) {
            if (scope.permission.userId) {
              return angular.forEach(scope.users,
  function(user) {
                if (user._id === scope.permission.userId) {
                  return scope.selectedUser = user;
                }
              });
            }
          }
        };
        getSelectedKeys = function() {
          scope.selectedKeys = [];
          if (scope.permission && (scope.permission.keys != null)) {
            return scope.selectedKeys = $filter('filter')(scope.keys,
  function(key) {
              return scope.permission.keys.indexOf(key._id) !== -1;
            });
          }
        };
        refreshPermissionFields = function() {
          $timeout(getSelectedResourceType);
          $timeout(getSelectedUser);
          return $timeout(getSelectedKeys);
        };
        scope.save = function() {
          var key;
          if (scope.permission) {
            scope.permission.userId = scope.selectedUser._id;
            scope.permission.keys = (function() {
              var i,
  len,
  ref,
  results;
              ref = scope.selectedKeys;
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                results.push(key._id);
              }
              return results;
            })();
            scope.permission.resourceType = scope.selectedResourceType.name;
            return scope.submit({
              permission: scope.permission
            });
          }
        };
        return $q.all([getResources(),
  getUsers()]).then(function() {
          return refreshPermissionFields();
        });
      }
    };
  }
]);

angular.module('gi.security').directive('roleForm', function() {
  return {
    restrict: 'E',
    templateUrl: 'gi-roleForm.html',
    scope: {
      role: '=',
      submit: '&',
      destroy: '&',
      submitText: '@'
    },
    link: function(scope, elm, attrs) {
      scope.showDelete = true;
      scope.showDeleteModal = false;
      scope.deleteRole = function() {
        scope.destroy({
          role: scope.role
        });
        return scope.showDeleteModal = false;
      };
      return scope.confirmDelete = function() {
        return scope.showDeleteModal = true;
      };
    }
  };
});

var indexOf = [].indexOf;

angular.module('gi.security').directive('userForm', [
  'Role',
  function(Role) {
    return {
      restrict: 'E',
      templateUrl: 'gi-userForm.html',
      scope: {
        user: '=',
        submit: '&',
        destroy: '&',
        submitText: '@'
      },
      link: function(scope,
  elm,
  attrs) {
        var getRoles,
  refreshUserRoles;
        scope.showDelete = true;
        scope.showDeleteModal = false;
        scope.userRoles = [];
        scope.notUserRoles = [];
        scope.unsavedChanges = false;
        scope.$watch('user',
  function(newVal) {
          if (newVal) {
            scope.unsavedChanges = false;
            return refreshUserRoles();
          }
        });
        refreshUserRoles = function() {
          scope.userRoles = [];
          scope.notUserRoles = [];
          return angular.forEach(scope.roles,
  function(role) {
            var ref,
  ref1;
            if ((((ref = scope.user) != null ? ref.roles : void 0) != null) && (ref1 = role._id,
  indexOf.call(scope.user.roles,
  ref1) >= 0)) {
              return scope.userRoles.push(role);
            } else {
              return scope.notUserRoles.push(role);
            }
          });
        };
        getRoles = function() {
          return Role.all(function(roles) {
            scope.roles = roles;
            return refreshUserRoles();
          });
        };
        scope.checkForChanges = function() {
          return scope.unsavedChanges = true;
        };
        scope.deleteUser = function() {
          scope.destroy({
            user: scope.user
          });
          return scope.showDeleteModal = false;
        };
        scope.confirmDelete = function() {
          return scope.showDeleteModal = true;
        };
        scope.addToRole = function(role) {
          scope.unsavedChanges = true;
          scope.user.roles.push(role._id);
          return refreshUserRoles();
        };
        scope.removeFromRole = function(role) {
          scope.unsavedChanges = true;
          return angular.forEach(scope.user.roles,
  function(userRole,
  index) {
            if (userRole === role._id) {
              scope.user.roles.splice(index,
  1);
              return refreshUserRoles();
            }
          });
        };
        scope.save = function() {
          scope.unsavedChanges = false;
          return scope.submit({
            user: scope.user
          });
        };
        return getRoles();
      }
    };
  }
]);

angular.module('gi.security').directive('giUsername', [
  'giUser',
  '$q',
  '$parse',
  function(User,
  $q,
  $parse) {
    return {
      restrict: 'A',
      require: 'ngModel',
      compile: function(elem,
  attrs) {
        var linkFn;
        linkFn = function($scope,
  elem,
  attrs,
  controller) {
          var $viewValue,
  needToCheck,
  ngModelController,
  requiredGetter;
          ngModelController = controller;
          $viewValue = function() {
            return ngModelController.$viewValue;
          };
          requiredGetter = $parse(attrs.giUsername);
          needToCheck = function() {
            return (attrs.giUsername === "") || requiredGetter($scope);
          };
          $scope.$watch('item.register',
  function(newVal) {
            return ngModelController.$$parseAndValidate();
          });
          return ngModelController.$asyncValidators.giUsername = function(modelValue,
  viewValue) {
            var deferred;
            deferred = $q.defer();
            if (needToCheck()) {
              User.isUsernameAvailable(modelValue).then(function(valid) {
                if (valid) {
                  return deferred.resolve();
                } else {
                  return deferred.reject();
                }
              });
            } else {
              deferred.resolve();
            }
            return deferred.promise;
          };
        };
        return linkFn;
      }
    };
  }
]);

angular.module('gi.security').filter('permissionRestriction', [
  'Permission',
  function(Permission) {
    return function(permission) {
      var result;
      result = "N/A";
      if (permission && permission.restriction) {
        angular.forEach(Permission.restrictions,
  function(res) {
          if (res.value === permission.restriction) {
            return result = res.name;
          }
        });
      }
      return result;
    };
  }
]);

angular.module('gi.security').run(['$templateCache', function($templateCache) {$templateCache.put('gi-login.html','<!--\n<div class="hero-unit">\n  <div class="alert alert-danger" ng-if="loginStatus.failed">\n    <button type="button" \n            class="close dismissLogin" \n            ng-click="dismissLoginAlert()">&times;</button>\n    <strong>Login Failed!</strong>: Username / Password was incorrect\n  </div>\n  <h3>Please Login</h3>\n  <div  class="well form-inline">\n    <input  type="text" \n            ng-model="cred.username" \n            class="input" \n            placeholder="Email">\n    <input  type="password" \n            ng-model="cred.password" \n            class="input-small" \n            placeholder="Password">\n    <button ng-disabled="!cred.username || !cred.password" \n            class="btn btn-primary basicLogin" \n            ng-click="login()">Login</button>\n  </div>\n  <div class="well form loginWithFacebook" ng-if="allowFacebookLogin">\n    <button ng-click="loginWithFacebook()"><img src="/img/login-with-facebook.png" width="154" height="22"></button> \n  </div>\n</div>\n-->\n<form name="loginForm">\n  <br>\n  <div class="col-md-4"></div>\n  <div class="col-md-4">\n    <div class="alert alert-danger" ng-if="loginStatus.failed">\n      <button type="button" class="close dismissLogin" ng-click="dismissLoginAlert()">&times;</button>\n      <strong>Login Failed!</strong>: Username / Password was incorrect\n    </div>\n    <div class="panel panel-default">\n      <div class="panel-heading"><h3>Login to F2F2</h3></div>\n      <div class="panel-body" ng-show="!tokenMode">\n        <div class="form-group">\n          <label class="control-label">Username/Email</label>\n          <input type="text" class="form-control" ng-model="cred.username">\n        </div>\n        <div class="form-group">\n          <label class="control-label">Password</label>\n          <input type="password" class="form-control" ng-model="cred.password">\n        </div>\n      </div>\n      <div class="panel-footer" ng-show="!tokenMode">\n        <button class="btn btn-primary" ng-click="verify()">Login</button>\n      </div>\n\n      <div class="panel-body" ng-show="tokenMode">\n        <div class="form-group">\n          <label class="control-label">2 Factor Code</label>\n          <input type="text" class="form-control" ng-model="cred.token">\n        </div>\n      </div>\n      <div class="panel-footer" ng-show="tokenMode">\n        <button class="btn btn-primary" ng-click="login()">Login</button>\n      </div>\n    </div>\n  </div>\n  <div class="col-md-4"></div>\n</form>');
$templateCache.put('gi-logout.html','<div class="hero-unit">\n  <h3>You have been securely logged out</h3>\n  <a href="/login" class="btn btn-primary">Log Back In</a>\n</div>');
$templateCache.put('gi-permissionForm.html','<div class="well form">\n  <div class="form-group"\n    <label>User:</label>\n    <gi-select2 options="users" selection="selectedUser" field="firstName" style="width:100%"/>\n  </div>\n  <div class="form-group">\n    <label>Resource Type:</label>\n    <gi-select2 options="resourceTypes" selection="selectedResourceType" field="name" style="width:100%"/>\n  </div>\n  <div class="form-group">\n    <label>Restriction:</label>\n    <select class="form-control" \n            ng-model="permission.restriction" \n            ng-options="r.value as r.name for r in restrictions"></select>\n  </div>\n  <div class="form-group">\n    <label>{{permission.resourceType.name}}</label>\n    <label>Keys:</label>\n    <gi-select2 tags custom options="keys" selection="selectedKeys" field="name" style="width:100%"/>\n  </div>\n  <button class="btn btn-primary" ng-click="save()">\n    {{submitText}}\n  </button>\n  <button ng-show="showDelete" class="btn btn-danger" ng-click="confirmDelete()" >\n    <span class="glyphicon glyphicon-trash white"></span>\n  </button>\n\n</div>\n<gi-modal visible="showDeleteModal"\n        title="Please Confirm Delete Action">\n  <div class="body">\n    <p>Delete this permission - are you sure?</p>\n    <p>Please continue only if you are 100% \n      you understand what you\'re deleting.  \n      There is no way to retrieve the data after this point.</p>\n  </div>\n  <div class="footer">\n    <button ng-click="deletePermission()"\n            class="btn btn-danger">\n      Delete It!\n    </button>\n  </div>\n</gi-modal>');
$templateCache.put('gi-permissions.html','<div class="container">\n  <div class="row">\n    <div class="col-md-6">\n      <gi-datatable items="permissions" \n                 selected-items="selectedPermissions"\n                 options="options" >\n        <div class="header">\n          <label>User</label>\n          <label>Resource</label>\n          <label>Restriction</label>\n        </div>\n        <div class="body">\n          <label class="filter">permissionUser</label>\n          <label class="property">resourceType</label>\n          <label class="filter">permissionRestriction</label>\n        </div>\n      </gi-datatable>\n    </div>\n    <div class="col-md-6">\n      <permission-form permission="permission" submit-text="{{submitText}}" submit="savePermission(permission)"></permission-form>\n    </div>\n  </div>\n</div>');
$templateCache.put('gi-role.html','<div class="container">\n  <div class="row">\n    <div class="col-md-2">\n      <ul class="nav nav-pills nav-stacked">\n        <li ng-class="{active: currentView == \'list\' }">\n          <a ng-click="show(\'list\')">All Roles</a>\n        </li>\n        <li ng-class="{active: currentView == \'form\' }">\n          <a ng-click="show(\'form\')">New Role</a>\n        </li>\n      </ul>\n    </div>\n    <div class="col-md-10">\n      <div>\n        <div ng-show="selectedRole" >\n          <div class="col-md-6">\n            <h4>Roles</h4>\n            <ul class="nav nav-pills nav-stacked" ng-repeat="role in roles" >\n              <li ng-class="{active: role.name == selectedRole.name}" >\n                <a \n                 ng-click="selectRole(role)">{{role.name}}</a>\n              </li>\n            </ul>\n            <div>\n              <h4>Role Members</h4>\n              <div ng-repeat="user in roleUsers">{{user.firstName}}</div>\n            </div>\n          </div>\n          <div ng-show="currentView == \'list\'" class="col-md-6">\n            <h4>Role Details</h4>\n            <role-form role="selectedRole" title="Role Details" submit-text="Update Role" submit="saveRole(role)" destroy="deleteRole(role)"></role-form>\n\n          </div>\n          <div ng-show="currentView == \'form\'" class="col-md-6">\n            <role-form role="newRole" title="Role Details" submit-text="Create Role" submit="saveRole(role)"></role-form>\n          </div>\n        </div>      \n        <div ng-hide="selectedRole">\n          <div class="col-md-6">\n            <h4>Roles</h4>\n            No Roles found for this organisation.\n            You can create one by entering the details on this page.\n          </div>\n          <div class="col-md-6">\n            <role-form title="New Role" role="newRole" submit-text="Create Role" submit="saveRole(role)"></role-form>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>');
$templateCache.put('gi-roleForm.html','<div class="well form" role="form">\n  <input type="hidden" id="hiddenSiteId" ng-model="role._id"/>\n  <div class="form-group">\n    <label  >Name:</label>\n    <input  type="text" class="form-control" \n            name="name" ng-model="role.name"/>\n  </div>\n  <button class="btn btn-primary" \n            ng-click="submit({role: role})">\n      {{submitText}}\n  </button>\n  <button ng-show="showDelete" \n          class="btn btn-danger" \n          ng-click="confirmDelete()" >\n    <span class="glyphicon glyphicon-trash white"></span>\n  </button>\n</div>\n<gi-modal visible="showDeleteModal"\n        title="Please Confirm Delete Action">\n  <div class="body">\n    <p>Delete a role - are you sure?</p>\n    <p>Please continue only if you are 100% \n      you understand what you\'re deleting.  \n      There is no way to retrieve the data after this point.</p>\n  </div>\n  <div class="footer">\n    <button ng-click="deleteRole()"\n            class="btn btn-danger">\n      Delete It!\n    </button>\n  </div>\n</gi-modal>');
$templateCache.put('gi-rolePicker.html','<div class="row">\n  <div id="board">\n    <div id="columns" >\n      <div class="column col-md-6">\n        <div class="columnHeader">\n          <span>Available</span>\n        </div>\n        <ul class="cards card-list" as-sortable\n        ng-model="model.availableItems">\n          <li as-sortable-item class="card"\n          ng-repeat="item in model.availableItems">\n            <div as-sortable-item-handle>{{item.name}}</div>\n          </li>\n        </ul>\n      </div>\n      <div class="column col-md-6">\n        <div class="columnHeader">\n          <span>Selected</span>\n        </div>\n        <ul class="cards card-list" as-sortable="dragControlListeners"\n        ng-model="model.chosenItems">\n          <li as-sortable-item class="card"\n          ng-repeat="item in model.chosenItems">\n            <div as-sortable-item-handle>{{item.name}}</div>\n          </li>\n        </ul>\n      </div>\n    </div>\n  </div>\n</div>\n');
$templateCache.put('gi-user.html','<div class="form" role="form">\n  <div class="form-group">\n    <label name="userName">Name: {{user.firstName}} {{ user.lastName }}</label>\n  </div>\n  <div class="form-group">\n    <label name="userId">Id: {{user._id}}</label>\n  </div>\n  <div class="form-group">\n    <label name="apiSecret">API Secret: {{user.apiSecret}}</label>\n  </div>\n  <div class="form-group">\n    <button class="btn btn-primary" ng-click="resetApi()">Create API Secret</button>\n  </div>\n</div>');
$templateCache.put('gi-userForm.html','<div class="well form">\n  <h4>Profile</h4>\n  <div class="form-group">\n    <label>First Name:</label>\n    <input  type="text" name="name" class="form-control" \n            ng-model="user.firstName" ng-change="checkForChanges()"/>\n  </div>\n  <div class="form-group">\n    <label>Surname:</label>\n    <input  type="text" name="lastName" class="form-control" \n            ng-model="user.lastName" ng-change="checkForChanges()"/>\n  </div>\n  <div class="form-group">\n    <label>Email:</label>\n    <input  type="text" name="email" class="form-control" \n            ng-model="user.email" ng-change="checkForChanges()" />\n  </div>\n  <div class="form-group">\n    <label>Password:</label>\n    <input  type="password" name="password" class="form-control" \n            ng-model="user.password" ng-change="checkForChanges()" />\n  </div>\n  <h4>Roles</h4>\n  <div class="form-group">\n    <h4>Assigned Roles</h4>\n    <div class="col-md-12" ng-repeat="role in userRoles">\n      <label>{{role.name}}</label>\n      <button class="btn btn-danger"\n              ng-click="removeFromRole(role)" >\n        <span class="glyphicon glyphicon-trash white"></span>\n      </button>\n    </div>\n    <div ng-if="notUserRoles.length > 0">\n      <h4>Available Roles</h4>\n      <select class="form-control"\n              ng-model="selectedRole" \n              ng-options="role.name for role in notUserRoles">\n      </select>\n      <button ng-click="addToRole(selectedRole)" \n              class="btn btn-primary">Assign</button>\n    </div>\n  </div>\n  <div class="form-group">\n    <button ng-disabled="!unsavedChanges" \n            class="btn btn-primary" \n            ng-click="save()">\n        {{submitText}}\n    </button>\n    <button ng-show="showDelete" \n            class="btn btn-danger" \n            ng-click="confirmDelete()" >\n      <span class="glyphicon glyphicon-trash white"></span>\n    </button>\n  </div>\n</div>\n\n<gi-modal visible="showDeleteModal"\n        title="Please Confirm Delete Action">\n  <div class="body">\n    <p>Delete a user - are you sure?</p>\n    <p>Please continue only if you are 100% \n      you understand what you\'re deleting.  \n      There is no way to retrieve the data after this point.</p>\n  </div>\n  <div class="footer">\n    <button ng-click="deleteUser()" \\\n            class="btn btn-danger">\n      Delete It!\n    </button>\n  </div>\n</gi-modal>');
$templateCache.put('gi-userManagement.html','<div class="container">\n  <div class="row">\n    <div class="col-md-2">\n      <ul class="nav nav-pills nav-stacked">\n        <li ng-class="{active: currentView == \'list\' }">\n          <a ng-click="show(\'list\')">All Users</a>\n        </li>\n        <li ng-class="{active: currentView == \'form\' }">\n          <a ng-click="show(\'form\')">New User</a>\n        </li>\n      </ul>\n    </div>\n    <div class="col-md-10">\n      <div>\n        <div ng-show="selectedUser" >\n          <div class="col-md-4">\n            <h4>Users</h4>\n            <ul class="nav nav-pills nav-stacked" ng-repeat="user in users" >\n              <li ng-class="{active: user._id == selectedUser._id}" >\n                <a \n                 ng-click="selectUser(user)">{{user.firstName}}</a>\n              </li>\n            </ul>\n          </div>\n          <div ng-show="currentView == \'list\'" class="col-md-8">\n            <user-form user="selectedUser" title="User Details" submit-text="Save Changes" submit="saveUser(user)" destroy="deleteUser(user)"></user-form>\n          </div>\n          <div ng-show="currentView == \'form\'" class="col-md-8">\n            <user-form title="New User" user="newUser" submit-text="Create User" submit="saveUser(user)"></user-form>\n          </div>\n        </div>      \n        <div ng-hide="selectedUser">\n          <div class="col-md-4">\n            <h4>Users</h4>\n            No Users found for this organisation.\n            You can create one by entering the details on this page.\n          </div>\n          <div class="col-md-4">\n            <h4>Create New User</h4>\n            <user-form title="New User" user="newUser" submit-text="Create User" submit="saveUser(user)"></user-form>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>');}]);
angular.module('gi.security').filter('permissionUser', [
  '$filter',
  function($filter) {
    return function(permission) {
      var result;
      result = 'Unknown';
      if (permission && permission.userId) {
        result = $filter('userName')(permission.userId);
      }
      return result;
    };
  }
]);

angular.module('gi.security').filter('userName', [
  'giUser',
  function(User) {
    return function(id) {
      var result,
  user;
      result = 'Missing User Id';
      if (id) {
        user = User.getSync(id);
        if (user) {
          result = user.firstName;
        } else {
          result = id;
        }
      }
      return result;
    };
  }
]);

angular.module('gi.security').config([
  '$httpProvider',
  'AuthProvider',
  function($httpProvider,
  AuthProvider) {
    return $httpProvider.interceptors.push([
      '$rootScope',
      '$q',
      function($rootScope,
      $q) {
        return {
          responseError: function(rejection) {
            var deferred;
            if ((rejection.config.url !== '/api/login') && (rejection.config.url !== '/api/user') && (rejection.status === 401)) {
              deferred = $q.defer();
              AuthProvider.pushToBuffer(rejection.config,
      deferred);
              $rootScope.$broadcast('event:auth-loginRequired');
              return deferred.promise;
            } else {
              return $q.reject(rejection);
            }
          }
        };
      }
    ]);
  }
]);

angular.module('gi.security').controller('loginController', [
  '$scope',
  '$http',
  '$filter',
  'Auth',
  'Facebook',
  'Setting',
  function($scope,
  $http,
  $filter,
  Auth,
  Facebook,
  Setting) {
    //when we're in this controller we should keep testing to see
    //if the user has managed to login yet.
    $scope.loginStatus = {
      failed: false
    };
    $scope.verify = function() {
      var creds;
      //$scope.tokenMode = true
      creds = {
        email: $scope.cred.username,
        password: $scope.cred.password
      };
      return $http.post('/api/verifyUser',
  creds).success(function(user) {
        if (user.valid) {
          if (user.twoFactorEnabled) {
            return $scope.tokenMode = true;
          } else {
            return $scope.login();
          }
        } else {
          $scope.tokenMode = false;
          return $scope.loginStatus.failed = true;
        }
      }).error(function() {
        $scope.tokenMode = false;
        return $scope.loginStatus.failed = true;
      });
    };
    $scope.login = function() {
      return $http.post('/api/login',
  $scope.cred).success(function() {
        return Auth.loginConfirmed();
      }).error(function() {
        $scope.tokenMode = false;
        return $scope.loginStatus.failed = true;
      });
    };
    $scope.loginWithFacebook = function() {
      return Facebook.login().then(function(loggedIn) {
        if (loggedIn) {
          return Auth.loginConfirmed();
        }
      });
    };
    $scope.dismissLoginAlert = function() {
      return $scope.loginStatus.failed = false;
    };
    return Setting.all().then(function(settings) {
      var allowFacebookLogin,
  appId;
      allowFacebookLogin = $filter('filter')(settings,
  function(setting) {
        return setting.key === 'loginWithFacebook';
      });
      if ((allowFacebookLogin != null ? allowFacebookLogin.length : void 0) > 0) {
        $scope.allowFacebookLogin = allowFacebookLogin[0].value;
      } else {
        $scope.allowFacebookLogin = false;
      }
      if ($scope.allowFacebookLogin) {
        appId = $filter('filter')(settings,
  function(setting) {
          return setting.key === 'facebookAppId';
        });
        if ((appId != null ? appId.length : void 0) > 0) {
          return Facebook.init(appId[0].value);
        } else {
          return console.log('error initializing facebook login');
        }
      }
    });
  }
]);

angular.module('gi.security').controller('logoutController', [
  'Auth',
  function(Auth) {
    return Auth.logout();
  }
]);

angular.module('gi.security').controller('permissionController', [
  '$scope',
  '$location',
  'Resource',
  'Permission',
  'Auth',
  function($scope,
  $location,
  Resource,
  Permission,
  Auth) {
    Resource.all().then(function(rts) {
      console.log('rts');
      console.log(rts);
      return $scope.resourceTypes = rts;
    });
    $scope.selectedPermissions = [];
    $scope.options = {
      customSearch: false,
      customSort: false,
      searchProperties: ['resourceType'],
      searchFilters: ['permissionUser',
  'permissionRestriction'],
      displayCounts: true,
      columns: 3
    };
    $scope.savePermission = function(permission) {
      return Permission.save(permission);
    };
    return Auth.isAdmin().then(function(isAdmin) {
      if (isAdmin) {
        Permission.all().then(function(permissions) {
          return $scope.permissions = permissions;
        });
        return $scope.$watch('selectedPermissions[0]',
  function(newVal,
  oldVal) {
          if (newVal) {
            $scope.permission = newVal;
            return $scope.submitText = "Update Permission";
          } else {
            $scope.permission = {};
            return $scope.submitText = "Add Permission";
          }
        });
      } else {
        return $location.path('/login');
      }
    });
  }
]);

var indexOf = [].indexOf;

angular.module('gi.security').controller('roleController', [
  '$scope',
  '$location',
  'Role',
  'User',
  'Auth',
  function($scope,
  $location,
  Role,
  User,
  Auth) {
    var refreshRoleUsers,
  reset;
    $scope.roles = [];
    reset = function() {
      $scope.newRole = Role.create();
      return $scope.getRoles();
    };
    refreshRoleUsers = function(role) {
      $scope.roleUsers = [];
      if ((role != null ? role._id : void 0) != null) {
        return angular.forEach($scope.users,
  function(user) {
          var ref;
          if (ref = role._id,
  indexOf.call(user.roles,
  ref) >= 0) {
            return $scope.roleUsers.push(user);
          }
        });
      }
    };
    $scope.saveRole = function(role,
  callback) {
      return Role.save(role,
  function() {
        reset();
        if (callback) {
          return callback();
        }
      });
    };
    $scope.getRoles = function() {
      return Role.query(function(roles) {
        $scope.roles = roles;
        if (roles.length > 0) {
          $scope.selectedRole = roles[0];
          return refreshRoleUsers(roles[0]);
        }
      });
    };
    $scope.selectRole = function(role) {
      $scope.selectedRole = role;
      return refreshRoleUsers(role);
    };
    $scope.deleteRole = function(role) {
      return Role.destroy(role._id,
  function() {
        return $scope.getRoles();
      });
    };
    $scope.show = function(selector) {
      return $scope.currentView = selector;
    };
    return Auth.isAdmin().then(function(isAdmin) {
      if (isAdmin) {
        User.query(function(results) {
          $scope.users = results;
          return refreshRoleUsers($scope.selectedRole);
        });
        $scope.show('list');
        return reset();
      } else {
        console.log('redirecting to login');
        return $location.path('/login');
      }
    });
  }
]);

angular.module('gi.security').controller('userController', [
  '$scope',
  'UserAccount',
  function($scope,
  UserAccount) {
    $scope.deleteUser = function(id) {
      return UserAccount.delete();
    };
    $scope.resetApi = function() {
      return UserAccount.resetAPISecret().then(function() {
        return $scope.user = UserAccount.get();
      });
    };
    return $scope.user = UserAccount.get();
  }
]);

angular.module('gi.security').controller('usersController', [
  '$scope',
  '$location',
  'giUser',
  'Auth',
  function($scope,
  $location,
  User,
  Auth) {
    $scope.newUser = {};
    $scope.currentView = 'list';
    $scope.getData = function() {
      return User.query(function(results) {
        $scope.users = results;
        return $scope.selectedUser = $scope.users[0];
      });
    };
    $scope.deleteUser = function(id) {
      return User.delete({
        id: id
      },
  function() {
        return $scope.getData();
      });
    };
    $scope.saveUser = function(user) {
      return User.save(user,
  function() {
        return $scope.getData();
      });
    };
    $scope.getUsers = function() {
      return $scope.users = User.query();
    };
    $scope.deleteUser = function(id) {
      return User.delete({
        id: id
      },
  function() {
        return $scope.getUsers();
      });
    };
    $scope.selectUser = function(user) {
      return $scope.selectedUser = user;
    };
    $scope.show = function(view) {
      return $scope.currentView = view;
    };
    return Auth.isAdmin().then(function(isAdmin) {
      if (isAdmin) {
        return $scope.getData();
      } else {
        return $location.path('/login');
      }
    });
  }
]);

angular.module('gi.security').provider('Auth', function() {
  /*
  Holds all the requests which failed due to 401 response,
  so they can be re-requested in future, once login is completed.
  */
  /*
  Required by HTTP interceptor.
  Function is attached to provider to be invisible for
  regular users of this service.
  */
  var buffer, get, pushToBuffer;
  buffer = [];
  pushToBuffer = function(config, deferred) {
    return buffer.push({
      config: config,
      deferred: deferred
    });
  };
  get = [
    '$rootScope',
    '$injector',
    '$q',
    '$filter',
    'Role',
    'Setting',
    'giGeo',
    'giLog',
    function($rootScope,
    $injector,
    $q,
    $filter,
    Role,
    Setting,
    Geo,
    Log) {
      var $http,
    fireLoginChangeEvent,
    firstRequest,
    getCountry,
    /*
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
    */
    getLoggedInUser,
    getRoleName,
    loginChanged,
    loginInfoDirty,
    loginStatus,
    me,
    retry,
    retryAll;
      //initialized later because of circular dependency problem
      $http = void 0;
      loginInfoDirty = true;
      firstRequest = true;
      me = {
        user: null,
        isAdmin: false,
        isRestricted: true,
        loggedIn: false,
        countryCode: "N/A"
      };
      retry = function(config,
    deferred) {
        $http = $http || $injector.get('$http');
        return $http(config).then(function(response) {
          return deferred.resolve(response);
        });
      };
      retryAll = function() {
        var i,
    item,
    len;
        for (i = 0, len = buffer.length; i < len; i++) {
          item = buffer[i];
          retry(item.config,
    item.deferred);
        }
        return buffer = [];
      };
      getRoleName = function(settings,
    settingName,
    defaultValue) {
        var roleSetting;
        roleSetting = $filter('filter')(settings,
    function(setting) {
          return setting.key === settingName;
        });
        settingName = defaultValue;
        if ((roleSetting != null ? roleSetting.length : void 0) > 0) {
          settingName = roleSetting[0].value;
        }
        return settingName;
      };
      getCountry = function(me) {
        var deferred;
        deferred = $q.defer();
        me.countryCode = "N/A";
        deferred.resolve(me);
        return deferred.promise;
      };
      getLoggedInUser = function() {
        var deferred,
    wasLoggedIn,
    wasLoggedOut;
        deferred = $q.defer();
        wasLoggedIn = me.loggedIn;
        wasLoggedOut = !me.loggedIn;
        $http = $http || $injector.get('$http');
        $http.get('/api/user').success(function(user) {
          return Setting.all().then(function(settings) {
            var admin,
    restricted,
    sysAdmin;
            admin = getRoleName(settings,
    "AdminRoleName",
    "admin");
            restricted = getRoleName(settings,
    "RestrictedRoleName",
    "restricted");
            sysAdmin = getRoleName(settings,
    "SysAdminRoleName",
    "sysadmin");
            return Role.isInRole(admin,
    user.roles).then(function(isAdmin) {
              return Role.isInRole(sysAdmin,
    user.roles).then(function(isSysAdmin) {
                return Role.isInRole(restricted,
    user.roles).then(function(isRestricted) {
                  loginInfoDirty = false;
                  me = {
                    user: user,
                    isAdmin: isAdmin,
                    isSysAdmin: isSysAdmin,
                    isRestricted: isRestricted,
                    loggedIn: true
                  };
                  return getCountry(me).then(function() {
                    if (wasLoggedOut) {
                      fireLoginChangeEvent();
                    }
                    return deferred.resolve(me);
                  });
                });
              });
            });
          });
        }).error(function() {
          loginInfoDirty = false;
          me = {
            user: null,
            isAdmin: false,
            isRestricted: true,
            loggedIn: false
          };
          return getCountry(me).then(function() {
            if (wasLoggedIn || firstRequest) {
              fireLoginChangeEvent();
            }
            return deferred.resolve(me);
          });
        });
        return deferred.promise;
      };
      fireLoginChangeEvent = function() {
        firstRequest = false;
        return $rootScope.$broadcast('event:auth-loginChange',
    me);
      };
      loginStatus = function() {
        var deferred;
        if (loginInfoDirty) {
          return getLoggedInUser();
        } else {
          deferred = $q.defer();
          deferred.resolve(me);
          return deferred.promise;
        }
      };
      loginChanged = function() {
        loginInfoDirty = true;
        return loginStatus();
      };
      return {
        me: loginStatus,
        loginChanged: loginChanged,
        loginConfirmed: function() {
          return loginChanged().then(retryAll);
        },
        isAdmin: function() {
          var deferred;
          deferred = $q.defer();
          loginStatus().then(function() {
            return deferred.resolve(me.isAdmin);
          });
          return deferred.promise;
        },
        logout: function() {
          var deferred;
          deferred = $q.defer();
          $http = $http || $injector.get('$http');
          $http.get('/api/logout').success(function() {
            me = {
              user: null,
              isAdmin: false,
              isRestricted: true,
              loggedIn: false
            };
            return fireLoginChangeEvent();
          });
          return deferred.promise;
        }
      };
    }
  ];
  return {
    $get: get,
    pushToBuffer: pushToBuffer
  };
});

angular.module('gi.security').factory('Facebook', [
  '$rootScope',
  '$http',
  '$q',
  function($rootScope,
  $http,
  $q) {
    var _appId,
  _facebookResponse,
  attemptServerLogin,
  init,
  login,
  loginStatus;
    _appId = null;
    init = function(appId) {
      if (_appId == null) {
        FB.init({
          appId: appId,
          status: false // check login status
        });
        return _appId = appId;
      }
    };
    loginStatus = function() {
      var deferred;
      deferred = $q.defer();
      FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
          return deferred.resolve(true);
        } else {
          return deferred.resolve(false);
        }
      });
      return deferred.promise;
    };
    attemptServerLogin = function(response) {
      var deferred;
      deferred = $q.defer();
      $http.post('/api/loginviafacebook',
  response).success(function() {
        return deferred.resolve(true);
      }).error(function() {
        return deferred.resolve(false);
      });
      return deferred.promise;
    };
    _facebookResponse = null;
    login = function() {
      var deferred;
      deferred = $q.defer();
      if (_facebookResponse == null) {
        FB.login(function(response) {
          _facebookResponse = response;
          if (_facebookResponse.status === 'connected') {
            return $rootScope.$apply(function() {
              return attemptServerLogin(_facebookResponse).then(function(loggedInNow) {
                return deferred.resolve(loggedInNow);
              });
            });
          } else {
            return deferred.resolve(false);
          }
        });
      } else {
        attemptServerLogin(_facebookResponse).then(function(loggedInNow) {
          return deferred.resolve(loggedInNow);
        });
      }
      return deferred.promise;
    };
    return {
      init: init,
      loginStatus: loginStatus,
      login: login
    };
  }
]);

angular.module('gi.security').factory('Permission', [
  '$resource',
  'giCrud',
  function($resource,
  Crud) {
    var exports,
  restrictions;
    restrictions = [
      {
        name: 'Deny',
        value: 1
      },
      {
        name: 'Create',
        value: 2
      },
      {
        name: 'Read',
        value: 4
      },
      {
        name: 'Update',
        value: 8
      },
      {
        name: 'Destroy',
        value: 16
      }
    ];
    exports = Crud.factory('permissions');
    exports.restrictions = restrictions;
    return exports;
  }
]);

angular.module('gi.security').factory('Resource', [
  '$resource',
  'giCrud',
  function($resource,
  Crud) {
    return Crud.factory('resources');
  }
]);

angular.module('gi.security').factory('Role', [
  '$filter',
  '$q',
  'giCrud',
  function($filter,
  $q,
  Crud) {
    var crud,
  isInRole;
    crud = Crud.factory('roles');
    isInRole = function(name,
  roleIds) {
      var deferred;
      deferred = $q.defer();
      crud.all().then(function(roles) {
        var inRole,
  toCheck;
        inRole = false;
        toCheck = $filter('filter')(roles,
  function(role) {
          return role.name.toLowerCase() === name.toLowerCase();
        });
        angular.forEach(toCheck,
  function(role) {
          return angular.forEach(roleIds,
  function(id) {
            if (id === role._id) {
              return inRole = true;
            }
          });
        });
        return deferred.resolve(inRole);
      });
      return deferred.promise;
    };
    crud.isInRole = isInRole;
    return crud;
  }
]);

angular.module('gi.security').factory('Setting', [
  'giCrud',
  function(Crud) {
    return Crud.factory('settings');
  }
]);

angular.module('gi.security').provider('giUser', function() {
  var passwordRequirements;
  passwordRequirements = null;
  this.setPasswordRequirements = function(reqs) {
    return passwordRequirements = reqs;
  };
  this.$get = [
    '$q',
    '$http',
    'Auth',
    'giCrud',
    'giLog',
    function($q,
    $http,
    Auth,
    Crud,
    Log) {
      var crud,
    isUsernameAvailable,
    login,
    register,
    saveMe,
    testPassword;
      crud = Crud.factory('users');
      testPassword = function(pwd) {
        if (passwordRequirements != null) {
          return passwordRequirements.regexp.test(pwd);
        } else {
          return true;
        }
      };
      register = function(item) {
        return $http.post('/api/user/register',
    item);
      };
      login = function(cred) {
        var deferred;
        deferred = $q.defer();
        $http.post('/api/login',
    cred).success(function() {
          Auth.loginConfirmed();
          return deferred.resolve();
        }).error(function() {
          Auth.loginChanged();
          return deferred.reject();
        });
        return deferred.promise;
      };
      saveMe = function(item) {
        var deferred;
        deferred = $q.defer();
        $http.put('/api/user',
    item).success(function() {
          return deferred.resolve();
        }).error(function() {
          return deferred.reject;
        });
        return deferred.promise;
      };
      isUsernameAvailable = function(username) {
        var deferred;
        deferred = $q.defer();
        if (username != null) {
          $http.get('/api/user/isAvailable?username=' + encodeURIComponent(username)).success(function(data) {
            return deferred.resolve(data.available);
          }).error(function(data) {
            Log.warn("Is Username Available Errored");
            Log.warn(data);
            return deferred.reject();
          });
        } else {
          deferred.resolve(false);
        }
        return deferred.promise;
      };
      crud.register = register;
      crud.login = login;
      crud.saveMe = saveMe;
      crud.testPassword = testPassword;
      crud.isUsernameAvailable = isUsernameAvailable;
      return crud;
    }
  ];
  return this;
});

angular.module('gi.security').factory('UserAccount', [
  '$resource',
  '$rootScope',
  '$http',
  '$q',
  function($resource,
  $rootScope,
  $http,
  $q) {
    var getMe,
  methods,
  resetAPISecret,
  resource;
    methods = {
      query: {
        method: 'GET',
        params: {},
        isArray: true
      },
      resetApi: {
        method: 'PUT',
        params: {
          resetApi: true
        }
      }
    };
    resource = $resource('/api/user',
  {},
  methods);
    getMe = function() {
      var deferred;
      deferred = $q.defer();
      if (($rootScope.me != null) && ($rootScope.me._id != null)) {
        deferred.resolve($rootScope.me);
      } else {
        $http.get('/api/user').success(function(user) {
          return deferred.resolve(user);
        });
      }
      return deferred.promise;
    };
    resetAPISecret = function() {
      return getMe().then(function(me) {
        return $http.post('/api/user/apiSecret',
  {
          _id: me._id
        });
      });
    };
    return {
      get: resource.get,
      getMe: getMe,
      resetAPISecret: resetAPISecret
    };
  }
]);

var Strategy, crypto, passport, util;

passport = require('passport');

util = require('util');

crypto = require('crypto');

Strategy = function(options, verify) {
  if (typeof options === 'function') {
    verify = options;
    options = {};
  }
  if (!verify) {
    throw new Error('basic strategy requires a verify function');
  }
  this._userNameField = options.userNameField || 'username';
  this._passwordField = options.passwordField || 'password';
  this._tokenField = options.tokenField || 'token';
  passport.Strategy.call(this);
  this.name = 'basic';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
  return null;
};

// Inherit from `passport.Strategy`.
util.inherits(Strategy, passport.Strategy);

Strategy.prototype.authenticate = function(req, options) {
  var password, systemId, token, username, usernameAndPasswordPair, verified;
  //console.log("authentication/strategies/basic.coffee - Inside Strategy::authenticate()")
  options = options || {};
  username = req.body[this._userNameField] || void 0;
  password = req.body[this._passwordField] || void 0;
  token = req.body[this._tokenField] || void 0;
  systemId = req.systemId || void 0;
  //SR - now check for the existence of an "Authorization" header and, if found, resolve the username and password from that
  if (!username) {
    if (req.headers.authorization) {
      usernameAndPasswordPair = new Buffer(req.headers.authorization.split(" ")[1], 'base64').toString().split(":");
      username = usernameAndPasswordPair[0];
      password = usernameAndPasswordPair[1];
    }
  }
  if (!username || !password) {
    return this.fail({
      message: 'Credentials not found'
    });
  }
  verified = (err, user, info) => {
    if (err) {
      return this.error(err);
    } else if (!user) {
      return this.fail(info);
    } else {
      return this.success(user, info);
    }
  };
  if (this._passReqToCallback) {
    return this._verify(req, username, password, token, systemId, verified);
  } else {
    return this._verify(username, password, token, systemId, verified);
  }
};

// Expose `Strategy`.
exports.Strategy = Strategy;

var Strategy, passport, util;

passport = require('passport');

util = require('util');

Strategy = function(options, verify) {
  if (typeof options === 'function') {
    verify = options;
    options = {};
  }
  if (!verify) {
    throw new Error('facebook sdk authentication strategy ' + 'requires a verify function');
  }
  passport.Strategy.call(this);
  this.name = 'facebook-sdk';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
  return null;
};

// Inherit from `passport.Strategy`.
util.inherits(Strategy, passport.Strategy);

Strategy.prototype.authenticate = function(req, options) {
  var response, systemId, verified;
  verified = (err, user, info) => {
    if (err) {
      return this.error(err);
    } else if (!user) {
      return this.fail(info);
    } else {
      return this.success(user, info);
    }
  };
  options = options || {};
  response = req.body.authResponse;
  systemId = req.systemId;
  if (!response) {
    return this.fail({
      message: 'Missing facebook response'
    });
  }
  if (this._passReqToCallback) {
    return this._verify(req, response.userID, systemId, verified);
  } else {
    return this._verify(response.userID, systemId, verified);
  }
};

// Expose `Strategy`.
exports.Strategy = Strategy;

var Strategy, crypto, encodeHeaders, encodeProperty, hmac, moment, passport, stringToSign, uriEscape, util;

passport = require('passport');

util = require('util');

crypto = require('crypto');

moment = require('moment');

Strategy = function(options, verify) {
  if (typeof options === 'function') {
    verify = options;
    options = {};
  }
  if (!verify) {
    throw new Error('hmac authentication strategy requires a verify function');
  }
  this._accessKeyField = options.accessKeyField || 'access-key';
  this._signatureField = options.signatureField || 'signature';
  this._expiryDateField = options.expiryDateField || 'expiry-date';
  passport.Strategy.call(this);
  this.name = 'hmac';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
  return null;
};

// Inherit from `passport.Strategy`.
util.inherits(Strategy, passport.Strategy);

uriEscape = function(string) {
  var uri;
  uri = escape(string).replace(/\+/g, '%2B').replace(/\//g, '%2F');
  return uri = uri.replace(/%7E/g, '~').replace(/\=/g, '%3D');
};

encodeProperty = function(key, value) {
  return uriEscape(key) + '=' + uriEscape(value);
};

encodeHeaders = function(headers) {
  var result;
  result = "";
  if (headers['access-key']) {
    result += encodeProperty('access-key', headers['access-key']);
  }
  if (headers['expiry-date']) {
    result += '&' + encodeProperty('expiry-date', headers['expiry-date']);
  }
  return result;
};

stringToSign = function(req) {
  var parts;
  parts = [];
  parts.push(req.method);
  parts.push(req.headers.host);
  parts.push(req.path);
  parts.push(encodeHeaders(req.headers));
  return parts.join('\n');
};

hmac = function(key, string, digest, fn) {
  if (!digest) {
    digest = 'binary';
  }
  if (!fn) {
    fn = 'sha256';
  }
  return crypto.createHmac(fn, new Buffer(key, 'utf8')).update(string).digest(digest);
};

Strategy.prototype.authenticate = function(req, options) {
  var accessKey, expiryDate, reqSignature, systemId, verified;
  verified = (err, user, info) => {
    var verificationSecret, verificationSignature, verificationString;
    if (err) {
      return this.error(err);
    } else if (!user) {
      return this.fail(info);
    }
    //TODO: get secret from the user id
    verificationSecret = user.apiSecret;
    verificationString = stringToSign(req);
    if (verificationSecret == null) {
      return this.fail({
        message: 'User has not activiated API'
      });
    } else {
      verificationSignature = hmac(verificationSecret, verificationString, 'base64');
      if (reqSignature !== verificationSignature) {
        return this.fail({
          message: 'Signature Verification Failure'
        });
      } else {
        return this.success(user, info);
      }
    }
  };
  options = options || {};
  accessKey = req.headers[this._accessKeyField];
  reqSignature = req.headers[this._signatureField];
  expiryDate = moment(req.headers[this._expiryDateField]);
  systemId = req.systemId || void 0;
  if (!accessKey || !reqSignature) {
    return this.fail({
      message: 'Missing credentials'
    });
  }
  if (!expiryDate) {
    return this.fail({
      message: 'Missing expiry date'
    });
  }
  if (expiryDate < moment()) {
    return this.fail({
      message: 'Message has expired'
    });
  }
  if (expiryDate > moment().add('minutes', 2)) {
    return this.fail({
      message: 'expiry date too far in future'
    });
  }
  if (this._passReqToCallback) {
    return this._verify(req, accessKey, systemId, verified);
  } else {
    return this._verify(accessKey, systemId, verified);
  }
};

// Expose `Strategy`.
exports.Strategy = Strategy;

module.exports = {
  facebook: require('./facebook'),
  basic: require('./basic'),
  hmac: require('./hmac'),
  play: require('./play')
};

var Strategy, _, cache, http, moment, passport, util;

passport = require('passport');

util = require('util');

http = require('http');

_ = require('underscore');

moment = require('moment');

Strategy = function(options, verify) {
  if (typeof options === 'function') {
    verify = options;
    options = {};
  }
  if (!verify) {
    throw new Error('play strategy requires a verify function');
  }
  this._cookieField = options.cookieName || 'PLAY_SESSION';
  passport.Strategy.call(this);
  this.name = 'play';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
};

// Inherit from `passport.Strategy`.
util.inherits(Strategy, passport.Strategy);

cache = {};

Strategy.prototype.authenticate = function(req) {
  var cookies, isValidatedInCache, now, playCookie, playRequest, playRequestOptions, systemId, that, userId, verified;
  if (req.headers.cookie != null) {
    cookies = req.headers.cookie.split(';');
    playCookie = _.find(cookies, (cookie) => {
      return cookie.split('=')[0].trim() === this._cookieField;
    });
    if (playCookie != null) {
      userId = playCookie.split('-user_id%3A')[1];
      systemId = req.systemId;
      playRequestOptions = {
        host: req.hostname, //Changed 'req.host' to 'req.hostname' for express 4.x compatibility
        port: 80,
        path: '/cookievalidator',
        headers: {
          Cookie: playCookie,
          ContentType: 'application/json'
        }
      };
      verified = (err, user, info) => {
        if (err) {
          return this.error(err);
        } else if (!user) {
          return this.fail(info);
        } else {
          return this.success(user, info);
        }
      };
      that = this;
      isValidatedInCache = false;
      if (cache[userId] != null) {
        now = moment();
        if (moment(cache[userId]).isAfter(now)) {
          isValidatedInCache = true;
        }
      }
      if (isValidatedInCache) {
        if (that._passReqToCallback) {
          return that._verify(req, userId, systemId, verified);
        } else {
          return that._verify(userId, systemId, verified);
        }
      } else {
        playRequest = http.request(playRequestOptions, function(res) {
          if (res.statusCode === 200) {
            cache[userId] = moment().add('days', 1);
            if (that._passReqToCallback) {
              return that._verify(req, userId, systemId, verified);
            } else {
              return that._verify(userId, systemId, verified);
            }
          } else {
            return that.fail({
              message: 'Not Authorized'
            });
          }
        });
        playRequest.on('error', function(e) {
          return that.fail({
            message: 'problem with request: ' + e.message
          });
        });
        return playRequest.end();
      }
    } else {
      return this.fail('Not signed into play');
    }
  } else {
    return this.fail('No cookie found on request');
  }
};

// Expose `Strategy`.
exports.Strategy = Strategy;

var authentication, configure, controllers, gi, modelsFactory, routes;

gi = require('@freightlinksolutionsltd/gi-util');

routes = require('./routes');

controllers = require('./controllers');

authentication = require('./authentication');

modelsFactory = require('./models');

configure = function(app, dal, options) {
  var models;
  models = modelsFactory(dal, options);
  gi.common.extend(app.models, models);
  gi.common.extend(app.controllers, controllers(app));
  gi.common.extend(app.middleware, authentication(app, options));
  return routes.configure(app, gi.common.rest);
};

module.exports = {
  configure: configure
};

var configure;

configure = function(app, rest) {
  //user routes
  app.get('/api/user', app.middleware.userAction, app.controllers.user.showMe);
  app.put('/api/user', app.middleware.userAction, app.controllers.user.updateMe);
  app.delete('/api/user', app.middleware.userAction, app.controllers.user.destroyMe); //Changed 'app.del' to 'app.delete' for express 4.x compatibility
  app.get('/api/user/isAvailable', app.middleware.publicAction, app.controllers.user.isUsernameAvailable);
  app.post('/api/user/register', app.middleware.publicRegisterAction, app.controllers.user.create);
  app.post('/api/user/apiSecret', app.middleware.userAction, app.controllers.user.generateAPISecretForMe);
  app.post('/api/user/resetPassword', app.middleware.publicAction, app.controllers.user.resetPassword);
  app.post('/api/user/getResetToken', app.middleware.adminAction, app.controllers.user.getResetToken);
  app.post('/api/user/verify', app.middleware.publicAction, app.controllers.user.verify);
  app.post('/api/verifyUser', app.middleware.publicAction, app.controllers.user.verify);
  app.post('/api/checkUserToken', app.middleware.publicAction, app.controllers.user.checkResetToken);
  rest.routeResource('roles', app, app.middleware.userAction, app.controllers.role);
  rest.routeResource('users', app, app.middleware.adminAction, app.controllers.user);
  //rest.routeResource 'settings', app
  //, app.middleware.publicReadAction, app.controllers.setting
  app.get("/api/settings", app.middleware.publicAction, app.controllers.setting.index, function(req, res) {
    if (res.giResult != null) {
      return res.status(200).json(res.giResult);
    } else {
      return res.status(500).json({
        message: 'something went wrong'
      });
    }
  });
  rest.routeResource('activities', app, app.middleware.userAction, app.controllers.activity);
  rest.routeResource('categories', app, app.middleware.userAction, app.controllers.category);
  rest.routeResource('systems', app, app.middleware.sysAdminAction, app.controllers.system);
  rest.routeResource('environments', app, app.middleware.sysAdminAction, app.controllers.environment);
  rest.routeResource('files', app, app.middleware.userAction, app.controllers.file);
  rest.routeResource('permissions', app, app.middleware.adminAction, app.controllers.permission);
  app.get("/api/2faqr", app.middleware.userAction, app.controllers.user.getQRCode);
  return app.get("/api/users/:id/qr", app.middleware.mgrAction, app.controllers.user.getQRCode);
};

exports.configure = configure;

var http, moment, otplib, passport, strategies;

passport = require('passport');

http = require('http');

strategies = require('./strategies');

otplib = require("otplib");

moment = require('moment');

module.exports = function(users) {
  passport.use(new strategies.basic.Strategy(function(email, password, token, systemId, done) {
    var opts;
    //users.findOneBy 'email', email, systemId, (err, user) ->
    opts = {
      systemId: systemId,
      email: {
        $regex: new RegExp("^" + email, "i")
      },
      "roles.0": {
        $exists: true
      }
    };
    return users.findOne(opts, function(err, user) {
      if (err) {
        return done(null, false, {
          message: err
        });
      } else if (!user) {
        return done(null, false, {
          message: 'User or password incorrect'
        });
      } else {
        return users.comparePassword(user, password, function(err, isValid) {
          if (err) {
            return done(err);
          } else if (!isValid) {
            return done(null, false, {
              message: 'User or password incorrect'
            });
          } else {
            user = user.toObject();
            if (user.twoFactorEnabled) {
              if (!token || token === "") {
                return done(null, false, {
                  twoFactorRequired: "",
                  message: "Second factor required"
                });
              } else {
                if (otplib.authenticator.check(token, user.totpSecret)) {
                  return done(null, user);
                } else {
                  return done(null, false, {
                    message: 'Second factor is invalid'
                  });
                }
              }
            } else {
              if (err) {
                return done(err);
              } else {
                return done(null, user);
              }
            }
          }
        });
      }
    });
  }));
  return {
    routes: function(app, middleware) {
      return app.post('/api/login', middleware, passport.authenticate('basic'), function(req, res, next) {
        var opts;
        console.log(req.user.email);
        opts = {
          systemId: req.systemId,
          email: req.user.email,
          timestamp: moment(),
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          department: req.user.department
        };
        return app.models.logs.create(opts, function(err, log) {
          if (err) {
            console.log("Could not save log");
          } else {
            console.log("Log saved");
          }
          return next();
        });
      }, function(req, res) {
        return res.status(200).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      });
    }
  };
};

var http, passport, strategies;

passport = require('passport');

http = require('http');

strategies = require('./strategies');

module.exports = function(users) {
  passport.use(new strategies.facebook.Strategy(function(facebookid, systemId, done) {
    return http.get("http://graph.facebook.com/" + facebookid + "?fields=id%2Cname", function(res) {
      var data;
      data = '';
      res.on('data', function(chunk) {
        return data += chunk;
      });
      return res.on('end', function() {
        var body;
        body = JSON.parse(data);
        return users.findOrCreate({
          name: body.name,
          systemId: systemId,
          providerId: body.id,
          userIds: [
            {
              provider: 'Facebook',
              providerId: body.id
            }
          ]
        }, function(err, user) {
          return done(err, user);
        });
      });
    }).on('error', function(e) {
      return done(e.message, null);
    });
  }));
  return {
    routes: function(app, middleware) {
      return app.post('/api/loginviafacebook', middleware, passport.authenticate('facebook-sdk'), function(req, res) {
        return res.status(200).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      });
    }
  };
};

var http, passport, strategies;

passport = require('passport');

http = require('http');

strategies = require('./strategies');

module.exports = function(users) {
  return passport.use(new strategies.hmac.Strategy(function(accessKey, systemId, done) {
    // if there is an error , we should return:    #   done(err)
    return users.findById(accessKey, systemId, function(err, user) {
      if (err) {
        return done(err);
      } else if (!user) {
        //valid hmac, but unknown user
        return done(null, false, {
          message: 'No user found with that accessKey'
        });
      } else {
        //success, the access Key is associated with a user
        return done(null, user);
      }
    });
  }));
};

var _, async, passport, permissionFilter;

passport = require('passport');

_ = require('underscore');

async = require('async');

permissionFilter = require('./permissionFilter');

module.exports = function(app) {
  var addExtraUserInfo, adminAction, basic, basicAuth, exports, facebook, findUser, getSecuritySetting, getSystemStrategies, hmacAuth, isAdmin, isInRole, isRestricted, isSysAdmin, logout, mgrAction, permissionsMiddleware, playAuth, publicAction, publicReadAction, publicRegisterAction, sysAdminAction, systemCheck, userAction, users;
  permissionsMiddleware = permissionFilter(app);
  passport.serializeUser(function(user, done) {
    var obj;
    obj = {
      _id: user._id,
      systemId: user.systemId
    };
    return done(null, obj);
  });
  passport.deserializeUser(function(obj, done) {
    return app.models.users.findById(obj._id, obj.systemId, function(err, user) {
      if (err) {
        return done(err, null);
      } else {
        return done(null, user);
      }
    });
  });
  getSecuritySetting = function(name, param, req, cb) {
    return app.models.settings.get(name, req.systemId, req.environmentId, function(err, result) {
      if (err) {
        if (cb) {
          return cb();
        }
      } else if (result != null ? result.value : void 0) {
        if (cb) {
          return cb(null, param);
        }
      } else {
        if (cb) {
          return cb();
        }
      }
    });
  };
  getSystemStrategies = function(req, callback) {
    return async.parallel([
      function(cb) {
        return getSecuritySetting('loginWithFacebook',
      'facebook',
      req,
      cb);
      },
      function(cb) {
        return getSecuritySetting('loginWithBasic',
      'Basic',
      req,
      cb);
      },
      function(cb) {
        return getSecuritySetting('loginWithHmac',
      'Hmac',
      req,
      cb);
      },
      function(cb) {
        return getSecuritySetting('loginWithPlay',
      'Play',
      req,
      cb);
      }
    ], function(err, results) {
      var filteredResults;
      if (err) {
        if (callback) {
          return callback(err, null);
        }
      } else {
        filteredResults = _.filter(results, function(value) {
          return value || false;
        });
        if (callback) {
          return callback(err, filteredResults);
        }
      }
    });
  };
  systemCheck = function(req, res, next) {
    //find environment by host
    if (req != null ? req.hostname : void 0) {
      return app.models.environments.forHost(req.hostname, function(err, result) { //Changed 'req.host' to 'req.hostname' for express 4.x compatibility
        if (err) {
          return res.status(500).json({
            message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else if (result) {
          req.systemId = result.systemId;
          req.environmentId = result._id;
          return exports._getSystemStrategies(req, function(err, strategies) {
            if ((strategies != null) && !err) {
              req.strategies = strategies;
            }
            return exports._findUser(req, res, next);
          });
        } else {
          return res.status(404).json({
            message: 'environment not found' //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        }
      });
    } else {
      return res.status(500).json({
        message: 'host not found on request object' //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      });
    }
  };
  addExtraUserInfo = function(req, res, next) {
    if (req.user.toObject != null) {
      req.user = req.user.toObject();
    }
    return isAdmin(req.user, function(adminBool) {
      req.user.isAdmin = adminBool != null;
      return isSysAdmin(req.user, function(sysAdminBool) {
        req.user.isSysAdmin = sysAdminBool != null;
        return next();
      });
    });
  };
  findUser = function(req, res, next) {
    if (req.isAuthenticated()) {
      return addExtraUserInfo(req, res, next);
    } else {
      return exports._hmacAuth(req, res, function(err, user) {
        if (user && (!err)) {
          return addExtraUserInfo(req, res, next);
        } else {
          return exports._playAuth(req, res, function(err, user) {
            if (user && (!err)) {
              return addExtraUserInfo(req, res, next);
            } else {
              return exports._basicAuth(req, res, function(err, user) {
                if (user && (!err)) {
                  return addExtraUserInfo(req, res, next);
                } else {
                  return next();
                }
              });
            }
          });
        }
      });
    }
  };
  publicAction = function(req, res, next) {
    return exports._systemCheck(req, res, next);
  };
  publicReadAction = function(req, res, next) {
    return systemCheck(req, res, function() {
      if (req.user != null) {
        return isAdmin(req.user, function(admin) {
          if (admin != null) {
            return next();
          } else {
            if (req.route.method === 'get') {
              //if we're not an admin, enforce public-read acl
              if (req.query == null) {
                req.query = {};
              }
              req.query.acl = 'public-read';
              return next();
            } else {
              return res.status(401).json({
                msg: 'not authorized' //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
              });
            }
          }
        });
      } else {
        if (req.route.method === 'get') {
          //if we're not an admin, enforce public-read acl
          if (req.query == null) {
            req.query = {};
          }
          req.query.acl = 'public-read';
          return next();
        } else {
          return res.status(401).json({
            msg: 'not authorized' //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        }
      }
    });
  };
  publicRegisterAction = function(req, res, next) {
    return systemCheck(req, res, function() {
      return getSecuritySetting('allowPublicRegistration', 'allowPublicRegistration', req, function(err, setting) {
        if (setting) {
          return next();
        } else {
          return res.status(403).json({
            message: 'Public user registration is not enabled' //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        }
      });
    });
  };
  hmacAuth = function(req, res, next) {
    if (_.indexOf(req.strategies, 'Hmac') === -1) {
      return next('Hmac strategy not supported', null);
    } else {
      return passport.authenticate('hmac', function(err, user, info) {
        if (err) {
          return next(err, null);
        } else if (!user) {
          return next(info, null);
        } else {
          req.user = user;
          return next(null, user);
        }
      })(req, res, next);
    }
  };
  basicAuth = function(req, res, next) {
    if (_.indexOf(req.strategies, 'Basic') === -1) {
      return next('Basic strategy not supported', null);
    } else {
      return passport.authenticate('basic', function(err, user, info) {
        if (err) {
          return next(err, null);
        } else if (!user) {
          return next(info, null);
        } else {
          req.user = user;
          return next(null, user);
        }
      })(req, res, next);
    }
  };
  playAuth = function(req, res, next) {
    if (_.indexOf(req.strategies, 'Play') === -1) {
      return next('Play strategy not supported', null);
    } else {
      return passport.authenticate('play', function(err, user, info) {
        if (err) {
          return next(err, null);
        } else if (!user) {
          return next(info, null);
        } else {
          req.user = user;
          return next(null, user);
        }
      })(req, res, next);
    }
  };
  userAction = function(req, res, next) {
    return exports.publicAction(req, res, function() {
      if (req.user != null) {
        return permissionsMiddleware(req, res, next);
      } else {
        return res.status(401).json({}); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      }
    });
  };
  adminAction = function(req, res, next) {
    return userAction(req, res, function() {
      return isAdmin(req.user, function(ok) {
        if (ok) {
          return next();
        } else {
          return res.status(401).json({}); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        }
      });
    });
  };
  sysAdminAction = function(req, res, next) {
    return userAction(req, res, function() {
      return isSysAdmin(req.user, function(ok) {
        if (ok) {
          return next();
        } else {
          return res.status(401).json({}); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        }
      });
    });
  };
  mgrAction = function(req, res, next) {
    return userAction(req, res, function() {
      return isInRole('Manager', req.user, function(inRole) {
        if (inRole) {
          return next();
        } else {
          return res.status(403).end();
        }
      });
    });
  };
  isInRole = function(role, user, callback) {
    var result, settingName;
    result = false;
    settingName = role + 'RoleName';
    return app.models.settings.get(settingName, user.systemId, function(err, result) {
      var roleName;
      roleName = role;
      if (result != null ? result.value : void 0) {
        roleName = result.value;
      }
      return app.models.roles.findOneBy('name', roleName, user.systemId, function(err, obj) {
        if (obj && !err) {
          _.each(user.roles, function(role) {
            if (role.toString() === obj._id.toString()) {
              return result = true;
            }
          });
          if (callback) {
            return callback(result);
          }
        } else {
          if (callback) {
            return callback(false);
          }
        }
      });
    });
  };
  isRestricted = function(user, callback) {
    isInRole('Restricted', user, callback);
  };
  isAdmin = function(user, callback) {
    isInRole('Admin', user, function(result) {
      if (result) {
        if (callback) {
          return callback(result);
        }
      } else {
        return isSysAdmin(user, callback);
      }
    });
  };
  isSysAdmin = function(user, callback) {
    isInRole('SysAdmin', user, callback);
  };
  logout = function(req, res) {
    req.logout();
    return res.send(200);
  };
  //Configure Passport authentication strategies
  users = app.models.users;
  basic = require('./basic')(users);
  facebook = require('./facebook')(users);
  require('./hmac')(users);
  require('./play')(users);
  app.use(passport.initialize());
  app.use(passport.session());
  //app.use app.router #Removed 'app.router' for express 4.x compatibility

  //Having fired up passport authentication
  //link in the authentication routes:
  app.get('/api/logout', logout);
  basic.routes(app, publicAction);
  facebook.routes(app, publicAction);
  exports = {
    //Export the authentiaction action middleware
    publicAction: publicAction,
    publicReadAction: publicReadAction,
    userAction: userAction,
    adminAction: adminAction,
    sysAdminAction: sysAdminAction,
    publicRegisterAction: publicRegisterAction,
    mgrAction: mgrAction,
    _getSystemStrategies: getSystemStrategies,
    _systemCheck: systemCheck,
    _hmacAuth: hmacAuth,
    _basicAuth: basicAuth,
    _playAuth: playAuth,
    _findUser: findUser
  };
  return exports;
};

var _, gi;

_ = require('underscore');

gi = require('@freightlinksolutionsltd/gi-util');

module.exports = function(app) {
  var flags;
  //Returns a middleware function that embelisshes
  //req.giFilter with information used to filter results
  //based on permissions
  flags = {
    NONE: 1,
    CREATE: 2,
    READ: 4,
    UPDATE: 8,
    DESTROY: 16
  };
  return function(req, res, next) {
    var options;
    return next();
    options = {
      query: {
        systemId: req.systemId,
        userId: req.user.id
      }
    };
    return app.models.permissions.find(options, function(err, results) {
      if (err) {
        return res.status(500).json({
          message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        });
      } else if (results != null) {
        req.giFilter = {};
        _.each(results, function(result) {
          var resourceTypeFilter;
          if (!req.giFilter[result.resourceType]) {
            req.giFilter[result.resourceType] = {};
          }
          resourceTypeFilter = req.giFilter[result.resourceType];
          if (result.restriction & flags.NONE) {
            if (resourceTypeFilter.$nin == null) {
              resourceTypeFilter.$nin = [];
            }
            //console.log 'we are denied access to customer(s): ' + result.keys
            gi.common.extend(resourceTypeFilter.$nin, result.keys);
          }
          if (result.restriction & flags.CREATE) {
            resourceTypeFilter.create = true;
          }
          if (result.restriction & flags.READ) {
            if (resourceTypeFilter.$in == null) {
              resourceTypeFilter.$in = [];
            }
            return gi.common.extend(resourceTypeFilter.$in, result.keys);
          }
        });
        return next();
      } else {
        return next();
      }
    });
  };
};

var http, passport, strategies;

passport = require('passport');

http = require('http');

strategies = require('./strategies');

module.exports = function(users) {
  return passport.use(new strategies.play.Strategy(function(userId, systemId, done) {
    return users.findById(userId, systemId, function(err, user) {
      if (err) {
        return done(err);
      } else if (!user) {
        //valid hmac, but unknown user
        return done(null, false, {
          message: 'No user found with that userId'
        });
      } else {
        //success, the access Key is associated with a user
        return done(null, user);
      }
    });
  }));
};

var gi;

gi = require('@freightlinksolutionsltd/gi-util');

module.exports = function(model, crudControllerFactory) {
  var create, crud, exports;
  crud = crudControllerFactory(model);
  create = function(req, res) {
    req.body.user = req.user.id;
    return crud.create(req, res);
  };
  exports = gi.common.extend({}, crud);
  exports.create = create;
  return exports;
};

var AWS, _, gi;

AWS = require('aws-sdk');

_ = require('underscore');

gi = require('@freightlinksolutionsltd/gi-util');

module.exports = function(models, crudControllerFactory) {
  var create, crudController, destroy, exports, settings, update, updatePrimary;
  crudController = crudControllerFactory(models.files);
  settings = models.settings;
  updatePrimary = function(file, res) {
    if (file.primary) {
      //TODO: set all other files with this parent to primary = false
      return res.status(200).json(file); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    } else {
      return res.status(200).json(file); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    }
  };
  create = function(req, res) {
    return crudController.create(req, res, function() {
      return updatePrimary(res.giResult, res);
    });
  };
  update = function(req, res) {
    return crudController.update(req, res, function() {
      return updatePrimary(res.giResult, res);
    });
  };
  destroy = function(req, res) {
    return settings.get("awsAccessKey", req.systemId, req.environmentId, function(err, awsKey) {
      if (err) {
        return res.status(404).json("AWS Access key not set"); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      } else {
        return settings.get("awsBucketName", req.systemId, req.environmentId, function(err, awsBucket) {
          if (err) {
            return res.status(404).json("AWS bucket name not set"); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          } else {
            return settings.get("awsSecretKey", req.systemId, req.environmentId, function(err, awsSecret) {
              var ref;
              if (err) {
                return res.status(404).json("AWS secret key not set"); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
              } else {
                if ((ref = req.params) != null ? ref.id : void 0) {
                  return models.files.findById(req.params.id, req.systemId, function(err, file) {
                    var awsConfig, deleteParams, path, s3;
                    if (err || (!file)) {
                      return res.status(404).json("could not find file with that id"); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                    } else {
                      //let's go and delete the files from S3
                      awsConfig = {
                        accessKeyId: awsKey.value,
                        secretAccessKey: awsSecret.value
                      };
                      AWS.config.update(awsConfig);
                      s3 = new AWS.S3();
                      path = 'public/images/' + file.parentType + '/' + file.parentId + '/';
                      deleteParams = {
                        Bucket: awsBucket.value,
                        Delete: {
                          Objects: [
                            {
                              Key: path + file.name
                            }
                          ]
                        }
                      };
                      _.each(file.s3alternates, function(alternate) {
                        var obj;
                        obj = {
                          Key: path + alternate + file.name
                        };
                        return deleteParams.Delete.Objects.push(obj);
                      });
                      return s3.deleteObjects(deleteParams, function(err, data) {
                        return crudController.destroy(req, res);
                      });
                    }
                  });
                } else {
                  return res.status(404).json("could not find file with that id"); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                }
              }
            });
          }
        });
      }
    });
  };
  exports = gi.common.extend({}, crudController);
  exports.create = create;
  exports.destroy = destroy;
  return exports;
};

var activity, conFac, file, gi, user;

gi = require('@freightlinksolutionsltd/gi-util');

user = require('./user');

activity = require('./activity');

file = require('./file');

conFac = gi.common.crudControllerFactory;

module.exports = function(app) {
  return {
    user: user(app.models.users, conFac),
    activity: activity(app.models.activities, conFac),
    file: file(app.models, conFac),
    role: conFac(app.models.roles),
    setting: conFac(app.models.settings),
    category: conFac(app.models.categories),
    system: conFac(app.models.systems),
    environment: conFac(app.models.environments),
    permission: conFac(app.models.permissions)
  };
};

var _, base32, gi, logger, otplib, qrcode;

_ = require('underscore');

gi = require('@freightlinksolutionsltd/gi-util');

qrcode = require("qrcode");

otplib = require("otplib");

base32 = require("base32");

logger = gi.common;

module.exports = function(model, crudControllerFactory) {
  var checkResetToken, create, crud, destroyMe, exports, findById, generateAPISecretForMe, getQRCode, getResetToken, index, isUsernameAvailable, resetPassword, showMe, stripPasswords, update, updateMe, verify;
  crud = crudControllerFactory(model);
  isUsernameAvailable = function(req, res) {
    var email, systemId;
    systemId = req.systemId;
    email = req.query.username;
    if (email != null) {
      return model.findOne({
        "email": {
          $regex: new RegExp("^" + email, "i")
        },
        "systemId": systemId
      }, function(err, user) {
        if (err != null) {
          if (err === "Cannot find User") {
            return res.status(200).json({
              available: true //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            });
          } else {
            return res.status(500).json({
              message: 'error searching by email: ' + err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            });
          }
        } else if (!user) {
          return res.status(200).json({
            available: true //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else {
          return res.status(200).json({
            available: false //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        }
      });
    } else {
      return res.status(200).json({
        available: false //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      });
    }
  };
  verify = function(req, res) {
    var email, output, password, systemId;
    email = req.body.email;
    password = req.body.password;
    systemId = req.systemId;
    output = {};
    if ((email != null) && (password != null) && (systemId != null)) {
      return model.findOne({
        "email": {
          $regex: new RegExp("^" + email, "i")
        },
        "systemId": systemId
      }, function(err, user) {
        if (err || (!user)) {
          return res.status(200).json({
            valid: false //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else {
          return model.comparePassword(user, password, function(err, isValid) {
            if (err || (!isValid)) {
              return res.status(200).json({
                valid: false //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
              });
            } else {
              output = user.toJSON();
              delete output._id;
              delete output.systemId;
              delete output.userIds;
              delete output.password;
              delete output.totpSecret;
              output.valid = true;
              return res.status(200).json(output); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            }
          });
        }
      });
    } else {
      return res.status(400).end("Required data not supplied");
    }
  };
  showMe = function(req, res) {
    return model.findById(req.user._id, req.systemId, function(err, user) {
      if (err) {
        return res.status(404).json({
          message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        });
      } else {
        user.password = null;
        delete user.password;
        user.totpSecret = null;
        delete user.totpSecret;
        return res.status(200).json(user); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      }
    });
  };
  updateMe = function(req, res) {
    //first check that the user we want to update is the user
    //making the request
    if (req.user._id === !req.body._id) {
      return res.status(401).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    } else {
      req.body.systemId = req.systemId;
      return model.update(req.user._id, req.body, function(err, user) {
        if (err) {
          return res.status(404).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        } else {
          user.password = null;
          delete user.password;
          user.totpSecret = null;
          delete user.totpSecret;
          return res.status(200).json(user); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        }
      });
    }
  };
  destroyMe = function(req, res) {
    return model.destroy(req.user._id, req.systemId, function(err) {
      if (err) {
        return res.status(404).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      } else {
        return res.status(200).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      }
    });
  };
  generateAPISecretForMe = function(req, res) {
    if (req.user._id === !req.body._id) {
      return res.status(401).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    } else {
      return model.resetAPISecret(req.user._id, req.systemId, function(err) {
        if (err) {
          return res.status(404).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        } else {
          return res.status(200).json(); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        }
      });
    }
  };
  stripPasswords = function(res) {
    if (_.isArray(res.giResult)) {
      _.each(res.giResult, function(r) {
        r.obj.password = null;
        delete r.obj.password;
        r.obj.confirm = null;
        delete r.obj.confirm;
        r.obj.totpSecret = null;
        return delete r.obj.totpSecret;
      });
      return res.status(res.giResultCode).json(res.giResult);
    } else {
      res.giResult.password = null;
      delete res.giResult.password;
      res.giResult.confirm = null;
      delete res.giResult.confirm;
      res.giResult.totpSecret = null;
      delete res.giResult.totpSecret;
      return res.status(200).json(res.giResult); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    }
  };
  index = function(req, res) {
    return crud.index(req, res, function() {
      _.each(res.giResult, function(u) {
        u.password = null;
        delete u.password;
        u.totpSecret = null;
        return delete u.totpSecret;
      });
      return res.status(200).json(res.giResult); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    });
  };
  findById = function(req, res) {
    return crud.show(req, res, function() {
      return stripPasswords(res);
    });
  };
  create = function(req, res) {
    req.body.createdById = req.user._id;
    return crud.create(req, res, function() {
      return stripPasswords(res);
    });
  };
  update = function(req, res) {
    return crud.update(req, res, function() {
      return stripPasswords(res);
    });
  };
  checkResetToken = function(req, res) {
    if (req.body.token != null) {
      return model.findOneBy('token', req.body.token, req.systemId, function(err, user) {
        if (err) {
          return res.status(500).json({
            message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else if (!user) {
          return res.status(404).json({
            message: "invalid token" //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else {
          return res.status(200).json({
            message: "token ok" //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        }
      });
    } else {
      return res.status(200).json({
        isValid: false //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      });
    }
  };
  resetPassword = function(req, res) {
    if (req.body.token != null) {
      return model.findOneBy('token', req.body.token, req.systemId, function(err, u) {
        var updateObj, user;
        if (err) {
          return res.status(500).json({
            message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else if (!u) {
          return res.status(404).json({
            message: "invalid token"
          });
        } else {
          user = u.toObject();
          updateObj = {
            password: req.body.password,
            systemId: req.systemId,
            $unset: {
              token: ""
            }
          };
          return model.update(user._id, updateObj, function(err, obj) {
            var msg;
            if (err) {
              return res.status(500).json({
                message: "error saving token to user " + err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
              });
            } else {
              msg = {
                message: "password reset sucesfully",
                email: user.email
              };
              return res.status(200).json(msg); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            }
          });
        }
      });
    } else {
      //look for a user with the specified e-mail
      //generate a random token
      return model.findOne({
        "email": {
          $regex: new RegExp("^" + req.body.email, "i")
        },
        "systemId": req.systemId
      }, function(err, user) {
        if (err) {
          return res.status(500).json({
            message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else if (user == null) {
          return res.status(404).json({
            message: "Could not find account for that e-mail"
          });
        } else {
          return model.generateToken(function(err, token) {
            var updateObj;
            if (err) {
              return res.status(500).json({
                message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
              });
            } else if (!token) {
              return res.status(500).json({
                message: "could not generate reset token" //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
              });
            } else {
              updateObj = {
                token: token,
                systemId: req.systemId
              };
              return model.update(user._id, updateObj, function(err, obj) {
                var resetObj;
                if (err) {
                  return res.status(500).json({
                    message: "error saving token to user " + err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                  });
                } else {
                  resetObj = {
                    host: req.protocol + "://" + req.hostname, //Changed 'req.host' to 'req.hostname' for express 4.x compatibility
                    email: user.email,
                    token: token
                  };
                  return model.sendResetInstructions(resetObj, function(err) {
                    var msg;
                    if (err) {
                      return res.status(500).json({
                        message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                      });
                    } else {
                      msg = "password reset instructions sent";
                      return res.status(200).json({
                        message: msg //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  };
  getResetToken = function(req, res) {
    if (req.body.email != null) {
      return model.findOneBy('email', req.body.email, req.systemId, function(err, user) {
        if (err) {
          return res.status(500).json({
            message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else if (user == null) {
          return res.status(404).json({
            message: "Could not find account for that e-mail" //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          });
        } else {
          return model.generateToken(function(err, token) {
            var updateObj;
            if (err) {
              return res.status(500).json({
                message: err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
              });
            } else if (!token) {
              return res.status(500).json({
                message: "could not generate reset token" //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
              });
            } else {
              updateObj = {
                token: token,
                systemId: req.systemId
              };
              return model.update(user._id, updateObj, function(err, obj) {
                var resetObj;
                if (err) {
                  return res.status(500).json({
                    message: "error saving token to user " + err //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                  });
                } else {
                  resetObj = {
                    host: req.protocol + "://" + req.hostname, //Changed 'req.host' to 'req.hostname' for express 4.x compatibility
                    email: user.email,
                    token: token,
                    _id: user._id
                  };
                  return res.status(200).json(resetObj); //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                }
              });
            }
          });
        }
      });
    } else {
      return res.status(500).json({
        message: "No email passed." //Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      });
    }
  };
  getQRCode = function(req, res) {
    var _getSecret;
    _getSecret = function(systemId, userId, cb) {
      return model.findOneBy('_id', userId, systemId, function(err, user) {
        var secret;
        if (err) {
          return cb(err, null, null);
        } else {
          if (user.toObject().totpSecret) {
            return cb(null, user.email, user.toObject().totpSecret);
          } else {
            secret = otplib.authenticator.generateSecret();
            return model.update(user._id, {
              systemId: req.systemId,
              $set: {
                totpSecret: secret
              }
            }, function(err, newUser) {
              return cb(err, user.email, secret || null);
            });
          }
        }
      });
    };
    if (!req.user) {
      return res.status(401).end();
    } else {
      return _getSecret(req.systemId, req.params.id || req.user._id, function(err, email, secret) {
        var appName, otpauth;
        if (err) {
          return res.status(500).send("Unable to generate secret");
        } else {
          appName = "F2F2";
          if (process.env["F2F2_ENV"] !== "prod") {
            appName += "-" + process.env["F2F2_ENV"];
          }
          otpauth = otplib.authenticator.keyuri(encodeURIComponent(email), encodeURIComponent(appName), secret);
          return qrcode.toDataURL(otpauth, function(err, imageUrl) {
            var buff;
            if (err) {
              return res.status(500).send("Unable to generate QR Code");
            } else {
              res.set("Content-Type", "image/png");
              res.set("Content-Length", imageUrl.length);
              imageUrl = imageUrl.split(",")[1];
              buff = Buffer.from(imageUrl, "base64");
              return res.status(200).send(buff);
            }
          });
        }
      });
    }
  };
  exports = gi.common.extend({}, crud);
  exports.index = index;
  exports.show = findById;
  exports.create = create;
  exports.update = update;
  exports.showMe = showMe;
  exports.updateMe = updateMe;
  exports.destroyMe = destroyMe;
  exports.generateAPISecretForMe = generateAPISecretForMe;
  exports.resetPassword = resetPassword;
  exports.getResetToken = getResetToken;
  exports.checkResetToken = checkResetToken;
  exports.verify = verify;
  exports.isUsernameAvailable = isUsernameAvailable;
  exports.getQRCode = getQRCode;
  return exports;
};

module.exports = function(dal) {
  var model, modelDefinition;
  modelDefinition = {
    name: 'Activity',
    schemaDefinition: {
      systemId: 'ObjectId',
      description: 'String',
      job: {
        type: 'ObjectId',
        ref: 'Job'
      },
      user: {
        type: 'ObjectId',
        ref: 'User'
      },
      timeStamp: {
        type: 'Date',
        default: Date.now
      },
      status: {
        type: 'ObjectId',
        ref: 'JobStatus'
      },
      code: 'Number',
      from: 'Mixed',
      to: 'Mixed',
      parent: {
        key: 'ObjectId',
        resourceType: 'String'
      }
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  return dal.crudFactory(model);
};

module.exports = function(dal) {
  var model, modelDefinition;
  modelDefinition = {
    name: 'Category',
    schemaDefinition: {
      systemId: 'ObjectId',
      parentId: 'ObjectId',
      title: 'String',
      pluralTitle: 'String',
      description: 'String',
      detail: 'String',
      moredetail: 'String',
      slug: 'String',
      visible: 'Boolean',
      showOnNav: 'Boolean',
      order: 'Number',
      attributes: [
        {
          name: 'String',
          value: 'String'
        }
      ]
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  return dal.crudFactory(model);
};

module.exports = function(dal) {
  var exports, getForHost, model, modelDefinition;
  modelDefinition = {
    name: 'Environment',
    schemaDefinition: {
      systemId: 'ObjectId',
      host: 'String'
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  //This is special - it's a model function
  //that does not filter by systemId (as it is used to find systemIds)
  getForHost = async function(host, callback) {
    var env, obj;
    env = (await model.findOne({
      host: host
    }));
    if (!env) {
      return callback('No env', null);
    } else if (env) {
      obj = {
        _id: env._id,
        systemId: env.systemId
      };
      return callback(null, obj);
    } else {
      return callback(model.modelName + " Not Found", null);
    }
  };
  exports = dal.crudFactory(model);
  exports.forHost = getForHost;
  return exports;
};

module.exports = function(dal) {
  var model, modelDefinition;
  modelDefinition = {
    name: 'File',
    schemaDefinition: {
      systemId: 'ObjectId',
      parentId: 'String',
      parentType: 'String',
      name: 'String',
      sequence: 'Number',
      primary: 'Boolean',
      exclude: 'Boolean',
      order: 'Number',
      title: 'String',
      description: 'String',
      size: 'Number',
      s3alternates: ['String']
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  return dal.crudFactory(model);
};

var activities, categories, environments, files, logs, permissions, roles, settings, systems, users;

environments = require('./environments');

files = require('./files');

systems = require('./systems');

users = require('./users');

roles = require('./roles');

settings = require('./settings');

activities = require('./activities');

categories = require('./categories');

permissions = require('./permissions');

logs = require('./logs');

module.exports = function(dal, options) {
  var environmentsModel;
  environmentsModel = environments(dal);
  return {
    systems: systems(dal),
    environments: environmentsModel,
    files: files(dal),
    users: users(dal, options),
    roles: roles(dal),
    settings: settings(dal, environmentsModel),
    activities: activities(dal),
    categories: categories(dal),
    permissions: permissions(dal),
    logs: logs(dal)
  };
};

module.exports = function(dal) {
  var model, modelDefinition;
  modelDefinition = {
    name: 'Log',
    schemaDefinition: {
      systemId: 'ObjectId',
      email: 'String',
      timestamp: 'Date',
      ipAddress: 'String',
      department: 'String'
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  return dal.crudFactory(model);
};

module.exports = function(dal) {
  var model, modelDefinition;
  modelDefinition = {
    name: 'Permission',
    schemaDefinition: {
      systemId: 'ObjectId',
      userId: 'ObjectId',
      resourceType: 'String',
      restriction: 'Number',
      keys: ['ObjectId']
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  return dal.crudFactory(model);
};

module.exports = function(dal) {
  var model, modelDefinition;
  modelDefinition = {
    name: 'Role',
    schemaDefinition: {
      systemId: 'ObjectId',
      name: 'String'
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  return dal.crudFactory(model);
};

var gi;

gi = require('@freightlinksolutionsltd/gi-util');

module.exports = function(dal, environmentsModel) {
  var crud, exports, get, getEnvironment, getSystem, model, modelDefinition, saveSetting, set;
  modelDefinition = {
    name: 'Setting',
    schemaDefinition: {
      systemId: 'ObjectId',
      key: 'String',
      value: 'String',
      acl: 'String',
      parent: {
        key: 'ObjectId',
        resourceType: 'String'
      }
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  crud = dal.crudFactory(model);
  get = function(name, systemId, environmentId, callback) {
    if (callback == null) {
      callback = environmentId;
      return getSystem(name, systemId, callback);
    } else {
      return getEnvironment(name, systemId, environmentId, callback);
    }
  };
  getEnvironment = function(name, systemId, environmentId, callback) {
    return environmentsModel.findById(environmentId, systemId, function(err, environment) {
      var query;
      if (err) {
        return callback(err, null);
      } else if (environment && !err) {
        query = {
          key: name,
          systemId: systemId,
          parent: {
            key: environmentId,
            resourceType: 'environment'
          }
        };
        return crud.findOne(query, function(err, setting) {
          if (setting && !err) {
            return callback(null, setting);
          } else {
            //roll up to the system setting
            return getSystem(name, systemId, callback);
          }
        });
      } else {
        return callback("environmentId does not belong to system");
      }
    });
  };
  getSystem = function(name, systemId, callback) {
    var query;
    query = {
      key: name,
      systemId: systemId,
      'parent.key': systemId,
      'parent.resourceType': 'system'
    };
    return crud.findOne(query, callback);
  };
  saveSetting = function(setting, newValue, callback) {
    ({
      newSetting: {
        _id: setting._id,
        key: setting.name,
        value: newValue,
        systemId: setting.systemId,
        parent: {
          key: setting.parent.key,
          resourceType: setting.parent.resourceType
        }
      }
    });
    return crud.update(setting._id, newSetting, callback);
  };
  set = function(name, value, systemId, environmentId, callback) {
    ({
      query: {
        key: name,
        systemId: systemId
      }
    });
    if (environmentId != null) {
      ({
        parent: {
          key: environmentId,
          resourceType: 'environment'
        }
      });
    } else {
      ({
        parent: {
          key: systemId,
          resourcetype: 'system'
        }
      });
    }
    return crud.findOne(query, function(err, setting) {
      if (err) {
        if (environmentId == null) {
          callback = environmentId;
        }
        return callback(err, null);
      } else if (!setting) {
        ({
          newSetting: {
            key: name,
            value: value,
            systemId: systemId
          }
        });
        if (environmentId != null) {
          return envionmentsModel.findById(environmentId, systemId, function(err, environment) {
            if (environment && !err) {
              newSetting.parent.key = environmentId;
              newSetting.parent.resourceType = 'environment';
              return crud.create(newSetting, callback);
            } else {
              return callback("environmentId does not belong to system", null);
            }
          });
        } else {
          newSetting.parent.key = systemId;
          newSetting.parent.resourcetype = 'system';
          return crud.create(newSetting, callback);
        }
      } else {
        return saveSetting(setting, value, callback);
      }
    });
  };
  exports = gi.common.extend({}, crud);
  exports.get = get;
  exports.set = set;
  exports._getEnvironment = getEnvironment;
  exports._getSystem = getSystem;
  exports._saveSetting = saveSetting;
  return exports;
};

module.exports = function(dal) {
  var all, exports, model, modelDefinition;
  modelDefinition = {
    name: 'System',
    schemaDefinition: {
      name: 'String',
      attributes: [
        {
          key: 'String',
          category: 'String',
          value: 'String'
        }
      ]
    }
  };
  modelDefinition.schema = dal.schemaFactory(modelDefinition);
  model = dal.modelFactory(modelDefinition);
  //This is special - it's a model function
  //that does not filter by systemId (as it is used to find systemIds)
  all = async function(cb) {
    var e, obj;
    try {
      obj = (await model.find({}).exec()); //, (err, obj) ->
      return cb(null, obj);
    } catch (error) {
      e = error;
      return cb(e);
    }
  };
  exports = dal.crudFactory(model);
  exports.all = all;
  return exports;
};

var bcrypt, crypto, gi;

crypto = require('crypto');

bcrypt = require('bcryptjs');

gi = require('@freightlinksolutionsltd/gi-util');

module.exports = function(dal, options) {
  var SALT_WORK_FACTOR, comparePassword, compareToken, create, crud, exports, findOneByProviderId, findOrCreate, generateToken, model, modelDefinition, resetAPISecret, schema, sendResetInstructions, update, updateQuery;
  SALT_WORK_FACTOR = 10;
  modelDefinition = {
    name: 'User',
    schemaDefinition: {
      systemId: 'ObjectId',
      firstName: 'String',
      lastName: 'String',
      email: 'String',
      password: 'String',
      apiSecret: 'String',
      countryCode: 'String',
      userIds: [
        {
          provider: 'String',
          providerId: 'String'
        }
      ],
      roles: [
        {
          type: 'ObjectId',
          ref: 'Role'
        }
      ],
      createdById: 'ObjectId'
    },
    options: {
      strict: false
    }
  };
  schema = dal.schemaFactory(modelDefinition);
  modelDefinition.schema = schema;
  schema.virtual('name').get(function() {
    return this.firstName + ' ' + this.lastName;
  });
  schema.virtual('name').set(function(name) {
    var split;
    split = name.split(' ');
    this.firstName = split[0];
    return this.lastName = split[1];
  });
  schema.methods.resetAPISecret = function(callback) {
    return crypto.randomBytes(18, (err, buf) => {
      if (err) {
        return callback(err);
      } else {
        this.apiSecret = buf.toString('base64');
        return this.save(callback);
      }
    });
  };
  schema.pre('save', function(next) {
    var user;
    user = this;
    this.confirm = "";
    if (!this.isModified('password')) {
      return next();
    }
    return bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
      if (err) {
        return next(err);
      }
      return bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        return next();
      });
    });
  });
  model = dal.modelFactory(modelDefinition);
  crud = dal.crudFactory(model);
  sendResetInstructions = function(resetObj, cb) {
    if (options.sendResetInstructions != null) {
      return options.sendResetInstructions(resetObj, cb);
    } else {
      return cb("sendResetInstructions function not defined");
    }
  };
  generateToken = function(callback) {
    return crypto.randomBytes(18, function(err, buf) {
      var token;
      if (err) {
        return callback(err);
      } else {
        token = buf.toString('base64');
        return callback(null, token);
      }
    });
  };
  comparePassword = function(user, candidate, callback) {
    if (model.comparePassword != null) {
      return model.comparePassword(user, candidate, callback);
    } else {
      if (candidate != null) {
        if (user.password != null) {
          return bcrypt.compare(candidate, user.password, function(err, isMatch) {
            if (err) {
              return callback(err);
            }
            return callback(null, isMatch);
          });
        } else {
          return callback('password authentication is not enabled for this user', false);
        }
      } else {
        return callback('password does not meet minimum requirements', false);
      }
    }
  };
  compareToken = function(user, token, callback) {
    if (token != null) {
      // Somehow validate the token received
      return callback(null, true);
    } else {
      return callback('Second factor not received');
    }
  };
  update = function(id, json, callback) {
    delete json.confirm;
    return crud.findById(id, json.systemId, async function(err, user) {
      var savedUser;
      if (err) {
        return callback(err, null);
      } else {
        if (user) {
          //call save in case the password has changed
          if (json.password) {
            user.password = json.password;
            savedUser = (await user.save());
            if (savedUser && savedUser.password) {
              json.password = savedUser.password;
            }
            return crud.update(id, json, callback);
          } else {
            delete json.password;
            return crud.update(id, json, callback);
          }
        } else {
          return callback('user not found', null);
        }
      }
    });
  };
  findOneByProviderId = function(id, systemId, callback) {
    return crud.findOneBy('userIds.providerId', id, systemId, callback);
  };
  findOrCreate = function(json, callback) {
    delete json.confirm;
    return findOneByProviderId(json.providerId, json.systemId(function(err, user) {
      if (user) {
        return callback(err, user);
      } else {
        return crud.create(json, function(err, user) {
          return callback(err, user);
        });
      }
    }));
  };
  resetAPISecret = function(id, systemId, callback) {
    return crud.findById(id, systemId, function(err, user) {
      if (err) {
        return callback(err);
      } else if (user != null) {
        return user.resetAPISecret(callback);
      } else {
        return callback('cannot find user');
      }
    });
  };
  create = async function(json, callback) {
    var e, user;
    delete json.confirm;
    try {
      user = (await crud.findOne({
        "email": {
          $regex: new RegExp(json.email, "i")
        },
        "systemId": json.systemId
      }));
      if ((user != null ? user.email : void 0) === json.email) {
        return callback('Username already exists');
      } else {
        return crud.create(json, callback);
      }
    } catch (error) {
      e = error;
      return callback(e, null);
    }
  };
  updateQuery = function(query, change, callback) {
    delete change.confirm;
    if (query.systemId == null) {
      return callback('SystemId not specified');
    } else {
      return model.update(query, change, {
        multi: true
      }, callback);
    }
  };
  exports = gi.common.extend({}, crud);
  exports.update = update;
  exports.updateQuery = updateQuery;
  exports.findOrCreate = findOrCreate;
  exports.findOneByProviderId = findOneByProviderId;
  exports.resetAPISecret = resetAPISecret;
  exports.comparePassword = comparePassword;
  exports.compareToken = compareToken;
  exports.create = create;
  exports.generateToken = generateToken;
  exports.sendResetInstructions = sendResetInstructions;
  return exports;
};
