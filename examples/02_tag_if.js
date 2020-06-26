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
 * example1: tag IF
 * @returns {Promise<*>}
 */
async function example1() {
    const result =  await AT.run(
        {
            start: 'The early {{if bird}}bird{{else}}bear{{end}} catches the worm.',
            bird: true
        }
    );

    console.log(`Result 1: "${result}"`);
}

/**
 * example2: tag IF
 * @returns {Promise<*>}
 */
async function example2() {
    const result =  await AT.run(
        {
            start: '{{ IF subject.homo }}Man{{ ELSE }}Woman{{ END }} may work from sun to sun,\n' +
                'But woman’s {{ If time[1] === "00:00" }}rest{{ Else }}{{action}}{{ End }} is never done.',
            subject: {
                homo: 'Man',
                animal: 'Rabbit'
            },
            time: ['7:00', '15:30'],
            action: 'work'
        }
    );

    console.log(`Result 2: "${result}"`);
}


Promise.resolve()
    .then(example1)
    .then(example2);