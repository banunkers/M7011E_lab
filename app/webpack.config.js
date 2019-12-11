const path = require("path");
const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: "./client/index.js"
  },
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: "/",
    filename: "[name].js"
  },
  target: "web",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "!!ejs-webpack-loader!client/views/pages/index.ejs"
    }),
    new HtmlWebPackPlugin({
      template: "!!ejs-webpack-loader!client/views/pages/login.ejs",
      filename: "login.html"
    }),
    new HtmlWebPackPlugin({
      template: "!!ejs-webpack-loader!client/views/pages/profile.ejs",
      filename: "profile.html"
    }),
    new HtmlWebPackPlugin({
      template: "!!ejs-webpack-loader!client/views/pages/register.ejs",
      filename: "register.html"
    })
  ]
};
