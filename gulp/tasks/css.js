import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import flexboxFixes from 'postcss-flexbugs-fixes'
import autoprefixer from 'autoprefixer'
import poststylus from 'poststylus'
import mqpacker from 'css-mqpacker'
import browserSync from 'browser-sync'

const plugins = gulpLoadPlugins()
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const sync = browserSync.create()


gulp.task('css', () => {
  const processors = [
    autoprefixer({ browsers: ['last 2 versions'] }),
    flexboxFixes(),
    mqpacker(),
  ]
  return gulp.src('src/styles/main.styl')
    .pipe(plugins.plumber({
      errorHandler: plugins.notify.onError(err => ({
        title: 'CSS task error',
        message: err.message,
      })),
    }))
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
    .pipe(plugins.stylus({
      use: [poststylus(processors)],
      'include css': true,
    }))
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
    .pipe(gulp.dest('build/css/'))
    .pipe(sync.stream())
})
