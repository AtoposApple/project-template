import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'

const plugins = gulpLoadPlugins()

gulp.task('html', () => gulp.src('src/**/*.pug')
  .pipe(plugins.plumber({
    errorHandler: plugins.notify.onError(err => ({
      title: 'HTML task error',
      message: err.message
    }))
  }))
  .pipe(plugins.cached('html'))
  .pipe(plugins.if(global.isWatching, plugins.pugInheritance({
    basedir: 'src',
    skip: ['fonts', 'img', 'js', 'styles', 'svg']
  })))
  .pipe(plugins.filter(file => /templates/.test(file.path)))
  .pipe(plugins.pug({ pretty: true }))
  .pipe(plugins.rename({ dirname: '.' }))
  .pipe(gulp.dest('build')))
