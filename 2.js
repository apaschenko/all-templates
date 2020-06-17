
const t = require('./lib/parser');

const data = {
    start: ' as {{ tt }} qwerty ',
    tt: 123
};


console.log(JSON.stringify(t.parse(data.start),  null, 4));