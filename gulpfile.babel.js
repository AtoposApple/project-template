import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import browserSync from 'browser-sync'
import sequence from 'run-sequence'
import webpackStream from 'webpack-stream-fixed'
import webpack from 'webpack'
import mqpacker from 'css-mqpacker'
import flexboxFixes from 'postcss-flexbugs-fixes'
import del from 'del'
import autoprefixer from 'autoprefixer'
import poststylus from 'poststylus'
import webpackConfig from './webpack.config'

const plugins = gulpLoadPlugins()
const sync = browserSync.create()
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

gulp.task('clean', () => del(['build']))

gulp.task('html', () => gulp.src(['src/templates/**/*.pug', '!src/templates/layout/*.pug'])
  .pipe(plugins.pug({ pretty: true }))
  .pipe(gulp.dest('build/'))
  .pipe(sync.stream()))

gulp.task('fonts', () => gulp.src('src/fonts/*')
  .pipe(gulp.dest('build/fonts/')))

gulp.task('css', () => {
  const processors = [
    autoprefixer({ browsers: ['last 2 versions'] }),
    flexboxFixes(),
    mqpacker(),
  ]
  return gulp.src('src/styles/**/*.styl')
      .pipe(plugins.ignore('**/_*.styl'))
      .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
      .pipe(plugins.stylus({
        use: [poststylus(processors)],
        'include css': true,
      }))
      .on('error', (error) => { console.error(error) })
      .pipe(plugins.if(isDevelopment, plugins.sourcemaps.write()))
      .pipe(gulp.dest('build/css/'))
      .pipe(sync.stream())
      .pipe(plugins.rename({ basename: 'main.min' }))
      .pipe(plugins.cssnano())
      .pipe(gulp.dest('build/css/'))
})

gulp.task('img', () => gulp.src('src/img/**/*')
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
    .pipe(gulp.dest('build/img/'))
    .pipe(sync.stream()))

gulp.task('js', () => gulp.src('src/js/main.js')
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.write()))
    .pipe(gulp.dest('build/js'))
    .pipe(sync.stream())
    .pipe(plugins.rename({ basename: 'bundle.min' }))
    .pipe(plugins.babel({ presets: ['babili'] }))
    .pipe(gulp.dest('build/js')))

gulp.task('serve', () => {
  sync.init({
    server: {
      baseDir: 'build/',
    },
    directory: true,
    open: true,
  })
  gulp.watch('src/**/*.styl', ['css'])
  gulp.watch('src/templates/**/*.pug', ['html'])
  gulp.watch('src/**/*.js', ['js'])
  gulp.watch('src/img/*', ['img'])
})

gulp.task('default', () => {
  sequence('clean', ['html', 'fonts', 'css', 'js', 'img'], 'serve')
})

gulp.task('prod', () => {
  sequence('clean', ['html', 'fonts', 'css', 'js', 'img'])
})
