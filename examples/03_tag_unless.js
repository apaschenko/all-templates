/**
 * Lib "Lenka"
 * Examples
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */


'use strict';

const AT = require('../index');

/**
 * example1: Tag Unless
 * @returns {Promise<*>}
 */
async function example1() {
    const result =  await AT.run(
        {
            start: 'Comparisons are {{unless author != "Shakespeare"}} odious{{else}} odorous{{end}}.',
            author: 'Shakespeare'
        }
    );

    console.log(`Result 1: "${result}"`);
}

/**
* example1: Tag Unless
* @returns {Promise<*>}
*/
async function example2() {
    const result =  await AT.run(
        {
            start: 'Money {{unless actionKey < 12}}talks.{{else}}plays?{{end}}',
            actionKey: 18
        }
    );

    console.log(`Result 2: "${result}"`);
}


Promise.resolve()
    .then(example1)
    .then(example2);