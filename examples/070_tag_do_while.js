'use strict';

const AT = require('../index');

/**
 * Tag While
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: '{{SET i=0}}{{ DO }}{{i}} {{WHILE (i++, i < 5)}}{{END}}'
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);