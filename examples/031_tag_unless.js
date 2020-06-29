'use strict';

const AT = require('../index');

/**
* Tag Unless
* @returns {Promise<*>}
*/
async function example() {
    const result =  await AT.run(
        {
            start: 'Money {{unless actionKey < 12}}talks.{{else}}plays?{{end}}',
            actionKey: 18
        }
    );

    console.log(result);
}


Promise.resolve()
    .then(example);