'use strict';

const AT = require('../index');

/**
 * Tag Each with an array
 * @returns {Promise<*>}
 */
async function example() {
    const result =  await AT.run(
        {
            start: 'Days of the week are:{{ EACH day OF daysOfTheWeek }} {{ day.key }}:"{{ day.value }}"{{ END }}.',
            daysOfTheWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
    );

    console.log(result);
}

Promise.resolve()
    .then(example);