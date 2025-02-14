gi = require '@freightlinksolutionsltd/gi-util'
user = require './user'
activity = require './activity'
file = require './file'
conFac = gi.common.crudControllerFactory
module.exports = (app) ->
  user:         user app.models.users, conFac
  activity:     activity app.models.activities, conFac
  file:         file app.models, conFac
  role:         conFac app.models.roles
  setting:      conFac app.models.settings
  category:     conFac app.models.categories
  system:       conFac app.models.systems
  environment:  conFac app.models.environments
  permission:   conFac app.models.permissions