'use strict';

const AT = require('../index');

/**
 * Tag For: Standard form
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            //     0         10        20
            //      12345678901234567890123456789
            start: '{{for (index=2; index<5; index+=1)}}"{{number.odd[index]}}", {{end}}... are odd numbers.',
            number: {
                even: [0, 2, 4, 6, 8, 10, 12],
                odd: [1, 3, 5, 7, 9, 11, 13, 15]
            }
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);