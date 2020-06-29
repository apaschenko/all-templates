'use strict';

const AT = require('../index');

/**
 * Tag IF
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: 'The early {{if bird}}bird{{else}}bear{{end}} catches the worm.',
            bird: true
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);