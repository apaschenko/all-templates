
'use strict';
async function aaa () {
    let ii =    '0         10        20        30        40        50        60        70        80        90        100       110       120       130       140   ';
    let index = '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345';
    let start = 'q #  {{unless bbb}}bbb {{}}{{ @ part }}is missing.{{ end }}{{ if tester}} tester is {{aaa}} true tester {{else}}if false {{end}} {{qwe # asset}} w';

    const res = await require('./index')
        (
            start,
            {
                'qwe': 'RESOLVE!',
                tester: true,
                aaa: 'very',
               // bbb: 'bbb value! ',
                'part': '-- {{@part2}} --',
                'part2': '== {{part3}} ==',
                'part3': 'part3_value',
                'its': {
                    "my": {
                        layer:
                            'start'
                    }
                }
            },
            //{ tag: {open: '((', close: '))'}}
            {entryPoint: 'start'}
        );
    console.log('\n RES:\n', `"${res}"`);
}

aaa().then(() => {console.log('Finished!')});
setTimeout(function() {}, 3000)