_ = require 'underscore'
gi = require 'gi-util'

module.exports = (model, crudControllerFactory) ->
  crud = crudControllerFactory(model)

  verify = (req, res) ->
    email = req.body.email
    password = req.body.password
    systemId = req.systemId
    output = {}

    if email? and password? and systemId?
      model.findOneBy 'email', email, systemId, (err, user) ->
        if err or (not user)
          res.json 200, {valid: false}
        else
          model.comparePassword user, password, (err, isValid) ->
            if err or (not isValid)
              res.json 200, {valid: false}
            else
              output = user.toJSON()
              delete output._id
              delete output.systemId
              delete output.userIds
              delete output.password
              output.valid = true
              res.json 200, output
    else
      res.status(400).end("Required data not supplied")

  showMe = (req, res) ->
    model.findById req.user._id, req.systemId, (err, user) ->
      if err
        res.json 404, {message: err}
      else
        user.password = null
        delete user.password
        res.json 200, user
  updateMe = (req, res) ->
    #first check that the user we want to update is the user
    #making the request
    if req.user._id is not req.body._id
      res.json 401
    else
      req.body.systemId = req.systemId
      model.update req.user._id, req.body, (err, user) ->
        if err
          res.json 404
        else
          user.password = null
          delete user.password
          res.json 200, user

  destroyMe = (req, res) ->
    model.destroy req.user._id, req.systemId, (err) ->
      if err
        res.json 404
      else
        res.json 200

  generateAPISecretForMe = (req, res) ->
    if req.user._id is not req.body._id
      res.json 401
    else
      model.resetAPISecret req.user._id, req.systemId, (err) ->
        if err
          res.json 404
        else
          res.json 200

  stripPasswords = (res) ->
    if _.isArray res.giResult
      _.each res.giResult, (r) ->
        r.obj.password = null
        delete r.obj.password
        r.obj.confirm = null
        delete r.obj.confirm
      res.json res.giResultCode, res.giResult
    else
      res.giResult.password = null
      delete res.giResult.password
      res.giResult.confirm = null
      delete res.giResult.confirm
      res.json 200, res.giResult

  index = (req, res) ->
    crud.index req, res, () ->
      _.each res.giResult, (u) ->
        u.password = null
        delete u.password
      res.json 200, res.giResult

  findById = (req, res) ->
    crud.show req, res, () ->
      stripPasswords res

  create = (req, res) ->
    crud.create req, res, () ->
      stripPasswords res

  update = (req, res) ->
    crud.update req, res, () ->
      stripPasswords res

  checkResetToken = (req, res) ->
    if req.body.token?
      model.findOneBy 'token', req.body.token, req.systemId, (err, user) ->
        if err
          res.json 500, {message: err}
        else if not user
          res.json 404, {message: "invalid token"}
        else
          res.json 200, {message: "token ok"}
    else
      res.json 200, {isValid: false}

  resetPassword = (req, res) ->
    if req.body.token?
      model.findOneBy 'token', req.body.token, req.systemId, (err, u) ->
        if err
          res.json 500, {message: err}
        else if not u
          res.json 404, {message: "invalid token"}
        else
          user = u.toObject()
          updateObj =
            password: req.body.password
            systemId: req.systemId
            $unset:
              token: ""
          model.update user._id, updateObj, (err, obj) ->
            if err
              res.json 500, {message: "error saving token to user " + err}
            else
              msg =
                message: "password reset sucesfully"
                email: user.email
              res.json 200, msg
    else
      #look for a user with the specified e-mail
      #generate a random token
      model.findOneBy 'email', req.body.email, req.systemId, (err, user) ->
        if err
          res.json 500, {message: err}
        else if not user?
          res.json 404, {message: "Could not find account for that e-mail"}
        else
          model.generateToken (err, token) ->
            if err
              res.json 500, {message: err}
            else if not token
              res.json 500, {message: "could not generate reset token"}
            else
              updateObj =
                token: token
                systemId: req.systemId

              model.update user._id, updateObj, (err, obj) ->
                if err
                  res.json 500, {message: "error saving token to user " + err}
                else
                  resetObj =
                    host: req.protocol + "://" + req.host
                    email: user.email
                    token: token

                  model.sendResetInstructions resetObj, (err) ->
                    if err
                      res.json 500, {message: err}
                    else
                      msg = "password reset instructions sent"
                      res.json 200, {message: msg}


  getResetToken = (req, res) ->
    if req.body.email?
      model.findOneBy 'email', req.body.email, req.systemId, (err, user) ->
        if err
          res.json 500, {message: err}
        else if not user?
          res.json 404, {message: "Could not find account for that e-mail"}
        else
          model.generateToken (err, token) ->
            if err
              res.json 500, {message: err}
            else if not token
              res.json 500, {message: "could not generate reset token"}
            else
              updateObj =
                token: token
                systemId: req.systemId

              model.update user._id, updateObj, (err, obj) ->
                if err
                  res.json 500, {message: "error saving token to user " + err}
                else
                  resetObj =
                    host: req.protocol + "://" + req.host
                    email: user.email
                    token: token
                    _id: user._id

                  res.json 200, resetObj
    else
      res.json 500, { message:"No email passed." }

  exports = gi.common.extend {}, crud
  exports.index = index
  exports.show = findById
  exports.create = create
  exports.update = update
  exports.showMe = showMe
  exports.updateMe = updateMe
  exports.destroyMe = destroyMe
  exports.generateAPISecretForMe = generateAPISecretForMe
  exports.resetPassword = resetPassword
  exports.getResetToken = getResetToken
  exports.checkResetToken = checkResetToken
  exports.verify = verify
  exports
