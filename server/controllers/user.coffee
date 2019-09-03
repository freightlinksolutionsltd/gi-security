_ = require 'underscore'
gi = require 'gi-util'
qrcode = require "qrcode"
otplib = require "otplib"
base32 = require "base32"

logger = gi.common

module.exports = (model, crudControllerFactory) ->
  crud = crudControllerFactory(model)

  isUsernameAvailable = (req, res) ->
    systemId = req.systemId
    email = req.query.username
    if email?
      model.findOneBy 'email', email, systemId, (err, user) ->
        if err?
          if err is "Cannot find User"
            res.status(200).json({available: true}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
          else
            res.status(500).json({message: 'error searching by email: ' + err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else if (not user)
          res.status(200).json({available: true}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else
          res.status(200).json({available: false}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    else
      res.status(200).json({available: false}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  verify = (req, res) ->
    email = req.body.email
    password = req.body.password
    systemId = req.systemId
    output = {}

    if email? and password? and systemId?
      model.findOneBy 'email', email, systemId, (err, user) ->
        if err or (not user)
          res.status(200).json({valid: false}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else
          model.comparePassword user, password, (err, isValid) ->
            if err or (not isValid)
              res.status(200).json({valid: false}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            else
              output = user.toJSON()
              delete output._id
              delete output.systemId
              delete output.userIds
              delete output.password
              delete output.totpSecret
              output.valid = true
              res.status(200).json(output) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    else
      res.status(400).end("Required data not supplied")

  showMe = (req, res) ->
    model.findById req.user._id, req.systemId, (err, user) ->
      if err
        res.status(404).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      else
        user.password = null
        delete user.password
        user.totpSecret = null
        delete user.totpSecret
        res.status(200).json(user) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  updateMe = (req, res) ->
    #first check that the user we want to update is the user
    #making the request
    if req.user._id is not req.body._id
      res.status(401).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    else
      req.body.systemId = req.systemId
      model.update req.user._id, req.body, (err, user) ->
        if err
          res.status(404).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else
          user.password = null
          delete user.password
          user.totpSecret = null
          delete user.totpSecret
          res.status(200).json(user) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  destroyMe = (req, res) ->
    model.destroy req.user._id, req.systemId, (err) ->
      if err
        res.status(404).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      else
        res.status(200).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  generateAPISecretForMe = (req, res) ->
    if req.user._id is not req.body._id
      res.status(401).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    else
      model.resetAPISecret req.user._id, req.systemId, (err) ->
        if err
          res.status(404).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else
          res.status(200).json() #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  stripPasswords = (res) ->
    if _.isArray res.giResult
      _.each res.giResult, (r) ->
        r.obj.password = null
        delete r.obj.password
        r.obj.confirm = null
        delete r.obj.confirm
        r.obj.totpSecret = null
        delete r.obj.totpSecret
      res.status(res.giResultCode).json(res.giResult)
    else
      res.giResult.password = null
      delete res.giResult.password
      res.giResult.confirm = null
      delete res.giResult.confirm
      res.giResult.totpSecret = null
      delete res.giResult.totpSecret
      res.status(200).json(res.giResult) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  index = (req, res) ->
    crud.index req, res, () ->
      _.each res.giResult, (u) ->
        u.password = null
        delete u.password
        u.totpSecret = null
        delete u.totpSecret
      res.status(200).json(res.giResult) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  findById = (req, res) ->
    crud.show req, res, () ->
      stripPasswords res

  create = (req, res) ->
    req.body.createdById = req.user._id
    crud.create req, res, () ->
      stripPasswords res

  update = (req, res) ->
    crud.update req, res, () ->
      stripPasswords res

  checkResetToken = (req, res) ->
    if req.body.token?
      model.findOneBy 'token', req.body.token, req.systemId, (err, user) ->
        if err
          res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else if not user
          res.status(404).json({message: "invalid token"}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else
          res.status(200).json({message: "token ok"}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    else
      res.status(200).json({isValid: false}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  resetPassword = (req, res) ->
    if req.body.token?
      model.findOneBy 'token', req.body.token, req.systemId, (err, u) ->
        if err
          res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else if not u
          res.status(404).json({message: "invalid token"})
        else
          user = u.toObject()
          updateObj =
            password: req.body.password
            systemId: req.systemId
            $unset:
              token: ""
          model.update user._id, updateObj, (err, obj) ->
            if err
              res.status(500).json({message: "error saving token to user " + err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            else
              msg =
                message: "password reset sucesfully"
                email: user.email
              res.status(200).json(msg) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    else
      #look for a user with the specified e-mail
      #generate a random token
      model.findOneBy 'email', req.body.email, req.systemId, (err, user) ->
        if err
          res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else if not user?
          res.status(404).json({message: "Could not find account for that e-mail"})
        else
          model.generateToken (err, token) ->
            if err
              res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            else if not token
              res.status(500).json({message: "could not generate reset token"}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            else
              updateObj =
                token: token
                systemId: req.systemId

              model.update user._id, updateObj, (err, obj) ->
                if err
                  res.status(500).json({message: "error saving token to user " + err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                else
                  resetObj =
                    host: req.protocol + "://" + req.hostname #Changed 'req.host' to 'req.hostname' for express 4.x compatibility
                    email: user.email
                    token: token

                  model.sendResetInstructions resetObj, (err) ->
                    if err
                      res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                    else
                      msg = "password reset instructions sent"
                      res.status(200).json({message: msg}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility


  getResetToken = (req, res) ->
    if req.body.email?
      model.findOneBy 'email', req.body.email, req.systemId, (err, user) ->
        if err
          res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else if not user?
          res.status(404).json({message: "Could not find account for that e-mail"}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
        else
          model.generateToken (err, token) ->
            if err
              res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            else if not token
              res.status(500).json({message: "could not generate reset token"}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
            else
              updateObj =
                token: token
                systemId: req.systemId

              model.update user._id, updateObj, (err, obj) ->
                if err
                  res.status(500).json({message: "error saving token to user " + err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
                else
                  resetObj =
                    host: req.protocol + "://" + req.hostname #Changed 'req.host' to 'req.hostname' for express 4.x compatibility
                    email: user.email
                    token: token
                    _id: user._id

                  res.status(200).json(resetObj) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
    else
      res.status(500).json({ message:"No email passed." }) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility

  getQRCode = (req, res) ->
    _getSecret = (systemId, userId, cb) ->
      model.findOneBy '_id', userId, systemId, (err, user) ->
        if err
          cb err, null, null
        else
          if user.toObject().totpSecret
            cb null, user.email, user.toObject().totpSecret
          else
            secret = otplib.authenticator.generateSecret()
            model.update user._id, { systemId: req.systemId, $set: { totpSecret: secret }}, (err, newUser) ->
              cb err, user.email, secret || null

    if not req.user
      res.status(401).end()
    else
      _getSecret req.systemId, (req.params.id or req.user._id), (err, email, secret) ->
        if err
          res.status(500).send("Unable to generate secret")
        else
          appName = "F2F2"
          if process.env["F2F2_ENV"] isnt "prod" then appName += "-" + process.env["F2F2_ENV"]
          otpauth = otplib.authenticator.keyuri(encodeURIComponent(email), encodeURIComponent(appName), secret)
          qrcode.toDataURL otpauth, (err, imageUrl) ->
            if err
              res.status(500).send("Unable to generate QR Code");
            else
              res.set "Content-Type", "image/png"
              res.set "Content-Length", imageUrl.length
              imageUrl = imageUrl.split(",")[1]
              buff = Buffer.from imageUrl, "base64"
              res.status(200).send(buff); 

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
  exports.isUsernameAvailable = isUsernameAvailable
  exports.getQRCode = getQRCode
  exports
