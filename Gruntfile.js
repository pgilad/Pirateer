module.exports = function (grunt) {

    grunt.initConfig({
        pkg   : grunt.file.readJSON('package.json'),
        banner: 'v<%= pkg.version manifest["version"] %>, <%= grunt.template.today("dd-mm-yy HH:MM") %>',

        bumpup: {
            files: [
                'public/manifest.json'
            ]
        },

        concat: {
            build: {
                options: {
                    stripBanners: true
                },
                dist   : {
                    files: {
                        'build/js/app.min.js'    : ['js/vendor/*.js', 'js/src/**/*.js', 'js/app.js'],
                        'build/js/backapp.min.js': ['js/vendor/*.js', 'js/src/**/*.js', 'js/backapp.js']
                    }
                }
            }
        },

        uglify: {
            options: {
                banner  : '/*! <%= pkg.name %> created: <%= grunt.template.today("dd-mm-yyyy") %> minified js */\n',
                compress: {
                    global_defs: {
                        "DEBUG": false
                    },
                    dead_code  : true
                }
            },
            build  : {
                files: [
                    {
                        'build/js/app.min.js'    : [
                            'public/js/vendor/*.js', 'public/js/src/common/init.js', 'public/js/app.js',
                            'public/js/src/angular/*.js'
                        ],
                        'build/js/backapp.min.js': [
                            'public/js/vendor/*.js', 'public/js/src/common/init.js', 'public/js/backapp.js',
                            'public/js/src/angular/*.js'
                        ],
                        'build/js/content.js'    : ['public/js/content.js']
                    }
                ]
            }
        },

        useminPrepare: {
            html: ['public/index.html', 'public/background.html']
        },

        usemin: {
            html   : ['build/**/*.html'],
            css    : ['build/**/*.css'],
            options: {
                dirs   : ['build'],
                basedir: 'build'
            }
        },

        cssmin: {
            build: {
                options: {
                    banner: '/* CSS minified file */'
                },
                files  : {
                    'build/css/style.min.css': ['public/css/**/*.css']
                }
            }
        },

        htmlmin: {
            build: {
                options: {
                    removeComments    : true,
                    collapseWhitespace: true
                },

                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd   : 'build/',      // Src matches are relative to this path.
                        src   : ['*.html'] // Actual pattern(s) to match.
                    }
                ]
            }
        },

        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd   : 'public/',
                        src   : ['manifest.json', 'img/**/*', '*.html'],
                        dest  : 'build/'
                    }
                ]
            }
        },

        clean: {
            build: ["build/"]
        },

        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        }
    });

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.registerTask('build', [
        'clean:build', 'bumpup:patch', 'useminPrepare', 'cssmin:build', 'copy:build', 'uglify:build', 'usemin'
    ]);
};