import gulp from 'gulp'
import browserSync from 'browser-sync'

const sync = browserSync.create('server')

gulp.task('serve', () => {
  sync.init({
    server: {
      baseDir: 'build/'
    },
    directory: true,
    open: true,
    port: 3000,
    reloadOnRestart: true
  })
})
