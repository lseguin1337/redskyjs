const path = require('path');

module.exports = {
  mode: 'production',
  entry: './lib/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: path.join(__dirname, "./tsconfig.umd.json")
          },
        }],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'lib.umd.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'rds',
      type: 'umd'
    },
  },
};