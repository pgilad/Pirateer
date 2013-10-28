module.exports = function (grunt) {

    grunt.initConfig({
        pkg   : grunt.file.readJSON('package.json'),
        banner: 'v<%= pkg.version manifest["version"] %>, <%= grunt.template.today("dd-mm-yy HH:MM") %>',

        bumpup: {
            files: [
                'public/manifest.json'
            ]
        },

        uglify: {
            options: {
                banner          : '/*! <%= pkg.name %> created: <%= grunt.template.today("dd-mm-yyyy") %> minified js */\n',
                preserveComments: 'some',
                compress        : {
                    global_defs: {
                        "DEBUG": false
                    },
                    dead_code  : true
                }
            },
            build  : {
                files: [
                    {
                        'build/js/includes.min.js': [
                            'public/js/vendor/angular.min.js',
                            'public/js/vendor/lodash.min.js',
                            'public/js/src/common/init.js',
                            'public/js/src/angular/*.js'
                        ],
                        'build/js/app.min.js'     : [
                            'public/js/app.js'
                        ],
                        'build/js/backapp.min.js' : [
                            'public/js/backapp.js'
                        ],
                        'build/js/content.js'     : [
                            'public/js/vendor/jquery-2.0.3.min.js',
                            'public/js/vendor/jquery.contextMenu.js',
                            'public/js/vendor/jquery.ui.position.js',
                            'public/js/content.js'
                        ]
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
                    'build/css/style.min.css'        : ['public/css/vendor/bootstrap.min.css', 'public/css/style.css'],
                    'build/css/content_style.min.css': ['public/css/vendor/jquery.contextMenu.css']
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
                        src   : ['img/**/*', '*.html', 'js/vendor/jquery-2.0.3.min.map'],
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

    grunt.registerTask('buildManifest', function () {
        var tmpPkg = require('./public/manifest.json');

        console.log(process.cwd());

        tmpPkg["content_scripts"][0]["js"] = ['js/content.js'];
        tmpPkg["content_scripts"][0]["css"] = ['css/content_style.min.css'];

        require('fs').writeFileSync('./build/manifest.json', JSON.stringify(tmpPkg, null, 2));
    });

    grunt.registerTask('build', [
        'clean:build',
        'bumpup:patch',
        'useminPrepare',
        'cssmin:build',
        'copy:build',
        'uglify:build',
        'buildManifest',
        'usemin'
    ]);
};