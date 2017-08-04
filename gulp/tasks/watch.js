import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import browserSync from 'browser-sync'
import sequence from 'run-sequence'
import registrator from '../helpers/registrator'

const plugins = gulpLoadPlugins()
const sync = browserSync.create()

gulp.task('watch', () => {
  global.isWatching = true
  plugins.watch(['{components,markup}/**/*.pug'], { cwd: 'src' }, () => sequence('html', sync.reload))
  plugins.watch(['{components,styles}/**/*.styl'], { cwd: 'src' }, (e) => {
    registrator(e)
    sequence('css')
  })
  plugins.watch(['{components,js}/**/*.js'], { cwd: 'src' }, (e) => {
    console.log(e.event)
    registrator(e)
  })
  plugins.watch(['fonts/**/*'], { cwd: 'src' }, () => sequence('fonts', sync.reload))
  plugins.watch(['{img,svg}/**/*'], { cwd: 'src' }, () => sequence('img', sync.reload))
})
