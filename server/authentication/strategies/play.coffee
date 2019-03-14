passport = require 'passport'
util = require 'util'
http = require 'http'
_ = require 'underscore'
moment = require 'moment'

Strategy = (options, verify) ->
  if (typeof options == 'function')
    verify = options
    options = {}

  if not verify
    throw new Error('play strategy requires a verify function')
  
  @_cookieField = options.cookieName or 'PLAY_SESSION'
  
  passport.Strategy.call this
  @name = 'play'
  @_verify = verify
  @_passReqToCallback = options.passReqToCallback
  return

# Inherit from `passport.Strategy`.
util.inherits Strategy, passport.Strategy

cache = {}

Strategy::authenticate = (req) ->
  if req.headers.cookie?

    cookies = req.headers.cookie.split ';'
    playCookie = _.find cookies, (cookie) =>
      cookie.split('=')[0].trim() is @_cookieField

    if playCookie?
      userId = playCookie.split('-user_id%3A')[1]
      systemId = req.systemId

      playRequestOptions =
        host: req.hostname #Changed 'req.host' to 'req.hostname' for express 4.x compatibility
        port: 80
        path: '/cookievalidator'
        headers:
          Cookie: playCookie
          ContentType: 'application/json'


      verified = (err, user, info) =>
        if err
          @error err
        else if not user
          @fail info
        else
          @success user, info

      that = @
      isValidatedInCache = false

      if cache[userId]?
        now = moment()
        if moment(cache[userId]).isAfter(now)
          isValidatedInCache = true

      if isValidatedInCache
        if that._passReqToCallback
          that._verify req, userId, systemId, verified
        else
          that._verify userId, systemId, verified
      else

        playRequest = http.request playRequestOptions, (res) ->

          if res.statusCode is 200
            cache[userId] = moment().add('days', 1)
            if that._passReqToCallback
              that._verify req, userId, systemId, verified
            else
              that._verify userId, systemId, verified
          else
            that.fail { message: 'Not Authorized'}
        
        playRequest.on 'error', (e) ->
          that.fail { message: 'problem with request: ' + e.message }
        
        playRequest.end()

    else
      @fail 'Not signed into play'
  else
    @fail 'No cookie found on request'

# Expose `Strategy`.
exports.Strategy = Strategy