import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import webpackStream from 'webpack-stream-fixed'
import webpack from 'webpack'
import browserSync from 'browser-sync'
import notifier from 'node-notifier'
import webpackConfig from '../../webpack.config'

const plugins = gulpLoadPlugins()
global.isWatching = false

gulp.task('js', (callback) => {
  let firstBuildReady = false

  function done (err, stats) {
    firstBuildReady = true

    if (err) return

    if (stats.hasErrors()) {
      notifier.notify({
        title: 'Webpack',
        message: stats.toJson().errors[0],
        sound: 'Frog'
      })
    }

    plugins.util.log(stats.toString({ colors: true }))
  }

  gulp.src('src/js/main.js')
    .pipe(plugins.plumber({
      errorHandler: plugins.notify.onError(err => ({
        title: 'JS task error',
        message: err.message
      }))
    }))
    .pipe(webpackStream(webpackConfig, webpack, done))
    .pipe(gulp.dest('build/js'))
    .on('data', () => {
      if (global.isWatching) {
        const sync = browserSync.get('server')
        sync.reload()
      }
      if (firstBuildReady && !callback.called) {
        callback.called = true
        callback()
      }
    })
})
