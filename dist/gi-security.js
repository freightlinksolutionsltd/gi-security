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
    }).when('/user',
  {
      controller: 'userController',
      templateUrl: 'gi-user.html'
    }).when('/logout',
  {
      controller: 'logoutController',
      templateUrl: 'gi-logout.html'
    }).when('/roles',
  {
      controller: 'roleController',
      templateUrl: 'gi-role.html'
    }).when('/users',
  {
      controller: 'usersController',
      templateUrl: 'gi-userManagement.html'
    }).when('/permissions',
  {
      controller: 'permissionController',
      templateUrl: 'gi-permissions.html'
    });
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
    $scope.login = function() {
      return $http.post('/api/login',
  $scope.cred).success(function() {
        return Auth.loginConfirmed();
      }).error(function() {
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

angular.module('gi.security').run(['$templateCache', function($templateCache) {$templateCache.put('gi-login.html','<div class="hero-unit">\n  <div class="alert alert-danger" ng-if="loginStatus.failed">\n    <button type="button" \n            class="close dismissLogin" \n            ng-click="dismissLoginAlert()">&times;</button>\n    <strong>Login Failed!</strong>: Username / Password was incorrect\n  </div>\n  <h3>Please Login</h3>\n  <div  class="well form-inline">\n    <input  type="text" \n            ng-model="cred.username" \n            class="input" \n            placeholder="Email">\n    <input  type="password" \n            ng-model="cred.password" \n            class="input-small" \n            placeholder="Password">\n    <button ng-disabled="!cred.username || !cred.password" \n            class="btn btn-primary basicLogin" \n            ng-click="login()">Login</button>\n  </div>\n  <div class="well form loginWithFacebook" ng-if="allowFacebookLogin">\n    <button ng-click="loginWithFacebook()"><img src="/img/login-with-facebook.png" width="154" height="22"></button> \n  </div>\n</div>');
$templateCache.put('gi-logout.html','<div class="hero-unit">\n  <h3>You have been securely logged out</h3>\n  <a href="/login" class="btn btn-primary">Log Back In</a>\n</div>');
$templateCache.put('gi-permissionForm.html','<div class="well form">\n  <div class="form-group"\n    <label>User:</label>\n    <gi-select2 options="users" selection="selectedUser" field="firstName" style="width:100%"/>\n  </div>\n  <div class="form-group">\n    <label>Resource Type:</label>\n    <gi-select2 options="resourceTypes" selection="selectedResourceType" field="name" style="width:100%"/>\n  </div>\n  <div class="form-group">\n    <label>Restriction:</label>\n    <select class="form-control" \n            ng-model="permission.restriction" \n            ng-options="r.value as r.name for r in restrictions"></select>\n  </div>\n  <div class="form-group">\n    <label>{{permission.resourceType.name}}</label>\n    <label>Keys:</label>\n    <gi-select2 tags custom options="keys" selection="selectedKeys" field="name" style="width:100%"/>\n  </div>\n  <button class="btn btn-primary" ng-click="save()">\n    {{submitText}}\n  </button>\n  <button ng-show="showDelete" class="btn btn-danger" ng-click="confirmDelete()" >\n    <span class="glyphicon glyphicon-trash white"></span>\n  </button>\n\n</div>\n<gi-modal visible="showDeleteModal"\n        title="Please Confirm Delete Action">\n  <div class="body">\n    <p>Delete this permission - are you sure?</p>\n    <p>Please continue only if you are 100% \n      you understand what you\'re deleting.  \n      There is no way to retrieve the data after this point.</p>\n  </div>\n  <div class="footer">\n    <button ng-click="deletePermission()"\n            class="btn btn-danger">\n      Delete It!\n    </button>\n  </div>\n</gi-modal>');
$templateCache.put('gi-permissions.html','<div class="container">\n  <div class="row">\n    <div class="col-md-6">\n      <gi-datatable items="permissions" \n                 selected-items="selectedPermissions"\n                 options="options" >\n        <div class="header">\n          <label>User</label>\n          <label>Resource</label>\n          <label>Restriction</label>\n        </div>\n        <div class="body">\n          <label class="filter">permissionUser</label>\n          <label class="property">resourceType</label>\n          <label class="filter">permissionRestriction</label>\n        </div>\n      </gi-datatable>\n    </div>\n    <div class="col-md-6">\n      <permission-form permission="permission" submit-text="{{submitText}}" submit="savePermission(permission)"></permission-form>\n    </div>\n  </div>\n</div>');
$templateCache.put('gi-role.html','<div class="container">\n  <div class="row">\n    <div class="col-md-2">\n      <ul class="nav nav-pills nav-stacked">\n        <li ng-class="{active: currentView == \'list\' }">\n          <a ng-click="show(\'list\')">All Roles</a>\n        </li>\n        <li ng-class="{active: currentView == \'form\' }">\n          <a ng-click="show(\'form\')">New Role</a>\n        </li>\n      </ul>\n    </div>\n    <div class="col-md-10">\n      <div>\n        <div ng-show="selectedRole" >\n          <div class="col-md-6">\n            <h4>Roles</h4>\n            <ul class="nav nav-pills nav-stacked" ng-repeat="role in roles" >\n              <li ng-class="{active: role.name == selectedRole.name}" >\n                <a \n                 ng-click="selectRole(role)">{{role.name}}</a>\n              </li>\n            </ul>\n            <div>\n              <h4>Role Members</h4>\n              <div ng-repeat="user in roleUsers">{{user.firstName}}</div>\n            </div>\n          </div>\n          <div ng-show="currentView == \'list\'" class="col-md-6">\n            <h4>Role Details</h4>\n            <role-form role="selectedRole" title="Role Details" submit-text="Update Role" submit="saveRole(role)" destroy="deleteRole(role)"></role-form>\n\n          </div>\n          <div ng-show="currentView == \'form\'" class="col-md-6">\n            <role-form role="newRole" title="Role Details" submit-text="Create Role" submit="saveRole(role)"></role-form>\n          </div>\n        </div>      \n        <div ng-hide="selectedRole">\n          <div class="col-md-6">\n            <h4>Roles</h4>\n            No Roles found for this organisation.\n            You can create one by entering the details on this page.\n          </div>\n          <div class="col-md-6">\n            <role-form title="New Role" role="newRole" submit-text="Create Role" submit="saveRole(role)"></role-form>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>');
$templateCache.put('gi-roleForm.html','<div class="well form" role="form">\n  <input type="hidden" id="hiddenSiteId" ng-model="role._id"/>\n  <div class="form-group">\n    <label  >Name:</label>\n    <input  type="text" class="form-control" \n            name="name" ng-model="role.name"/>\n  </div>\n  <button class="btn btn-primary" \n            ng-click="submit({role: role})">\n      {{submitText}}\n  </button>\n  <button ng-show="showDelete" \n          class="btn btn-danger" \n          ng-click="confirmDelete()" >\n    <span class="glyphicon glyphicon-trash white"></span>\n  </button>\n</div>\n<gi-modal visible="showDeleteModal"\n        title="Please Confirm Delete Action">\n  <div class="body">\n    <p>Delete a role - are you sure?</p>\n    <p>Please continue only if you are 100% \n      you understand what you\'re deleting.  \n      There is no way to retrieve the data after this point.</p>\n  </div>\n  <div class="footer">\n    <button ng-click="deleteRole()"\n            class="btn btn-danger">\n      Delete It!\n    </button>\n  </div>\n</gi-modal>');
$templateCache.put('gi-rolePicker.html','<div class="row">\n  <div id="board">\n    <div id="columns" >\n      <div class="column col-md-6">\n        <div class="columnHeader">\n          <span>Available</span>\n        </div>\n        <ul class="cards card-list" as-sortable\n        ng-model="model.availableItems">\n          <li as-sortable-item class="card"\n          ng-repeat="item in model.availableItems">\n            <div as-sortable-item-handle>{{item.name}}</div>\n          </li>\n        </ul>\n      </div>\n      <div class="column col-md-6">\n        <div class="columnHeader">\n          <span>Selected</span>\n        </div>\n        <ul class="cards card-list" as-sortable="dragControlListeners"\n        ng-model="model.chosenItems">\n          <li as-sortable-item class="card"\n          ng-repeat="item in model.chosenItems">\n            <div as-sortable-item-handle>{{item.name}}</div>\n          </li>\n        </ul>\n      </div>\n    </div>\n  </div>\n</div>\n');
$templateCache.put('gi-user.html','<div class="form" role="form">\n  <div class="form-group">\n    <label name="userName">Name: {{user.firstName}} {{ user.lastName }}</label>\n  </div>\n  <div class="form-group">\n    <label name="userId">Id: {{user._id}}</label>\n  </div>\n  <div class="form-group">\n    <label name="apiSecret">API Secret: {{user.apiSecret}}</label>\n  </div>\n  <div class="form-group">\n    <button class="btn btn-primary" ng-click="resetApi()">Create API Secret</button>\n  </div>\n</div>');
$templateCache.put('gi-userForm.html','<div class="well form">\n  <h4>Profile</h4>\n  <div class="form-group">\n    <label>First Name:</label>\n    <input  type="text" name="name" class="form-control" \n            ng-model="user.firstName" ng-change="checkForChanges()"/>\n  </div>\n  <div class="form-group">\n    <label>Surname:</label>\n    <input  type="text" name="lastName" class="form-control" \n            ng-model="user.lastName" ng-change="checkForChanges()"/>\n  </div>\n  <div class="form-group">\n    <label>Email:</label>\n    <input  type="text" name="email" class="form-control" \n            ng-model="user.email" ng-change="checkForChanges()" />\n  </div>\n  <div class="form-group">\n    <label>Password:</label>\n    <input  type="password" name="password" class="form-control" \n            ng-model="user.password" ng-change="checkForChanges()" />\n  </div>\n  <h4>Roles</h4>\n  <div class="form-group">\n    <h4>Assigned Roles</h4>\n    <div class="col-md-12" ng-repeat="role in userRoles">\n      <label>{{role.name}}</label>\n      <button class="btn btn-danger"\n              ng-click="removeFromRole(role)" >\n        <span class="glyphicon glyphicon-trash white"></span>\n      </button>\n    </div>\n    <div ng-if="notUserRoles.length > 0">\n      <h4>Available Roles</h4>\n      <select class="form-control"\n              ng-model="selectedRole" \n              ng-options="role.name for role in notUserRoles">\n      </select>\n      <button ng-click="addToRole(selectedRole)" \n              class="btn btn-primary">Assign</button>\n    </div>\n  </div>\n  <div class="form-group">\n    <button ng-disabled="!unsavedChanges" \n            class="btn btn-primary" \n            ng-click="save()">\n        {{submitText}}\n    </button>\n    <button ng-show="showDelete" \n            class="btn btn-danger" \n            ng-click="confirmDelete()" >\n      <span class="glyphicon glyphicon-trash white"></span>\n    </button>\n  </div>\n</div>\n\n<gi-modal visible="showDeleteModal"\n        title="Please Confirm Delete Action">\n  <div class="body">\n    <p>Delete a user - are you sure?</p>\n    <p>Please continue only if you are 100% \n      you understand what you\'re deleting.  \n      There is no way to retrieve the data after this point.</p>\n  </div>\n  <div class="footer">\n    <button ng-click="deleteUser()" \\\n            class="btn btn-danger">\n      Delete It!\n    </button>\n  </div>\n</gi-modal>');
$templateCache.put('gi-userManagement.html','<div class="container">\n  <div class="row">\n    <div class="col-md-2">\n      <ul class="nav nav-pills nav-stacked">\n        <li ng-class="{active: currentView == \'list\' }">\n          <a ng-click="show(\'list\')">All Users</a>\n        </li>\n        <li ng-class="{active: currentView == \'form\' }">\n          <a ng-click="show(\'form\')">New User</a>\n        </li>\n      </ul>\n    </div>\n    <div class="col-md-10">\n      <div>\n        <div ng-show="selectedUser" >\n          <div class="col-md-4">\n            <h4>Users</h4>\n            <ul class="nav nav-pills nav-stacked" ng-repeat="user in users" >\n              <li ng-class="{active: user._id == selectedUser._id}" >\n                <a \n                 ng-click="selectUser(user)">{{user.firstName}}</a>\n              </li>\n            </ul>\n          </div>\n          <div ng-show="currentView == \'list\'" class="col-md-8">\n            <user-form user="selectedUser" title="User Details" submit-text="Save Changes" submit="saveUser(user)" destroy="deleteUser(user)"></user-form>\n          </div>\n          <div ng-show="currentView == \'form\'" class="col-md-8">\n            <user-form title="New User" user="newUser" submit-text="Create User" submit="saveUser(user)"></user-form>\n          </div>\n        </div>      \n        <div ng-hide="selectedUser">\n          <div class="col-md-4">\n            <h4>Users</h4>\n            No Users found for this organisation.\n            You can create one by entering the details on this page.\n          </div>\n          <div class="col-md-4">\n            <h4>Create New User</h4>\n            <user-form title="New User" user="newUser" submit-text="Create User" submit="saveUser(user)"></user-form>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>');}]);
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
        var deferred,
    ref;
        deferred = $q.defer();
        if ((me != null ? (ref = me.user) != null ? ref.countryCode : void 0 : void 0) != null) {
          me.countryCode = me.user.countryCode;
          deferred.resolve(me);
        } else {
          Geo.country().then(function(code) {
            me.countryCode = code;
            return deferred.resolve(me);
          },
    function(error) {
            me.countryCode = "N/A";
            return deferred.resolve(me);
          });
        }
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
            return loginChanged().then(function() {
              return deferred.resolve();
            });
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
