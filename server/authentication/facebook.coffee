passport = require 'passport'
http = require 'http'
strategies = require './strategies'

module.exports = (users) ->
  passport.use new strategies.facebook.Strategy( (facebookid, systemId, done) ->
    http.get "http://graph.facebook.com/" +
    facebookid + "?fields=id%2Cname", (res) ->

      data = ''

      res.on 'data', (chunk) ->
        data += chunk

      res.on 'end', () ->
        body = JSON.parse data
        users.findOrCreate
          name: body.name
          systemId: systemId
          providerId : body.id
          userIds: [{provider: 'Facebook', providerId: body.id}]
        , (err, user) ->
          done(err, user)

    .on 'error', (e) ->
      done e.message, null
  )

  routes: (app, middleware) ->
    app.post '/api/loginviafacebook'
    , middleware
    , passport.authenticate('facebook-sdk')
    , (req, res) ->
      res.status(200).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility