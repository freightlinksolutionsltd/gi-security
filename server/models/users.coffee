crypto = require 'crypto'
bcrypt = require 'bcryptjs'
gi = require 'gi-util'

module.exports = (dal, options) ->

  SALT_WORK_FACTOR = 10

  modelDefinition =
    name: 'User'
    schemaDefinition:
      systemId: 'ObjectId'
      firstName: 'String'
      lastName: 'String'
      email: 'String'
      password: 'String'
      apiSecret: 'String'
      countryCode: 'String'
      userIds: [{provider: 'String', providerId: 'String'}]
      roles: [{type: 'ObjectId', ref: 'Role'}]
    options:
      strict: false

  schema = dal.schemaFactory modelDefinition
  modelDefinition.schema = schema

  schema.virtual('name').get () ->
    @firstName + ' ' + @lastName

  schema.virtual('name').set (name) ->
    split = name.split ' '
    @firstName = split[0]
    @lastName = split[1]

  schema.methods.resetAPISecret = (callback) ->
    crypto.randomBytes 18, (err, buf) =>
      if err
        callback err
      else
        @apiSecret = buf.toString 'base64'
        @save callback


  schema.pre 'save', (next) ->
    user = @
    @confirm = ""

    if not @isModified('password')
      return next()

    bcrypt.genSalt SALT_WORK_FACTOR, (err, salt) ->
      if err
        return next(err)
      bcrypt.hash user.password, salt, (err, hash) ->
        if err
          return next(err)
        user.password = hash
        next()

  model = dal.modelFactory modelDefinition
  crud = dal.crudFactory model

  sendResetInstructions = (resetObj, cb) ->
    if options.sendResetInstructions?
      options.sendResetInstructions resetObj, cb
    else
      cb "sendResetInstructions function not defined"

  generateToken = (callback) ->
    crypto.randomBytes 18, (err, buf) =>
      if err
        callback err
      else
        token = buf.toString 'base64'
        callback null, token

  comparePassword = (user, candidate, callback) ->
    if model.comparePassword?
      model.comparePassword(user, candidate, callback)
    else
      if candidate?
        if user.password?
          bcrypt.compare candidate, user.password, (err, isMatch) ->
            if err
              return callback(err)
            callback null, isMatch
        else
          callback 'password authentication is not enabled for this user', false
      else
        callback 'password does not meet minimum requirements', false

  update = (id, json, callback) ->
    delete json.confirm
    crud.findById id, json.systemId, (err, user) ->
      if err
        callback err, null
      else
        if user
          #call save in case the password has changed
          if json.password
            user.password = json.password
            user.save (err, savedUser) ->
              if savedUser and savedUser.password
                json.password = savedUser.password
              crud.update id, json, callback
          else
            delete json.password
            crud.update id, json, callback
        else
          callback 'user not found', null

  findOneByProviderId = (id, systemId, callback) ->
    crud.findOneBy 'userIds.providerId', id, systemId, callback

  findOrCreate = (json, callback) ->
    delete json.confirm
    findOneByProviderId json.providerId, json.systemId (err, user) ->
      if user
        callback err, user
      else
        crud.create json, (err, user) ->
          callback err, user

  resetAPISecret = (id, systemId, callback) ->
    crud.findById id, systemId, (err, user) ->
      if err
        callback err
      else if user?
        user.resetAPISecret callback
      else
        callback 'cannot find user'

  create = (json, callback) ->
    delete json.confirm
    crud.findOneBy 'email', json.email, json.systemId , (err, user) ->
      if err and err isnt "Cannot find User"
        callback err, null
      else if user?.email is json.email
        callback 'Username already exists'
      else
        crud.create json, callback

  updateQuery = (query, change, callback) ->
    delete change.confirm
    if not query.systemId?
      callback 'SystemId not specified'
    else
      model.update query, change, {multi: true}, callback

  exports = gi.common.extend {}, crud
  exports.update = update
  exports.updateQuery = updateQuery
  exports.findOrCreate = findOrCreate
  exports.findOneByProviderId = findOneByProviderId
  exports.resetAPISecret = resetAPISecret
  exports.comparePassword = comparePassword
  exports.create = create
  exports.generateToken = generateToken
  exports.sendResetInstructions = sendResetInstructions
  exports
