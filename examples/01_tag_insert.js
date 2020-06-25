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
 * example1: Inserting from the data
 * @returns {Promise<*>}
 */
async function example1() {
    const result =  await AT.run(
        {
            start:
                '{{`per cent`.twenty}} per cent of {{ nums.even[5] }} is {{`per cent`.twenty * 0.01 * nums.even[5]}}',
            'per cent': {
                ten: 10,
                twenty: 20
            },
            nums: {
                even: [0, 2, 4, 6, 8, 10, 12, 14, 16],
                odd: [1, 3, 5, 7, 9, 11, 13, 15]
            }
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