
const t = require('./index').render;

const data = {
    start: ' as {{ tt }} qwerty ',
    tt: 123
};


console.log(t(data));