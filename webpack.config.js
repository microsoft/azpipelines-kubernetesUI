const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = {
  entry: {
    'azdevops-kube-summary': './src/index.ts',
    'azdevops-kube-summary.min': './src/index.ts'
  },
  output: {
    path: path.resolve(__dirname, '_bundles'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'azdevops-kube-summary',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: true,
        include: /\.min\.js$/,
        extractComments: "all"
      })
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new OptimizeCSSAssetsPlugin({})
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      },
      {
        test: /\.(sa|sc)ss$/,
          use: [
            "style-loader",
            MiniCssExtractPlugin.loader,
            "css-loader",
            "./buildScripts/css-variables-loader",
            "sass-loader"
          ]
      },
      {
        test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader"
          ]
      },
      {
        test: /\.woff$/,
        use: [{
          loader: 'base64-inline-loader'
        }]
      },
      {
        test: /\.html$/,
        loader: "file-loader"
      }
    ]
  },
  node: {
    fs: 'empty'
  },
  externals: {
    react: 'react',
    "react-dom": 'react-dom',
    "office-ui-fabric-react/lib/Pivot": "office-ui-fabric-react/lib/Pivot",
    "office-ui-fabric-react/lib/Utilities": "office-ui-fabric-react/lib/Utilities"
  }
}