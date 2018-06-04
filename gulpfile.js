////////////////////// ПОДКЛЮЧАЕМ ПЛАГИНЫ ////////////////////////////

var gulp = require('gulp'); // Подключаем Gulp
var less = require('gulp-less'); //Подключаем less пакет,
var browserSync = require('browser-sync'); // Подключаем Browser Sync
var server = require("browser-sync").create(); // подключаем еще один browser-sync
var path = require('path');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var autoprefixer = require("autoprefixer");
var mqpacker = require('css-mqpacker');
var minify = require('gulp-csso');
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var svgmin = require("gulp-svgmin");
var svgstore = require("gulp-svgstore");
var run = require('run-sequence');
var del = require('del');

/////////////////////////// Не рабочие варианты ///////////////////////////////

// gulp.task('less', ['less3'], function () { // Создаем таск less
//     return gulp.src('less/style.less') // Берем источник
//     //        .pipe(less([ path.join(__dirname, 'less', 'includes') ])) // Преобразуем less в CSS посредством gulp-less
//     //        .pipe(gulp.dest('css')) // Выгружаем результата в папку css
//         .pipe(browserSync.reload({stream: true})); // Обновляем CSS на странице при изменении
// });
//
// gulp.task('browser-sync', function () { // Создаем таск browser-sync
//     browserSync({ // Выполняем browserSync
//         server: { // Определяем параметры сервера
//             baseDir: '.' // Директория для сервера - .
//         },
//         notify: false // Отключаем уведомления
//     });
// });
//
// gulp.task('watch', ['less', 'browser-sync'], function () {
//     gulp.watch('less/**/*.less', ['less']); // Наблюдение за less файлами
//     // Наблюдение за другими типами файлов
// });
///////////////////////////////////////////////////////////////////



///////// РАБОТА С CSS /////////////////////////////

gulp.task('less3', function () {
    return gulp.src('src/less/style.less')
        .pipe(plumber())
        .pipe(less([path.join(__dirname, 'src/less')])) // Преобразуем less в CSS посредством gulp-less
        .pipe(postcss([
            autoprefixer({
                browsers: [
                    "last 1 version",
                    "last 2 Chrome versions",
                    "last 2 Firefox versions",
                    "last 2 Opera versions",
                    "last 2 Edge versions"
                ]
            }), // добавляем префиксы для указанных версий браузеров
            mqpacker({
                sort: true
            }) // объединяем медиавыражения
        ]))
        .pipe(gulp.dest('build/css')) // Выгружаем результата в папку css
        .pipe(minify())
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('build/css'));
        //.pipe(browserSync.reload({stream: true}));
});

//////////////////////////////////////////////////

///////// ОПТИМИЗИРУЕМ JPG И PNG //////////////////

gulp.task("images", function () {
    return  gulp.src("build/img/**/*.{png,jpg,gif}")
        .pipe(imagemin([
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.jpegtran({prograssive: true})
        ]))
        .pipe(gulp.dest('build/img'));

});
/////////////////////////////////////////////////////

/////////////// СБОРКА SVG СПРАЙТА ДЛЯ INLINE /////////////////

gulp.task('symbols', function () {
   return gulp.src('build/img/*.svg')
       .pipe(svgmin())
       .pipe(svgstore({
           inlineSvg: true
       }))
       .pipe(rename("symbols.svg"))
       .pipe(gulp.dest('build/img'));
});

//////////////////////////////////////////////////////

//////////////////// ВОТЧЕРЫ И СИНХРОНИЗАЦИЯ С БРАУЗЕРОМ ////////////////////
// еще одна функция для browser-sync :)

// gulp.task("serve", ["less3"], function () {
//     browserSync.init({
//         server: "."
//     });
//
//     gulp.watch("less/**/*.less", ["less3"]);
//     gulp.watch("*.html").on("change", browserSync.reload);
// });

////////////////////////////////////////////////////////////////////////////

////////////////////// КОПИРУЕМ ФАЙЛЫ В ПАПКУ BUILD /////////////////////////

gulp.task('copy', function () {
   return gulp.src([
       'src/fonts/**/*.{woff,woff2}',
       'src/img/**',
       'src/*.html'
   ], {
       base: 'src'
   })
       .pipe(gulp.dest('build'));
});
///////////////////////////////////////////////////////////////////////////

////////////////// УДАЛЕНИЕ //////////////////////////////////////////
gulp.task('clean', function () {
   return del('build');
});

////////////////////  СОБИРАЕМ БИЛД В ОТДЕЛЬНУЮ ПАПКУ //////////////////////

gulp.task('build', function (fn){
   run(
       'clean',
       'copy',
       'less3',
       'images',
       'symbols',
       fn);
});

///////////////////////////////////////////////////////////////////////////

/////////////// TЩЕ ОДИН ВОТЧЕР //////////////////////////

gulp.task("style1", function() {
    gulp.src("src/less/style.less")
        .pipe(plumber())
        .pipe(less({
            paths: [ path.join(__dirname, 'src/less', 'includes') ]
        }))
        .pipe(postcss([
            autoprefixer({
                browsers: [
                    "last 1 version",
                    "last 2 Chrome versions",
                    "last 2 Firefox versions",
                    "last 2 Opera versions",
                    "last 2 Edge versions"
                ]
            })
        ]))
        .pipe(gulp.dest("build/css"))
        .pipe(server.stream());
});

gulp.task("serve1", ["style1"], function() {
    server.init({
        server: "build",
        notify: false,
        open: true,
        cors: true,
        ui: false
    });

    gulp.watch("src/less/**/*.less", ["style1"]);
    gulp.watch("*.html").on("change", server.reload);
});

///////////////////////////////////////////////////////////////////
