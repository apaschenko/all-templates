'use strict';

const AT = require('../index');

/**
 * Tag While
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: '{{ DO }}{{i}} {{WHILE (i++ < 5)}}{{END}}',
            i: 0
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);