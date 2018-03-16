passport = require 'passport'
http = require 'http'
strategies = require './strategies'

module.exports = (users) ->
  passport.use new strategies.basic.Strategy(
    (email, password, systemId, done) ->
      users.findOneBy 'email', email, systemId, (err, user) ->
        if err
          done null, false, {message: err}
        else if not user
          done null, false, {message: 'User not found'}
        else
          users.comparePassword user, password, (err, isValid) ->
            if err
              done err
            else if not isValid
              done null, false, {message: 'Incorrect password'}
            else
              done null, user
  )

  routes: (app, middleware) ->
    app.post '/api/login'
    , middleware
    , passport.authenticate('basic')
    , (req, res) ->
      res.status(200).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility