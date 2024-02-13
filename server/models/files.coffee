module.exports = (dal) ->

  modelDefinition =
    name: 'File'
    schemaDefinition:
      systemId: 'ObjectId'
      parentId: 'String'
      parentType: 'String'
      name: 'String'
      sequence: 'Number'
      primary: 'Boolean'
      exclude: 'Boolean'
      order: 'Number'
      title: 'String'
      description: 'String'
      size: 'Number'
      s3alternates: ['String']
    
  modelDefinition.schema = dal.schemaFactory modelDefinition
  model = dal.modelFactory modelDefinition
  dal.crudFactory model