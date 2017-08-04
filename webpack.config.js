import path from 'path'

const config = {
  entry: './src/js/main.js',
  output: {
    path: path.resolve(__dirname, './build/js'),
    filename: 'bundle.js',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
        }],
      },
    ],
  },
}

export { config as default }
