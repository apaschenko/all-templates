'use strict';

const AT = require('../index');

/**
 * Tag IF
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: '\n{{ IF subject.homo }}Man{{ ELSE }}Woman{{ END }} may work from sun to sun,\n' +
                'But woman’s {{ If time[1] === "00:00" }}rest{{ Else }}{{action}}{{ End }} is never done.',
            subject: {
                homo: 'Man',
                animal: 'Rabbit'
            },
            time: ['7:00', '15:30'],
            action: 'work'
        }
    );

    console.log(result);
}


Promise.resolve()
    .then(example);