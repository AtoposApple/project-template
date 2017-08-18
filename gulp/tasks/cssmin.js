import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'

const plugins = gulpLoadPlugins()

gulp.task('css:min', () => gulp.src('build/css/main.css')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'CSS:min task error',
      message: err.message
    }))
  }))
  .pipe(plugins.rename({ suffix: '.min' }))
  .pipe(plugins.cssnano())
  .pipe(gulp.dest('build/css/')))
