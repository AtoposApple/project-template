import path from 'path'
import webpack from 'webpack'

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

const config = {
  entry: './src/js/main.js',
  output: {
    path: path.resolve(__dirname, './build/js'),
    filename: 'bundle.js',
  },
  devtool: isDevelopment ? 'inline-source-map' : null,
  watch: isDevelopment,
  cache: true,
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
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
  ],
}

export { config as default }
