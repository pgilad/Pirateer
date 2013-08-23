module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: 'v<%= pkg.version manifest["version"] %>, <%= grunt.template.today("dd-mm-yy HH:MM") %>',

        bumpup: {
            files: [
                'public/manifest.json'
            ]
        },

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/**/*.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
            },
            build: {
                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: 'public/js/',      // Src matches are relative to this path.
                        src: ['*.js'], // Actual pattern(s) to match.
                        dest: 'build/js',   // Destination path prefix.
                        ext: '.js'   // Dest filepaths will have this extension.
                    }
                ]
            }
        },

        htmlmin: {                                     // Task
            build: {                                      // Target
                options: {                                 // Target options
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: 'public/',      // Src matches are relative to this path.
                        src: ['*.html'], // Actual pattern(s) to match.
                        dest: 'build/'   // Destination path prefix
                    }
                ]
            }
        },
        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'public/',
                        src: ['**/*.*', '!**/*.less', '!**/*.html', '!js/*.js'],
                        dest: 'build/'
                    }
                ]
            }
        },

        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint', 'qunit']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bumpup');

    grunt.registerTask('build', ['bumpup:patch', 'uglify', 'htmlmin', 'copy']);

    grunt.registerTask('verifyCopyright', function () {

        var fileRead, firstLine, counter = 0, fileExtension, commentWrapper;
        copyrightInfo = 'Copyright by Gilad Peleg @2013';

        //get file extension regex
        var re = /(?:\.([^.]+))?$/;

        grunt.log.writeln();

        // read all subdirectories from your modules folder
        grunt.file.expand(
            {filter: 'isFile', cwd: 'public/'},
            ["**/*.js", ['**/*.html']])
            .forEach(function (dir) {
                fileRead = grunt.file.read('public/' + dir).split('\n');
                firstLine = fileRead[0];

                if (firstLine.indexOf(copyrightInfo > -1)) {

                    counter++;
                    grunt.log.write(dir);
                    grunt.log.writeln(" -->doesn't have copyright. Writing it.");

                    //need to be careful about:
                    //what kind of comment we can add to each type of file. i.e /* <text> */ to js
                    fileExtension = re.exec(dir)[1];
                    switch (fileExtension) {
                        case 'js':
                            commentWrapper = '/* ' + copyrightInfo + ' */';
                            break;
                        case 'html':
                            commentWrapper = '<!-- ' + copyrightInfo + ' //-->';
                            break;
                        default:
                            commentWrapper = null;
                            grunt.log.writeln('file extension not recognized');
                            break;
                    }

                    if (commentWrapper) {
                        fileRead.unshift(commentWrapper);
                        fileRead = fileRead.join('\n');
                        grunt.file.write( 'public/' + dir, fileRead);
                    }
                }
            });

        grunt.log.ok('Found', counter, 'files without copyright');
    })
};