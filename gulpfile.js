var gulp = require("gulp")
var gulpWebpack = require("gulp-webpack")
var ts = require("gulp-typescript")
var tsProject = ts.createProject("tsconfig.json")
var webpack = require("webpack")
var zip = require('gulp-zip');
var runSeq = require('run-sequence');
// var ExtractTextPlugin = require('extract-text-webpack-plugin')
var clean = require('gulp-clean');
gulp.task('compileTsFile', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('./dist/zip/gantteditor/widget'));
})
gulp.task('copyOtherFiles', function () {
    gulp.src('./gantteditor/lib/*')
        .pipe(gulp.dest("./dist/zip/gantteditor/lib"))
    gulp.src('./gantteditor/widget/ui/*.css')
        .pipe(gulp.dest('./dist/zip/gantteditor/widget/ui'))
    gulp.src('package.xml')
        .pipe(gulp.dest('./dist/zip'));
    gulp.src('./gantteditor/*.xml')
        .pipe(gulp.dest('./dist/zip/gantteditor'));
    gulp.src('./gantteditor/widget/template/*.html')
        .pipe(gulp.dest("./dist/zip/gantteditor/widget/template"))
})

gulp.task('cleanDist', () => {
    return gulp.src('./dist')
        .pipe(clean())
})
gulp.task('bundleCSS', () => {
    gulp.src('./src/components/views/css/kanbanWidget')
        .pipe(gulpWebpack({
            plugins: [
                new ExtractTextPlugin("./dist/zip/com/mendix/widget/custom/kanban/ui/kanban.css"),
            ],
            entry: "./src/components/views/css/kanbanWidget",
            output: {
                filename: "./dist/zip/com/mendix/widget/custom/kanban/ui/kanban.css"
            },
            module: {
                loaders: [{
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: [{
                            loader: "css-loader",
                            options: { url: false }
                        }]
                    }),
                }]
            }
        }, webpack))
        .pipe(gulp.dest("./"))
})
gulp.task('bundleJsToDev', () =>
    gulp.src("./dist/GanttEditor.js")
        .pipe(gulpWebpack({
            output: {
                filename: "./dist/zip/gantteditor/GanttEditor.js",
                libraryTarget: "amd"
            },
            entry: "./dist/GanttEditor.js",
            devtool: "source-map",
            externals: ["dijit", "dojo"]
            // "dojo/_base/declare", "dijit/_TemplatedMixin"],
        }, webpack))
        .pipe(gulp.dest("./"))
)

// gulp.task('copyCSS', () => {
//     gulp.src('./src/components/views/css/kanbanWidget.css')
//         .pipe(gulp.dest("./dist/zip/com/mendix/widget/custom/kanban/ui"))
// })

gulp.task('zip', () => {
    gulp.src('./dist/zip/**/*')
        .pipe(zip('GanttEditor.mpk'))
        .pipe(gulp.dest("C:/Users/Ha Bui/Documents/Mendix/Gantt Chart-offline/widgets"))
})

gulp.task('default', (callback) => {
    runSeq(['cleanDist'], ['compileTsFile', 'copyOtherFiles'], ['zip'], callback)
})
