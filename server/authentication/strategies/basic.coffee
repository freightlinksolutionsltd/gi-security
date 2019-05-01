passport = require 'passport'
util = require 'util'
crypto = require 'crypto'

Strategy = (options, verify) ->
  if (typeof options == 'function')
    verify = options
    options = {}

  if not verify
    throw new Error('basic strategy requires a verify function')
  
  @_userNameField = options.userNameField or 'username'
  @_passwordField = options.passwordField or 'password'
  @_tokenField = options.tokenField or 'token'
  
  passport.Strategy.call this
  @name = 'basic'
  @_verify = verify
  @_passReqToCallback = options.passReqToCallback
  null

# Inherit from `passport.Strategy`.
util.inherits Strategy, passport.Strategy

Strategy::authenticate = (req, options) ->
  #console.log("authentication/strategies/basic.coffee - Inside Strategy::authenticate()")
  options = options or {}

  username = req.body[@_userNameField] or undefined
  password = req.body[@_passwordField] or undefined
  token = req.body[@_tokenField]  or undefined
  systemId = req.systemId or undefined

  #SR - now check for the existence of an "Authorization" header and, if found, resolve the username and password from that
  if not username
    if req.headers.authorization
      usernameAndPasswordPair = new Buffer(req.headers.authorization.split(" ")[1], 'base64').toString().split(":")
      username = usernameAndPasswordPair[0]
      password = usernameAndPasswordPair[1]

  if not username or not password
    return @fail {message: 'Credentials not found'}

  verified = (err, user, info) =>
    if err
      @error err
    else if not user
      @fail info
    else
      @success user, info

  if @_passReqToCallback
    @_verify req, username, password, token, systemId, verified
  else
    @_verify username, password, token, systemId, verified

# Expose `Strategy`.
exports.Strategy = Strategy