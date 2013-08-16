module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: 'v<%= pkg.version %>, <%= grunt.template.today("dd-mm-yy HH:MM") %>',

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
                        src: ['public/package.json'],
                        dest: 'build/'
                    }, // includes files in path
                    {
                        expand: true,
                        src: ['public/**/*'],
                        dest: 'build/',
                        filter: 'isDirectory'
                    }, // includes files in path and its subdirs
                    {
                        expand: true,
                        cwd: 'public/css',
                        src: ['*.css'],
                        dest: 'build/css'
                    }, // makes all src relative to cwd
                    {
                        expand: true,
                        cwd: 'public/img',
                        src: ['**/*'],
                        dest: 'build/img'
                    }, // makes all src relative to cwd
                    {
                        expand: true,
                        cwd: 'public/js/lib',
                        src: ['**/*'],
                        dest: 'build/js/lib'
                    } // makes all src relative to cwd
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

    grunt.registerTask('build', ['uglify', 'htmlmin', 'copy']);

};