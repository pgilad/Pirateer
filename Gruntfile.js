module.exports = function (grunt) {

    grunt.initConfig({
        config  : {
            src : 'public',
            dist: 'build'
        },
        pkg     : grunt.file.readJSON('package.json'),
        manifest: grunt.file.readJSON('public/manifest.json'),

        banner: 'v<%= pkg.version manifest["version"] %>, <%= grunt.template.today("dd-mm-yy HH:MM") %>',

        bumpup: {
            files: [
                '<%= config.src %>/manifest.json'
            ]
        },

        uglify  : {
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

            build: {
                files: [
                    {
                        '<%= config.dist %>/js/background.min.js': [
                            '<%= config.src %>/js/src/init.js',
                            '<%= config.src %>/js/src/angular/services.js',
                            '<%= config.src %>/js/backapp.js'
                        ],
                        '<%= config.dist %>/js/options.min.js'   : [
                            '<%= config.src %>/js/src/init.js',
                            '<%= config.src %>/js/src/angular/services.js',
                            '<%= config.src %>/js/src/angular/panel_directive.js',
                            '<%= config.src %>/js/src/angular/OptionsCtrl.js'
                        ],
                        '<%= config.dist %>/js/content_script.js': [
                            '<%= config.src %>/js/vendor/jquery-2.0.3.min.js',
                            '<%= config.src %>/js/vendor/jquery.contextMenu.js',
                            '<%= config.src %>/js/vendor/jquery.ui.position.js',
                            '<%= config.src %>/js/content-helpers.js',
                            '<%= config.src %>/js/content.js'
                        ]
                    }
                ]
            }
        },

        // make a zipfile
        compress: {
            build: {
                options: {
                    archive: 'workspace/versions/pirateer <%= manifest.version %>.zip',
                    mode   : 'zip',
                    level  : 6
                },

                expand: true,
                cwd   : '<%= config.dist %>/',
                src   : ['**/*']
            }
        },

        useminPrepare: {
            html   : ['<%= config.src %>/options.html', '<%= config.src %>/background.html'],
            options: {
                dest: '<%= config.dist %>'
            }
        },

        usemin: {
            html   : ['<%= config.dist %>/**/*.html'],
            css    : ['<%= config.dist %>/**/*.css'],
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
                    '<%= config.dist %>/css/options_style.min.css': [
                        '<%= config.src %>/bower_components/bootstrap/dist/css/bootstrap.min.css', '<%= config.src %>/css/options.css'
                    ],
                    '<%= config.dist %>/css/content_style.min.css': [
                        '<%= config.src %>/css/vendor/jquery.contextMenu.css'
                    ]
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
                        cwd   : '<%= config.dist %>/',      // Src matches are relative to this path.
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
                        cwd   : '<%= config.src %>/',
                        src   : [
                            'img/**/*',
                            '*.html',
                            '!index.html',
                            'js/vendor/jquery-2.0.3.min.map'
                        ],
                        dest  : '<%= config.dist %>/'
                    }
                ]
            }
        },

        concat: {
            build: {
                src : ['<%= config.src %>/bower_components/lodash/dist/lodash.min.js', '<%= config.src %>/js/vendor/angular.min.js'],
                dest: '<%= config.dist %>/js/vendors.min.js'
            }
        },

        clean: {
            build: ["<%= config.dist %>/"]
        },

        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        }
    });

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.registerTask('buildManifest', function () {

        var manifestPath = {
            input : './public/manifest.json',
            output: './build/manifest.json'
        };

        var tmpPkg = require(manifestPath.input);

        tmpPkg["content_scripts"][0]["js"] = ['js/content_script.js'];
        tmpPkg["content_scripts"][0]["css"] = ['css/content_style.min.css'];

        require('fs').writeFileSync(manifestPath.output, JSON.stringify(tmpPkg, null, 2));
    });

    grunt.registerTask('build', [
        'clean:build',
        'bumpup:patch',
        'useminPrepare',
        'cssmin:build',
        'copy:build',
        'concat:build',
        'uglify:build',
        'buildManifest',
        'usemin',
        'compress:build'
    ]);
};