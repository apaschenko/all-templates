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
 * example1: Tag For: Standard form
 * @returns {Promise<*>}
 */
async function example1() {
    const result =  await AT.run(
        {
            start: '{{for (num=2; num<5; num++)}}"{{number.odd[num]}}", {{end}}... all these are odd numbers.',
            number: {
                even: [0, 2, 4, 6, 8, 10, 12],
                odd: [1, 3, 5, 7, 9, 11, 13, 15]
            }
        }
    );

    console.log(`Result 1: "${result}"`);
}

/**
* example2: Tag For: Round brackets in the For operator are optional and can be skipped
* @returns {Promise<*>}
*/
async function example2() {
    const result =  await AT.run(
        {
            start: '{{ FOR num=2; num<5; num++ }}"{{ number.odd[num] }}", {{ END }}... all these are odd numbers.',
            number: {
                even: [0, 2, 4, 6, 8, 10, 12],
                odd: [1, 3, 5, 7, 9, 11, 13, 15]
            }
        }
    );

    console.log(`Result 2: "${result}"`);
}


Promise.resolve()
    .then(example1)
    .then(example2);