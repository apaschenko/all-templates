/**
 * Lib "all-templates"
 * Runner - layer executor
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */


const parser = require('./parser');
const utils = require('./utils/general');
const E = require('./utils/exception');

function runner(ast, data, options) {
    return new Promise(function(resolve, reject) {
        switch (ast.type) {
            case 'if':
            case 'unless':
                runner(ast.value, data, options)
                    .then(
                        function (condition) {
                            const path = condition ? ast.truePath : ast.falsePath;
                            runner(path, data, options)
                                .then(
                                    function (result) {
                                        return resolve (result);
                                    },
                                    function (error) {
                                        return reject (error);
                                    }
                                );
                        },
                        function (error) {
                            return reject (error);
                        }
                    );
                break;
            default:
                resolve ( {status: "Don't implemented yet.", ast} );
        }

    });

}


module.exports = runner;
