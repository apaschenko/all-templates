'use strict';

const AT = require('../index');

/**
 * Tag Each with an object
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: 'Squares are:\n{{ EACH q OF squares }}{{ q.key }}: "{{ q.value }}" {{ END }}.',
            squares: {
                'One': 1, 'Two': 4, 'Three': 9}
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);