
'use strict';
async function aaa () {
    let ii =    '0         10        20        30        40        50        60        70        80        90        100       110       120       130       140   ';
    let index = '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345';
    let start = 'q #  {{unless bbb}}bbb is missing.(( = bbb.ccc ddd.eee.fff( ttt.kkk.mmm, zzz.$$$, wer.der) )){{ end }}{{ if tester}} tester is {{aaa}} true tester {{else}}if false {{end}} {{qwe # asset}}w';

    const res = await require('./index')
        (
            start,
            {'qwe': 'RESOLVE!', tester: true, aaa: 'very', bbb: ' CUSTOM DELIMITER WORKS! '},
            //{ placeholder: {open: '((', close: '))'}}
               );
    console.log('\n RES:\n', `"${'1'}"`);
}

aaa().then(() => {console.log('Finished!')});
setTimeout(function() {}, 3000)