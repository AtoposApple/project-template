import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'

const plugins = gulpLoadPlugins()

gulp.task('fonts', () => gulp.src('src/fonts/**/*')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'Fonts task error',
      message: err.message
    }))
  }))
  .pipe(plugins.newer('build/fonts/'))
.pipe(gulp.dest('build/fonts/')))
