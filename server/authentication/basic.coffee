passport = require 'passport'
http = require 'http'
strategies = require './strategies'
otplib = require "otplib"

module.exports = (users) ->
  passport.use new strategies.basic.Strategy(
    (email, password, token, systemId, done) ->
      #users.findOneBy 'email', email, systemId, (err, user) ->
      opts =
        systemId: systemId
        email: email
        "roles.0":
          $exists: true
      users.findOne opts, (err, user) ->
        if err
          done null, false, {message: err}
        else if not user
          done null, false, {message: 'User or password incorrect'}
        else
          users.comparePassword user, password, (err, isValid) ->
            if err
              done err
            else if not isValid
              done null, false, {message: 'User or password incorrect'}
            else
              user = user.toObject()
              if user.twoFactorEnabled
                if not token or token is ""
                  done null, false, { twoFactorRequired: "", message: "Second factor required" }
                else
                  if otplib.authenticator.check token, user.totpSecret
                    done null, user
                  else
                    done null, false, { message: 'Second factor is invalid' }
              else
                if err
                  done err
                else
                  done null, user
  )

  routes: (app, middleware) ->
    app.post '/api/login'
    , middleware
    , passport.authenticate('basic')
    , (req, res) ->
      res.status(200).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility