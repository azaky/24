var gulp = require('gulp');
var sass = require('gulp-sass');
var runSequence = require('run-sequence');
 
gulp.task('sass', function () {
  gulp.src('./assets/css/24.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./assets/css'));
});
 
gulp.task('sass:watch', function () {
  gulp.watch('./assets/css/24.scss', ['sass']);
});

gulp.task('watch', function() {
  runSequence('sass', 'sass:watch');
});