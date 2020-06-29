'use strict';

const AT = require('../index');

/**
 * Recommended library call form:
 *
 * AT.run(data<Object> [, options<Object>]);
 *
 * @returns {Promise<*>}
 */
async function example() {
    const result = await AT.run(
        {
            'start': "Hello, {{ who  # It's a target of the greeting }}!",
            'who': 'WORLD',
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);
