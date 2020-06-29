'use strict';

const AT = require('../index');

/**
 * Tag Each which contains the "empty" and "with" part
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: 'Squares are:\n{{EACH q OF squares}}{{q.key}}: "{{q.value}}"{{EMPTY}} --- {{WITH}}, {{END}}.',
            squares: { two: 4, four: 16 }
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);