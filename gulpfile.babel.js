import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import sequence from 'run-sequence'
import webpackStream from 'webpack-stream-fixed'
import webpack from 'webpack'
import mqpacker from 'css-mqpacker'
import flexboxFixes from 'postcss-flexbugs-fixes'
import del from 'del'
import autoprefixer from 'autoprefixer'
import poststylus from 'poststylus'
import browserSync from 'browser-sync'
import fs from 'fs'
import webpackConfig from './webpack.config'

const sync = browserSync.create()
const plugins = gulpLoadPlugins()
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

gulp.task('clean', () => del(['build']))

gulp.task('html', () => gulp.src('src/**/*.pug')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'HTML task: error',
      message: err.message,
    })),
  }))
  .pipe(plugins.cached('html'))
  .pipe(plugins.if(global.isWatching, plugins.pugInheritance({ basedir: 'src', skip: ['fonts', 'img', 'js', 'styles', 'svg'] })))
  .pipe(plugins.filter(file => /templates/.test(file.path)))
  .pipe(plugins.pug({ pretty: true }))
  .pipe(plugins.rename({ dirname: '.' }))
  .pipe(gulp.dest('build')))


gulp.task('fonts', () => gulp.src('src/fonts/**/*')
  .pipe(plugins.newer('build/fonts/'))
  .pipe(gulp.dest('build/fonts/')))

gulp.task('css', () => {
  const processors = [
    autoprefixer({ browsers: ['last 2 versions'] }),
    flexboxFixes(),
    mqpacker(),
  ]
  return gulp.src('src/styles/main.styl')
    .pipe(plugins.plumber({
      errorHandler: plugins.notify.onError(err => ({
        title: 'CSS task: error',
        message: err.message,
      })),
    }))
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
    .pipe(plugins.stylus({
      use: [poststylus(processors)],
      'include css': true,
    }))
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.write()))
    .pipe(gulp.dest('build/css/'))
    .pipe(sync.stream())
})

gulp.task('css:min', () => gulp.src('build/css/main.css')
  .pipe(plugins.rename({ suffix: '.min' }))
  .pipe(plugins.cssnano())
  .pipe(gulp.dest('build/css/')))

gulp.task('img', () => gulp.src('src/img/**/*')
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

gulp.task('js', () => gulp.src('src/js/main.js')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'JS task: error',
      message: err.message,
    })),
  }))
  .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
  .pipe(webpackStream(webpackConfig, webpack))
  .pipe(plugins.if(isDevelopment, plugins.sourcemaps.write()))
  .pipe(gulp.dest('build/js')))

gulp.task('js:min', () => gulp.src('build/js/bundle.js')
  .pipe(plugins.rename({ suffix: '.min' }))
  .pipe(plugins.babel({ presets: ['babili'] }))
  .pipe(gulp.dest('build/js')))


gulp.task('serve', () => {
  sync.init({
    server: {
      baseDir: 'build/',
    },
    directory: true,
    open: true,
    port: 3000,
    reloadOnRestart: true,
  })
})

gulp.task('watch', () => {
  global.isWatching = true

  plugins.watch(['{components,markup}/**/*.pug'], { cwd: 'src' }, (e) => {
    console.log(e.path, e.event, e.extname)
    sequence('html', sync.reload)
  })
  plugins.watch(['{components,styles}/**/*.styl'], { cwd: 'src' }, (e) => {
    const fullPath = e.path

    function getIndex(str) {
      const index = fullPath.indexOf(str)
      return index
    }

    function assemblePath(str) {
      let cutPath
      let assembledPath

      switch (str) {
        case 'components':
          cutPath = fullPath.slice(getIndex('components'))
          assembledPath = `@require "../${cutPath}"`
          break
        case 'styles':
          cutPath = fullPath.slice(getIndex('styles') + 'styles'.length + 1)
          assembledPath = `@require "${cutPath}"`
          break
        default:
          return false
      }

      return assembledPath
    }

    function deleteStr(type) {
      const data = fs.readFileSync('src/styles/main.styl', 'utf-8')
      const contentArr = data.split('\n')
      fs.writeFileSync('src/styles/main.styl', contentArr.filter(item => item !== assemblePath(type)).join('\n'))
    }

    if (e.event === 'add' && e.extname === '.styl') {
      if (~getIndex('components')) {
        fs.appendFileSync('src/styles/main.styl', `\n${assemblePath('components')}`)
      }

      if (~getIndex('styles')) {
        fs.appendFileSync('src/styles/main.styl', `\n${assemblePath('styles')}`)
      }

      return
    }

    if (e.event === 'unlink' && e.extname === '.styl') {
      if (~getIndex('components')) {
        deleteStr('components')
      }
      if (~getIndex('styles')) {
        deleteStr('styles')
      }

      return
    }

    sequence('css')
  })
})

gulp.task('default', () => {
  sequence(['html', 'fonts', 'css', 'js', 'img'], 'serve', 'watch')
})

gulp.task('prod', () => {
  sequence(['html', 'fonts', 'css', 'js', 'img'], ['css:min', 'js:min'])
})
