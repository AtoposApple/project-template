const gulp = require('gulp')
const plugins = require('gulp-load-plugins')()
const sync = require('browser-sync').create()
const sequence = require('run-sequence')
const webpackStream = require('webpack-stream')
const webpack2 = require('webpack')
const mqpacker = require('css-mqpacker')
const lost = require('lost')
const flexboxFixes = require('postcss-flexbugs-fixes')
const use = require('postcss-use')
const del = require('del')
const autoprefixer = require('autoprefixer')
const rupture = require('rupture')
const poststylus = require('poststylus')

gulp.task('clean', () => del(['build']))

gulp.task('html', () => gulp.src(['src/templates/**/*.pug', '!src/templates/layout/*.pug'])
  .pipe(plugins.pug({ pretty: true }))
  .pipe(gulp.dest('build/')
  .on('end', sync.reload)))

gulp.task('fonts', () => gulp.src('src/fonts/*')
  .pipe(gulp.dest('build/fonts/')))

gulp.task('css', () => {
  const processors = [
    autoprefixer({ browsers: ['last 2 versions'] }),
    flexboxFixes(),
    mqpacker(),
    lost(),
    use({ modules: ['lost'] }),
  ]
  return gulp.src('src/styles/**/*.styl')
      .pipe(plugins.ignore('**/_*.styl'))
      .pipe(plugins.stylus({
        use: [rupture(), poststylus(processors)],
        'include css': true,
      }))
      .on('error', (error) => { console.error(error) })
      .pipe(gulp.dest('build/css/'))
      .pipe(sync.stream())
})

gulp.task('cssmin', () => gulp.src('build/css/*.css')
  .pipe(plugins.rename({ basename: 'main.min' }))
  .pipe(plugins.cssnano())
  .pipe(gulp.dest('build/css/')))


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
    .pipe(webpackStream(require('./webpack.config.js'), webpack2))
    .pipe(gulp.dest('build/js')))

gulp.task('jsmin', () => gulp.src('build/js/*.js')
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
  sequence('clean', ['html', 'fonts', 'css', 'js', 'img'], ['jsmin', 'cssmin'], 'serve')
})

gulp.task('prod', () => {
  sequence('clean', ['html', 'fonts', 'css', 'js', 'img'], ['jsmin', 'cssmin'])
})
