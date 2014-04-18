'use strict';
module.exports = function(grunt) {
    grunt.initConfig({
        config: {
            src: 'extension',
            dist: 'build'
        },
        pkg: grunt.file.readJSON('package.json'),
        manifest: grunt.file.readJSON('extension/manifest.json'),
        banner: 'v<%= pkg.version manifest["version"] %>, <%= grunt.template.today("dd-mm-yy HH:MM") %>',
        bumpup: {
            files: [
                '<%= config.src %>/manifest.json'
            ]
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> created: <%= grunt.template.today("dd-mm-yyyy") %> minified js */\n',
                preserveComments: 'some',
                compress: {
                    global_defs: {
                        'DEBUG': false
                    },
                    dead_code: true
                }
            },
            build: {
                files: [{
                    '<%= config.dist %>/js/background.min.js': [
                        '<%= config.src %>/js/src/init.js',
                        '<%= config.src %>/js/src/angular/services.js',
                        '<%= config.src %>/js/backapp.js'
                    ],
                    '<%= config.dist %>/js/options.min.js': [
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
                }]
            }
        },
        // make a zipfile
        compress: {
            build: {
                options: {
                    archive: 'workspace/versions/pirateer <%= manifest.version %>.zip',
                    mode: 'zip',
                    level: 6
                },
                expand: true,
                cwd: '<%= config.dist %>/',
                src: ['**/*']
            }
        },
        injector: {
            options: {},
            deps: {
                files: {
                    //options html
                    '<%= config.dist %>/options.html': [
                        '<%= config.dist %>/css/options.min.css',
                        '<%= config.dist %>/js/vendors.min.js',
                        '<%= config.dist %>/js/options.min.js'
                    ],
                    //background html
                    '<%= config.dist %>/background.html': [
                        '<%= config.dist %>/js/vendors.min.js',
                        '<%= config.dist %>/js/background.min.js'
                    ]
                }
            }
        },
        cssmin: {
            build: {
                options: {
                    banner: '/* CSS minified file */'
                },
                files: {
                    '<%= config.dist %>/css/options.min.css': [
                        '<%= config.src %>/bower_components/bootstrap/dist/css/bootstrap.min.css', '<%= config.src %>/css/options.css'
                    ],
                    '<%= config.dist %>/css/content.min.css': [
                        '<%= config.src %>/css/vendor/jquery.contextMenu.css'
                    ]
                }
            }
        },
        htmlmin: {
            build: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: [{
                    expand: true, // Enable dynamic expansion.
                    cwd: '<%= config.dist %>/', // Src matches are relative to this path.
                    src: ['*.html'] // Actual pattern(s) to match.
                }]
            }
        },
        devUpdate: {
            main: {
                options: {
                    updateType: 'prompt', //just report outdated packages
                    reportUpdated: false, //don't report already updated packages
                    semver: false, //use package.json semver rules when updating
                    packages: { //what packages to check
                        devDependencies: true, //only devDependencies
                        dependencies: true
                    }
                }
            }
        },
        copy: {
            build: {
                files: [{
                    expand: true,
                    cwd: '<%= config.src %>/',
                    src: [
                        'img/**/*',
                        '*.html',
                        'js/vendor/jquery-2.0.3.min.map'
                    ],
                    dest: '<%= config.dist %>/'
                }]
            }
        },
        concat: {
            build: {
                src: ['<%= config.src %>/bower_components/lodash/dist/lodash.min.js', '<%= config.src %>/js/vendor/angular.min.js'],
                dest: '<%= config.dist %>/js/vendors.min.js'
            }
        },
        clean: {
            build: ['<%= config.dist %>/']
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        }
    });
    require('load-grunt-tasks')(grunt);
    grunt.registerTask('buildManifest', function() {
        var manifestPath = {
            input: './extension/manifest.json',
            output: './build/manifest.json'
        };
        var tmpPkg = require(manifestPath.input);
        tmpPkg.content_scripts[0].js = ['js/content_script.js'];
        tmpPkg.content_scripts[0].css = ['css/content.min.css'];
        require('fs').writeFileSync(manifestPath.output, JSON.stringify(tmpPkg, null, 2));
    });
    grunt.registerTask('build', [
        'clean:build',
        'bumpup:patch',
        'cssmin:build',
        'copy:build',
        'concat:build',
        'uglify:build',
        'buildManifest',
        'injector',
        'compress:build'
    ]);
};
