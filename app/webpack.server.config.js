const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const dotenv = require("dotenv-webpack");

module.exports = {
  entry: {
    server: "./server/server.js"
  },
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: "/",
    filename: "[name].js"
  },
  target: "node",
  node: {
    __dirname: false,
    __filename: false
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  plugins: [new dotenv({ path: "./app.env" })]
};
