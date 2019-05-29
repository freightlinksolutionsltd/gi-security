module.exports = (dal) ->

  modelDefinition =
    name: 'Log'
    schemaDefinition:
      systemId: 'ObjectId'
      email: 'String'
      timestamp: 'Date'
      ipAddress: 'String'
      department: 'String'

  modelDefinition.schema = dal.schemaFactory modelDefinition
  model = dal.modelFactory modelDefinition
  dal.crudFactory model