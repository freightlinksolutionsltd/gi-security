_ = require 'underscore'
gi = require 'gi-util'

module.exports = (app) ->
  #Returns a middleware function that embelisshes
  #req.giFilter with information used to filter results
  #based on permissions

  flags =
    NONE: 1
    CREATE: 2
    READ: 4
    UPDATE: 8
    DESTROY: 16

  (req, res, next) ->
   
    options =
      query:
        systemId: req.systemId
        userId: req.user.id

    app.models.permissions.find options, (err, results) ->
      if err
        res.status(500).json({message: err}) #Changed 'res.json(status,obj)' to 'res.status(status).json(obj)' for express 4.x compatibility
      else if results?
        req.giFilter = {}

        _.each results, (result) ->
          if not req.giFilter[result.resourceType]
            req.giFilter[result.resourceType] = {}

          resourceTypeFilter = req.giFilter[result.resourceType]

          if result.restriction & flags.NONE
            if not resourceTypeFilter.$nin?
              resourceTypeFilter.$nin = []

            #console.log 'we are denied access to customer(s): ' + result.keys
            gi.common.extend resourceTypeFilter.$nin, result.keys

          if result.restriction & flags.CREATE
            resourceTypeFilter.create = true

          if result.restriction & flags.READ
            if not resourceTypeFilter.$in?
              resourceTypeFilter.$in = []
            gi.common.extend resourceTypeFilter.$in, result.keys

        next()
      else
        next()