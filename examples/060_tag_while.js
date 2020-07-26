'use strict';

const AT = require('../index');

/**
 * Tag While
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: '{{ WHILE (i+=2) < 10 }} {{ i }} {{ END }}',
            i: 0
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);