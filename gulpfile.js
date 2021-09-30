const gulp = require('gulp');
const zip = require('gulp-zip');
const { version } = require('./package.json');

function createZip() {
  return gulp.src(['dist/*'], { base: 'dist' })
    .pipe(zip(`nhsuk-comments-${version}.zip`))
    .pipe(gulp.dest('dist'));
}

gulp.task('zip', gulp.series([
  createZip,
]));