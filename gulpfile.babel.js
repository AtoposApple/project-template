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
import webpackConfig from './webpack.config'
import registrator from './registrator'

const sync = browserSync.create()
const plugins = gulpLoadPlugins()
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

gulp.task('clean', () => del(['build']))

gulp.task('html', () => gulp.src('src/**/*.pug')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'HTML task error',
      message: err.message,
    })),
  }))
  .pipe(plugins.cached('html'))
  .pipe(plugins.if(global.isWatching, plugins.pugInheritance({
    basedir: 'src',
    skip: ['fonts', 'img', 'js', 'styles', 'svg'],
  })))
  .pipe(plugins.filter(file => /templates/.test(file.path)))
  .pipe(plugins.pug({ pretty: true }))
  .pipe(plugins.rename({ dirname: '.' }))
  .pipe(gulp.dest('build')))

gulp.task('fonts', () => gulp.src('src/fonts/**/*')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'Fonts task error',
      message: err.message,
    })),
  }))
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
        title: 'CSS task error',
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
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'CSS:min task error',
      message: err.message,
    })),
  }))
  .pipe(plugins.rename({ suffix: '.min' }))
  .pipe(plugins.cssnano())
  .pipe(gulp.dest('build/css/')))

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

gulp.task('js', () => gulp.src('src/js/main.js')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'JS task error',
      message: err.message,
    })),
  }))
  .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
  .pipe(webpackStream(webpackConfig, webpack))
  .pipe(plugins.if(isDevelopment, plugins.sourcemaps.write()))
  .pipe(gulp.dest('build/js')))

gulp.task('js:min', () => gulp.src('build/js/bundle.js')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'JS:min task error',
      message: err.message,
    })),
  }))
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
  plugins.watch(['{components,markup}/**/*.pug'], { cwd: 'src' }, () => sequence('html', sync.reload))
  plugins.watch(['{components,styles}/**/*.styl'], { cwd: 'src' }, (e) => {
    registrator(e)
    sequence('css')
  })
  plugins.watch(['{components,js}/**/*.js'], { cwd: 'src' }, (e) => {
    registrator(e)
    sequence('js', sync.reload)
  })
  plugins.watch(['fonts/**/*'], { cwd: 'src' }, () => sequence('fonts', sync.reload))
  plugins.watch(['{img,svg}/**/*'], { cwd: 'src' }, () => sequence('img', sync.reload))
})

gulp.task('default', () => {
  sequence(['html', 'fonts', 'css', 'js', 'img'], 'serve', 'watch')
})

gulp.task('prod', () => {
  sequence(['html', 'fonts', 'css', 'js', 'img'], ['css:min', 'js:min'])
})
