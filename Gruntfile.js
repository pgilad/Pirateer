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
                files: {
                    'build/*.js': 'public/js/*.js'
                }
            }
        },

        htmlmin: {                                     // Task
            build: {                                      // Target
                options: {                                 // Target options
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {                                   // Dictionary of files
                    'build/index.html': 'public/index.html',     // 'destination': 'source'
                    'build/background.html': 'public/background.html'
                }
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

    grunt.registerTask('test', ['jshint', 'qunit']);
    grunt.registerTask('htmlmin', ['htmlmin']);
    grunt.registerTask('uglify', ['uglify']);

    grunt.registerTask('default', []);

};