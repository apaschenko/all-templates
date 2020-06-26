/**
 * Lib "Lenka"
 * Examples
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */


'use strict';

const AT = require('../index');

/**
 * Example 1
 * "Old-school" library call form:
 * The starting layer is placed in a separate (first) parameter of the function.
 * Before starting, this initial layer will be added to the data (the second parameter).
 * By default, the key name is "start"). If the data already had such a key, its value
 * will be lost.
 *
 * AT.run(startLayer<String>, data<Object> [, options<Object>]);
 *
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
 * example2: Recommended library call form:
 *
 * AT.run(data<Object> [, options<Object>]);
 *
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