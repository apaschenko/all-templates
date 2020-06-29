'use strict';

const AT = require('../index');

/**
 * Tag Each which contains the "with" part
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: 'Squares are:\n{{EACH q OF squares}}{{q.key}}: "{{ q.value }}"{{WITH}}, {{END}}.',
            squares: {'One': 1, 'Two': 4, 'Three': 9}
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);