/**
 * Lib "all-templates"
 * Examples
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */


'use strict';

const AT = require('../index');

/**
 * example1: First form - AT.run(startLayer<String>, data<Object> [, options<Object>]);
 * @returns {Promise<*>}
 */
async function example1() {
    let start = "Hello, {{ who  # It's a target of the greeting }}!";

    const result =  await AT.run(
        start,
        {
            'who': 'WORLD',
        }
    );

    console.log(`Result 1: "${result}"`);
}

/**
 * example2: Second form - AT.run(data<Object> [, options<Object>]);
 * @returns {Promise<*>}
 */
async function example2() {
    const result = await AT.run(
        {
            'start': "Hello, {{ who  # It's a target of the greeting }}!",
            'who': 'WORLD',
        }
    );

    console.log(`Result 2: "${result}"`);
}

Promise.resolve()
    .then(example1)
    .then(example2);