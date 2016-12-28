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
