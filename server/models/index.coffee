environments = require './environments'
files = require './files'
systems = require './systems'
users = require './users'
roles = require './roles'
settings = require './settings'
activities = require './activities'
categories = require './categories'
permissions = require './permissions'
logs = require './logs'

module.exports = (dal, options) ->
  environmentsModel = environments dal
  systems: systems dal
  environments: environmentsModel
  files: files dal
  users: users dal, options
  roles: roles dal
  settings: settings dal, environmentsModel
  activities: activities dal
  categories: categories dal
  permissions: permissions dal
  logs: logs dal
