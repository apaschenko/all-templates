'use strict';

const AT = require('../index');

/**
 * Inserting from the data
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: '{{partOf.`20 per cent`}} per cent of '
                +'{{ nums.even[5] }} is {{partOf.`20 per cent` * 0.01 * nums.even[5]}}',
            partOf: {
                ablValue: 10,
                '20 per cent': 20
            },
            nums: {
                even: [0, 2, 4, 6, 8, 10, 12, 14, 16],
                odd: [1, 3, 5, 7, 9, 11, 13, 15]
            }
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);
