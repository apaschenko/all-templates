'use strict';

const AT = require('../index');

/**
 * Tag While
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            //     0         10        20        30        40
            //     0123456789012345678901234567890123456789012345
            start: '{{WHILE (i++ < 5)}}{{i}} {{END}}',
            i: 0
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);