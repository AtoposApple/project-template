import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import webpackStream from 'webpack-stream'
import webpack from 'webpack'
import notifier from 'node-notifier'
import browserSync from 'browser-sync'
import webpackConfig from '../../webpack.config'

const plugins = gulpLoadPlugins()
const sync = browserSync.create()

gulp.task('js', (callback) => {
  let firstBuildReady = false

  function done(err, stats) {
    firstBuildReady = true

    if (err) return

    if (stats.hasErrors()) {
      notifier.notify({
        title: 'Webpack',
        message: stats.toJson().errors[0],
        sound: 'Frog',
      })
    }


    plugins.util.log(stats.toString({ colors: true }))
  }

  gulp.src('src/js/main.js')
    .pipe(plugins.plumber({
      errorHandler: plugins.notify.onError(err => ({
        title: 'JS task error',
        message: err.message,
      })),
    }))
    .pipe(webpackStream(webpackConfig, webpack, done))
    .pipe(gulp.dest('build/js'))
    .on('data', () => {
      sync.reload()

      if (firstBuildReady && !callback.called) {
        callback.called = true
        callback()
      }
    })
})
