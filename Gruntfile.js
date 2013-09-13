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
                        src: ['**/*.js', '!lib/*.js'], // Actual pattern(s) to match.
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
                        src: ['**/*.*', '!**/*.less', '!**/*.html', '!js/*.js', '!js/src/**/*.js'],
                        dest: 'build/'
                    }
                ]
            }
        },

        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bumpup');
    grunt.loadNpmTasks('grunt-preprocess');

    grunt.registerTask('build', ['bumpup:patch', 'uglify', 'htmlmin', 'copy']);
};