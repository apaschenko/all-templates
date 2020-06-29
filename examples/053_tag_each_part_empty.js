'use strict';

const AT = require('../index');

/**
 * Tag Each which contains the "with" and "empty" part
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: 'Squares are:\n{{EACH q OF squares}}{{q.key}}: "{{ q.value }}"{{WITH}}, {{EMPTY}} --- {{END}}.',
            squares: {}
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);