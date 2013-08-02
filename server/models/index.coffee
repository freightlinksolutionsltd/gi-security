environments = require './environments'
files = require './files'
systems = require './systems'
users = require './users'
roles = require './roles'
settings = require './settings'
activities = require './activities'
categories = require './categories'

module.exports = (mongoose, crudModelFactory) ->
  environmentsModel = environments mongoose, crudModelFactory
  filesModel = files mongoose, crudModelFactory
  
  systems: systems mongoose, crudModelFactory
  environments: environmentsModel
  files: filesModel
  users: users mongoose, crudModelFactory
  roles: roles mongoose, crudModelFactory
  settings: settings mongoose, crudModelFactory, environmentsModel
  activities: activities mongoose, crudModelFactory
  categories: categories mongoose, crudModelFactory, filesModel
