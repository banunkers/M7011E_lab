const express = require("express");
const expressGraphQL = require("express-graphql");
const { buildSchema } = require("graphql");
// GraphQL schema
const schema = buildSchema(`
    type Query {
        message: String
    }
`); // Root resolver
const root = {
  message: () => "Hello World!"
}; // Create an express server and a GraphQL endpoint
const app = express();
app.use(
  "/graphql",
  expressGraphQL({
    schema,
    rootValue: root,
    graphiql: true
  })
);
const port = 8080;
app.listen(port, () =>
  console.log(`Express GraphQL Server Now Running On localhost:${port}/graphql`)
);
