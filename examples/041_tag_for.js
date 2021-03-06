'use strict';

const AT = require('../index');

/**
* Tag For: Round brackets in the For operator are optional and can be skipped
* @returns {Promise<*>}
*/
async function example() {
    const result =  await AT.run(
        {
            start: '{{ FOR index=2; index<5; index+=1 }}"{{ number.odd[index] }}", {{ END }}... all these are odd numbers.',
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
