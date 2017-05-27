'use strict';
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        manifest: grunt.file.readJSON('extension/manifest.json'),
        banner: 'v<%= pkg.version manifest["version"] %>, <%= grunt.template.today("dd-mm-yy HH:MM") %>',
        bumpup: {
            options: {
                normalize: true
            },
            files: [
                'extension/manifest.json',
                './package.json'
            ]
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> created: <%= grunt.template.today("dd-mm-yyyy") %> minified js */\n',
                preserveComments: 'some',
                compress: {
                    global_defs: { 'DEBUG': false },
                    dead_code: true
                }
            },
            build: {
                files: [{
                    'build/js/background.min.js': [
                        'extension/js/src/init.js',
                        'extension/js/src/angular/services.js',
                        'extension/js/backapp.js'
                    ],
                    'build/js/options.min.js': [
                        'extension/js/src/init.js',
                        'extension/js/src/angular/services.js',
                        'extension/js/src/angular/panel_directive.js',
                        'extension/js/src/angular/OptionsCtrl.js'
                    ],
                    'build/js/content_script.js': [
                        'extension/js/vendor/jquery-2.0.3.min.js',
                        'extension/js/vendor/jquery.contextMenu.js',
                        'extension/js/vendor/jquery.ui.position.js',
                        'extension/js/content-helpers.js',
                        'extension/js/content.js'
                    ]
                }]
            }
        },
        compress: {
            build: {
                options: {
                    archive: 'workspace/versions/pirateer <%= manifest.version %>.zip',
                    mode: 'zip',
                    level: 6
                },
                expand: true,
                cwd: 'build/',
                src: ['**/*']
            }
        },
        injector: {
            options: {
                addRootSlash: false,
                ignorePath: 'build/'
            },
            deps: {
                files: {
                    'build/options.html': [
                        'build/css/options.min.css',
                        'build/js/vendors.min.js',
                        'build/js/options.min.js'
                    ],
                    'build/background.html': [
                        'build/js/vendors.min.js',
                        'build/js/background.min.js'
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
                    'build/css/options.min.css': [
                        'node_modules/bootstrap/dist/css/bootstrap.min.css', 'extension/css/options.css'
                    ],
                    'build/css/content.min.css': [
                        'extension/css/vendor/jquery.contextMenu.css'
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
                    cwd: 'build/', // Src matches are relative to this path.
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
                    cwd: 'extension/',
                    src: [
                        'img/**/*',
                        '*.html',
                        'js/vendor/jquery-2.0.3.min.map'
                    ],
                    dest: 'build/'
                }]
            }
        },
        concat: {
            build: {
                src: ['extension/js/vendor/lodash.min.js', 'extension/js/vendor/angular.min.js'],
                dest: 'build/js/vendors.min.js'
            }
        },
        clean: {
            build: ['build/']
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
        'cssmin:build',
        'copy:build',
        'concat:build',
        'uglify:build',
        'buildManifest',
        'injector',
        'compress:build'
    ]);
};
