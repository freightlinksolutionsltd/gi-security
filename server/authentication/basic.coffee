passport = require 'passport'
http = require 'http'
strategies = require './strategies'

module.exports = (users) ->
  passport.use new strategies.basic.Strategy(
    (email, password, systemId, done) ->
      #users.findOneBy 'email', email, systemId, (err, user) ->
      console.log "Logging in " + email
      opts =
        systemId: systemId
        email: email
        "roles.0":
          $exists: true
      users.findOne opts, (err, user) ->
        if err
          console.log err
          done null, false, {message: err}
        else if not user
          console.log "no user"
          done null, false, {message: 'User not found'}
        else
          users.comparePassword user, password, (err, isValid) ->
            if err
              console.log "pwd err " + err
              done err
            else if not isValid
              console.log "Bad pwd"
              done null, false, {message: 'Incorrect password'}
            else
              console.log "got " + user.firstName
              done null, user
  )

  routes: (app, middleware) ->
    app.post '/api/login'
    , middleware
    , passport.authenticate('basic')
    , (req, res) ->
      res.status(200).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility