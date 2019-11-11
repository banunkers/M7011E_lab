const { GraphQLObjectType, GraphQLString, GraphQLSchema } = require("graphql");

const queryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    active: {
      type: GraphQLString,
      name: "active",
      resolve() {
        return true;
      }
    }
  }
});

const schema = new GraphQLSchema({ query: queryType });

module.exports = schema;
