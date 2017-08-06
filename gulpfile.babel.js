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
import pump from 'pump'
import browserSync from 'browser-sync'
import fs from 'fs'
import webpackConfig from './webpack.config'

const sync = browserSync.create()
const plugins = gulpLoadPlugins()
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

gulp.task('clean', () => del(['build']))

gulp.task('html', () => pump([
  gulp.src('src/markup/templates/**/*.pug'),
  plugins.pug({ pretty: true }),
  gulp.dest('build/'),
  sync.stream(),
]))

gulp.task('fonts', () => pump([
  gulp.src('src/fonts/*'),
  plugins.newer('build/fonts/'),
  gulp.dest('build/fonts/'),
]))

gulp.task('css', () => {
  const processors = [
    autoprefixer({ browsers: ['last 2 versions'] }),
    flexboxFixes(),
    mqpacker(),
  ]
  return pump([
    gulp.src('src/styles/main.styl'),
    plugins.if(isDevelopment, plugins.sourcemaps.init()),
    plugins.stylus({
      use: [poststylus(processors)],
      'include css': true,
    }),
    plugins.if(isDevelopment, plugins.sourcemaps.write()),
    gulp.dest('build/css/'),
    sync.stream(),
    plugins.rename({ basename: 'main.min' }),
    plugins.cssnano(),
    gulp.dest('build/css/'),
  ])
})

gulp.task('img', () => pump([
  gulp.src('src/img/**/*'),
  plugins.newer('build/img/'),
  plugins.imagemin([
    plugins.imagemin.gifsicle({ interlaced: true }),
    plugins.imagemin.jpegtran({ progressive: true }),
    plugins.imagemin.optipng({ optimizationLevel: 3 }),
    plugins.imagemin.svgo({ plugins: [
      { removeViewBox: false },
      { cleanupIDs: true },
      { removeTitle: true },
    ] }),
  ]),
  gulp.dest('build/img/'),
  sync.stream(),
]))

gulp.task('js', () => pump([
  gulp.src('src/js/main.js'),
  plugins.if(isDevelopment, plugins.sourcemaps.init()),
  webpackStream(webpackConfig, webpack),
  plugins.if(isDevelopment, plugins.sourcemaps.write()),
  gulp.dest('build/js'),
  sync.stream(),
  plugins.rename({ basename: 'bundle.min' }),
  plugins.babel({ presets: ['babili'] }),
  gulp.dest('build/js'),
]))

gulp.task('serve', () => {
  sync.init({
    server: {
      baseDir: 'build/',
    },
    directory: true,
    open: true,
    notify: false,
    port: 3000,
    ghostMode: false,
    reloadOnRestart: true,
  })

  plugins.watch(['{components,styles}/**/*.styl', 'components', 'styles'], { cwd: 'src' }, (e) => {
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

    if (e.event === 'add') {
      if (~getIndex('components')) {
        fs.appendFileSync('src/styles/main.styl', `\n${assemblePath('components')}`)
      }

      if (~getIndex('styles')) {
        fs.appendFileSync('src/styles/main.styl', `\n${assemblePath('styles')}`)
      }

      return
    }

    if (e.event === 'unlink') {
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
  sequence(['html', 'fonts', 'css', 'js', 'img'], 'serve')
})

gulp.task('prod', () => {
  sequence(['html', 'fonts', 'css', 'js', 'img'])
})
