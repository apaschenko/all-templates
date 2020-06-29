'use strict';

const AT = require('../index');

/**
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
async function example() {
    let start = "Hello, {{ who # It's a target of the greeting }}!";

    const result =  await AT.run(
        start,
        {
            'who': 'WORLD',
        }
    );

    console.log(result);
}


Promise.resolve()
    .then(example);
