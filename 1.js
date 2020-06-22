
'use strict';
async function aaa () {
    let ii =    '0         10        20        30        40        50        60        70        80        90        100       110       120       130       140   ';
    let index = '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345';
    let start = 'prev part of text {{1 + 2 / 3}} tail of text';

    const res = await require('./index').run
        (
            start,
            {
                'qwe': 'RESOLVE!',
                tester: true,
                aaa: 'very',
               // bbb: 'bbb value! ',
                'part': '-- {{part2}} --',
                'part2': '== {{part3}} ==',
                'part3': 'part3_value',
                'its': {
                    "my": {
                        'layer':
                            'start'
                    }
                }
            },
            //{ tag: {open: '((', close: '))'}}
            {entryPoint: 'start'}
        );
    console.log('\n RES:\n', `"${res}"`);
}

function getTime() {
    const now = process.hrtime();
    return now[0] * 1000000 + Math.floor(now[1] / 1000);
}

const startTime = getTime();

aaa().then(
    () => {
        const endTime = getTime();
        console.log(`Finished! (${endTime - startTime} mcs)`)
    },
    (e) => console.log(e)
);
setTimeout(function() {}, 3000)