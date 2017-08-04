import requireDir from 'require-dir'
import gulp from 'gulp'
import sequence from 'run-sequence'

requireDir('gulp/tasks', { recurse: true })

gulp.task('default', () => {
  sequence(['html', 'fonts', 'css', 'js', 'img'], 'serve', 'watch')
})

gulp.task('prod', () => {
  sequence(['html', 'fonts', 'css', 'js', 'img'], ['css:min', 'js:min'])
})
