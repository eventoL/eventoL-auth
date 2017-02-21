'use strict';

module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        pkg:     grunt.file.readJSON('package.json'),
        convert: {
            options: {
                explicitArray: false
            },
            yml2json: {
                src: ['./swagger/user.yaml'],

                dest: './swagger/user.json'

            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter:          'spec',
                    quiet:             false,
                    clearRequireCache: false
                },
                src: ['./tests/**/*.js']
            }
        },
        plato: {
            ci: {
                options: {
                    eslintrc: './.eslintrc'
                },
                files: {
                    'results/plato': ['lib/**/*.js']
                }
            }
        },
        mocha_istanbul: {
            src:     'tests/**/*.js',
            options: {
                coverage:        true,
                excludes:        ['node_modules/**', 'tests/**', 'results/**', 'app.js'],
                istanbulOptions: ['--include-all-sources=true'],
                root:            './lib',
                coverageFolder:  'results/istanbul',
                reporter:        'mochawesome',
                reportFormats:   ['cobertura', 'lcovonly', 'html'],
                quiet:           false
            }
        },
        'baucis-swagger2': {
            main: {
                src:  './lib/models',
                dest: './swagger/baucis.json'
            }
        },
        'merge-json': {
            swagger: {
                src:  ['./swagger/baucis.json', './swagger/user.json'],
                dest: './swagger/swagger.json'
            }
        }

    });

    grunt.registerTask('test', [
        'env:dev', 'eslint:jenkins', 'mocha_istanbul'
    ]);

    grunt.registerTask('build', ['baucis-swagger2', 'convert', 'merge-json']);

};
