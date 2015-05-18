gi-security
-------------

[![Build Status](https://drone.io/github.com/GoIncremental/gi-security/status.png)](https://drone.io/github.com/GoIncremental/gi-security/latest)

This module provides a thin wrapper around passport-js, and client side user and role management.

It uses a custom HMAC authentication strategy to authenticate json api requests

It also supports session based security for human users logged in via facebook.

Testing:

Server Unit tests use Mocha, Chai

Client Unit tests use Mocha, Karma

Server Integration tests use Cucumber.js and supertest

### Release Notes
v1.0.10
- added /api/user/getResetToken for admins
- use gi-util 1.0.9 which adds count() functionality to find query callbacks

v1.0.9
- use gi-util 1.0.8 which fixes geo ip issue over ssl

v1.0.8
- user and me now have a countryCode property (model -> cookie -> ip lookup)

v1.0.7
- Added giRolePicker directive to allow user roles to be easily visualised

v1.0.6
- Added /api/user/verify POST method which can be used by admins to check credentials

v1.0.5
- Fixes an issue where users cannot be created if findByEmail returned {}

v1.0.4
- Removed deprecated use of User.create() service method in usersController

v1.0.3
- Updated angular version dependency to 1.2.28

v1.0.2
- Added updateQuery method to users model to allow flexible batch updates

v1.0.1
- Use latest gi-ui to avoid bower installation dependency conflict

v1.0.0
- BREAKING CHANGES  The Angular User and Role services have been switched to use promises and this release has been upgraded to be compatible with the 1.x series of gi-util

v0.3.10
- The email is returned in the json after a sucessful password reset (enables clients to auto login)

v0.3.9
- Fixes issue where password could be accidentally reset on update / save

v0.3.8
- Admin and sysadmin users can now read all settings (previously the only settings that would return from the api were those with 'public-read' acl)

v0.3.7
- Added password reset capability
