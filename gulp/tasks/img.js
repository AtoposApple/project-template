import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'

const plugins = gulpLoadPlugins()

gulp.task('img', () => gulp.src('src/{img,svg}/**/*')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'Img task error',
      message: err.message,
    })),
  }))
  .pipe(plugins.newer('build/img/'))
  .pipe(plugins.imagemin([
    plugins.imagemin.gifsicle({ interlaced: true }),
    plugins.imagemin.jpegtran({ progressive: true }),
    plugins.imagemin.optipng({ optimizationLevel: 3 }),
    plugins.imagemin.svgo({ plugins: [
      { removeViewBox: false },
      { cleanupIDs: true },
      { removeTitle: true },
    ] }),
  ]))
  .pipe(gulp.dest('build/img/')))
