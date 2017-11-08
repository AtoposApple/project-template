import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import flexboxFixes from 'postcss-flexbugs-fixes'
import autoprefixer from 'autoprefixer'
import poststylus from 'poststylus'
import mqpacker from 'css-mqpacker'

const plugins = gulpLoadPlugins()

gulp.task('css', () => {
  const processors = [
    autoprefixer({ browsers: ['last 2 versions'] }),
    flexboxFixes(),
    mqpacker()
  ]
  return gulp.src('src/styles/main.styl')
    .pipe(plugins.plumber({
      errorHandler: plugins.notify.onError(err => ({
        title: 'CSS task error',
        message: err.message
      }))
    }))
    .pipe(plugins.stylus({
      use: [poststylus(processors)],
      'include css': true
    }))
    .pipe(gulp.dest('build/css/'))
})
