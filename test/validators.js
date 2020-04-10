'use strict';

const {expect} = require('chai');
const should = require('chai').should();

const moduleUnderTest = require('../lib/validators');
const E = require('../lib/exceptions');

describe('validators.js', function () {
    let result;
    const testModules = {
        E: {
            Throw: function(exception, data) { return result = {exception, data} },
            Exceptions: E.Exceptions
        },
        C: {
            ENTRY_POINT_NAME: 'start'
        }
    };

    let params;

    const Exceptions = {
        DATA_IS_EMPTY_MAP:      1,
        DATA_IS_INVALID:        2,
        DATA_IS_NOT_OBJECT:     3,
        GETTERS_IS_EMPTY_MAP:   4,
        GETTERS_IS_INVALID:     5,
        GETTERS_IS_NOT_OBJECT:  6,
        GETTER_IS_NOT_FUNCTION: 7,
        INVALID_OPTIONS:        8,
        UNKNOWN_KEY:            9,
        INVALID_VALUE:          10,
        INVALID_PH:             11,
        INVALID_MODE:           12,
        INVALID_KEY:            13,
        MISSING_ENTRY_POINT:    14,
        CYCLIC_DEPENDENCE:      20
    };
    
    describe('InputValidator', function() {

        let validator = moduleUnderTest.InputValidator;

        describe('keys format', function() {
            before(function() {
                params = {
                    data: undefined,
                    options: {},
                    getters: undefined
                };
            });

            it('"data" is an valid Map with String key when "getters" is missing', function (done) {
                const pars = { ...params, data: new Map([['start', 2]]), isDataMap: true };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it('"data" is an valid Map with Symbol key when "getters" is missing', function (done) {
                const pars = {
                    ...params,
                    data: new Map([[Symbol(), 2], ['start', 2]]), isDataMap: true
                };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it('"data" is an valid Map with RegExp key when "getters" is missing', function (done) {
                const pars = {
                    ...params,
                    data: new Map([[new RegExp('123'), 2], ['start', 2]]),
                    isDataMap: true
                };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it('"data" is an valid Map with String, Symbol and RegExp key when "getters" is missing', function (done) {
                const pars = {
                    ...params,
                    data: new Map([['start', 'w'], [Symbol(), 'z'], [new RegExp('123'), 2]]),
                    isDataMap: true };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it('"data" is an Map with String, Symbol and invalid key when "getters" is missing', function (done) {
                const pars = {
                    ...params,
                    data: new Map([['start', 'w'], [Symbol(), 'z'], [1, 2]]),
                    isDataMap: true
                };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.INVALID_KEY);
                done();
            });

            it('"data" is an Map which contains a Number key when "getters" is an valid Object', function (done) {
                const pars = {
                    ...params,
                    data: new Map([['start', 'w'], [Symbol(), 'z'], [1, 2]]),
                    isDataMap: true,
                    isGettersMap: false,
                    getters: {'a': function() {}}
                };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it(
                '"data" is an Map which contains a Number key when "getters" is an valid Map with String key',
                function (done) {
                    const pars = {
                        ...params,
                        data: new Map([['start', 'w'], [Symbol(), 'z'], [1, 2]]),
                        isDataMap: true,
                        isGettersMap: true,
                        getters: new Map([['a', function() {}]])
                    };
                    result = 'success';
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                }
            );

            it(
                '"data" is an Map which contains a Number key when "getters" is an valid Map with Symbol key',
                function (done) {
                    const pars = {
                        ...params,
                        data: new Map([['start', 'w'], [Symbol(), 'z'], [1, 2]]),
                        isDataMap: true,
                        isGettersMap: true,
                        getters: new Map([[Symbol(), function() {}]])
                    };
                    result = 'success';
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                }
            );

            it(
                '"data" is an Map which contains a Number key when "getters" is an valid Map with RegExp key',
                function (done) {
                    const pars = {
                        ...params,
                        data: new Map([['start', 'w'], [Symbol(), 'z'], [1, 2]]),
                        isDataMap: true,
                        isGettersMap: true,
                        getters: new Map([[new RegExp('123'), function() {}]])
                    };
                    result = 'success';
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                }
            );

            it(
                '"data" is an Map which contains a Number key when "getters" is a Map with RegExp and invalid key',
                function (done) {
                    const pars = {
                        ...params,
                        data: new Map([['start', 'w'], [Symbol(), 'z'], [1, 2]]),
                        isDataMap: true,
                        isGettersMap: true,
                        getters: new Map([[new RegExp('123'), function() {}], [1, function() {}]])
                    };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_KEY);
                    done();
                }
            );

            it(
                `"data" don't contains an entry point when "options.start_name" is missing`,
                function (done) {
                    const pars = {
                        ...params,
                        data: new Map([['missing_start_key', 'w'], [Symbol(), 'z'], [1, 2]]),
                        isDataMap: true
                    };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.MISSING_ENTRY_POINT);
                    done();
                }
            );

            it(
                `"data" don't contains an entry point when "options.start_name" is presents`,
                function (done) {
                    const pars = {
                        ...params,
                        data: new Map([['missing_start_key', 'w'], [Symbol(), 'z'], [1, 2]]),
                        isDataMap: true,
                        options: { start_name: 'new_start_key' }
                    };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.MISSING_ENTRY_POINT);
                    done();
                }
            );

            it(
                '"data" is Map and contains a redefined entry point and Number key when getters is presents',
                function (done) {
                    const pars = {
                        ...params,
                        data: new Map([['redefined_start', 'w'], [Symbol(), 'z'], [1, 2]]),
                        isDataMap: true,
                        isGettersMap: true,
                        getters: new Map([[new RegExp('123'), function() {}]]),
                        options: { 'start_name': 'redefined_start'}
                    };
                    result = 'success';
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                }
            );

        });

        describe('"data" parameter', function() {
            before(function() {
                params = {
                    data: undefined,
                    options: {},
                    getters: undefined
                };
            });

            it('"data" is an valid Map when "getters" is missing', function (done) {
                const pars = { ...params, data: new Map([['start',2]]), isDataMap: true };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it('"data" is an valid Object when "getters" is missing', function (done) {
                const pars = { ...params, data: {'start': 'a'}, isDataMap: false };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it('Exception: "data" is an empty Map when "getters" is missing', function (done) {
                const pars = { ...params, data: new Map(), isDataMap: true };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.DATA_IS_EMPTY_MAP);
                done();
            });

            it('Exception: "data" is an empty Object when "getters" is missing', function (done) {
                const pars = { ...params, data: {}, isDataMap: false };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.DATA_IS_INVALID);
                done();
            });

            it('Exception: "data" is an RegExp when "getters" is missing', function (done) {
                const pars = { ...params, data: new RegExp('123'), isDataMap: false };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.DATA_IS_INVALID);
                done();
            });

            it('Exception: "data" is an Array when "getters" is missing', function (done) {
                const pars = { ...params, data: ['start', 'b'], isDataMap: false };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.DATA_IS_INVALID);
                done();
            });

            it('Exception: "data" is undefined when "getters" is missing', function (done) {
                validator(testModules, params);
                result.exception.code.should.be.equal(Exceptions.DATA_IS_NOT_OBJECT);
                done();
            });

            it('Exception: "data" is Number when "getters" is missing', function (done) {
                const pars = { ...params, data: 1 };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.DATA_IS_NOT_OBJECT);
                done();
            });
        });

        describe('"getters" parameter', function() {
            before(function() {
                params = {
                    data: {'start': 'b'},
                    options: {},
                    getters: undefined
                };
            });

            it('Exception: "getters" is an valid Map', function (done) {
                const pars = { ...params, getters: new Map([['1', function () {}]]), isGettersMap: true };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it('Exception: "getters" is an valid Object', function (done) {
                const pars = { ...params, getters: {'1': function () {}}, isGettersMap: false };
                result = 'success';
                validator(testModules, pars);
                result.should.be.equal('success');
                done();
            });

            it('Exception: "getters" is an empty Map', function (done) {
                const pars = { ...params, getters: new Map(), isGettersMap: true };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.GETTERS_IS_EMPTY_MAP);
                done();
            });

            it('Exception: "getters" is an empty Object', function (done) {
                const pars = { ...params, getters: {}, isGettersMap: false };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.GETTERS_IS_INVALID);
                done();
            });

            it('Exception: "getters" is an RegExp', function (done) {
                const pars = { ...params, getters: new RegExp('123'), isGettersMap: false };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.GETTERS_IS_INVALID);
                done();
            });

            it('Exception: "getters" is an Array', function (done) {
                const pars = { ...params, getters: ['a', 'b'], isGettersMap: false };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.GETTERS_IS_INVALID);
                done();
            });

            it('Exception: "getters" is Number', function (done) {
                const pars = { ...params, getters: 1 };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.GETTERS_IS_NOT_OBJECT);
                done();
            });

            it('Exception: "getters" element is not a Function (for Map)', function (done) {
                const pars = {
                    ...params, getters: new Map([[1, new RegExp('123')]]), isGettersMap: true
                };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.GETTER_IS_NOT_FUNCTION);
                done();
            });

            it('Exception: "getters" element is not a Function (for Object)', function (done) {
                const pars = {
                    ...params, getters: {1: 1}, isGettersMap: false
                };
                validator(testModules, pars);
                result.exception.code.should.be.equal(Exceptions.GETTER_IS_NOT_FUNCTION);
                done();
            });
        });

        describe('"options" parameter', function() {
            before(function() {
                params = {
                    data: {'start': 'b'},
                    options: {},
                    getters: undefined
                };
            });

            describe('options: general errors', function() {
                it('Exception: "options" is not an Object', function (done) {
                    const pars = { ...params, options: 1 };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_OPTIONS);
                    done();
                });

                it('Exception: "options" is an Array', function (done) {
                    const pars = { ...params, options: ['q', 'w'] };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_OPTIONS);
                    done();
                });

                it('Exception: "options" is a Map', function (done) {
                    const pars = { ...params, options: new Map([[1, 2]]) };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_OPTIONS);
                    done();
                });

                it('Exception: "options" is a Set', function (done) {
                    const pars = { ...params, options: new Set([1, 2]) };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_OPTIONS);
                    done();
                });

                it('Exception: "options" contains an unknown key', function (done) {
                    const pars = { ...params, options: {'unknown_key': 'qwerty'} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.UNKNOWN_KEY);
                    done();
                });
            });

            describe('options.start_name', function() {
                it('Exception: "options.start_name" is not a string', function (done) {
                    const pars = { ...params, options: {'start_name': new RegExp('123')} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_VALUE);
                    done();
                });

                it('Exception: "options.start_name" is an empty string', function (done) {
                    const pars = { ...params, options: {'start_name': ''} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_VALUE);
                    done();
                });

                it('"options.start_name" is undefined and ignored', function (done) {
                    result = 'success';
                    const pars = { ...params, options: {'start_name': undefined} };
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                });
            });

            describe('options.tag', function() {
                it('Exception: "options.tag" is not an Object', function (done) {
                    const pars = { ...params, options: {tag: 1} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_PH);
                    done();
                });

                it('Exception: "options.tag" is an Array', function (done) {
                    const pars = { ...params, options: {tag: ['q', 'w']} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_PH);
                    done();
                });

                it('Exception: "options.tag" is a Map', function (done) {
                    const pars = { ...params, options: {tag:new Map([[1, 2]])} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_PH);
                    done();
                });

                it('Exception: "options.tag" is a Set', function (done) {
                    const pars = { ...params, options: {tag: new Set([1, 2])} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_PH);
                    done();
                });

                it('Exception: "options.tag" contains an unknown key', function (done) {
                    const pars = { ...params, options: {tag: {'unknown_key': 'qwerty'} } };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.UNKNOWN_KEY);
                    done();
                });

                it('Exception: "options.tag.open" is not a string', function (done) {
                    const pars = { ...params, options: {tag: {open: 1}} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_VALUE);
                    done();
                });

                it('Exception: "options.tag.open" is an empty string', function (done) {
                    const pars = { ...params, options: {tag: {open: ''}} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_VALUE);
                    done();
                });

                it('"options.tag.open" is undefined and ignored', function (done) {
                    result = 'success';
                    const pars = { ...params, options: {tag: {open: undefined}} };
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                });

                it('"options.tag.open" is null and ignored', function (done) {
                    result = 'success';
                    const pars = { ...params, options: {tag: {open: null}} };
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                });

                it('Exception: "options.tag.close" is not a string', function (done) {
                    const pars = { ...params, options: {tag: {close: 1}} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_VALUE);
                    done();
                });

                it('Exception: "options.tag.close" is an empty string', function (done) {
                    const pars = { ...params, options: {tag: {close: ''}} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_VALUE);
                    done();
                });

                it('"options.tag.close" is undefined and ignored', function (done) {
                    result = 'success';
                    const pars = { ...params, options: {tag: {close: undefined}} };
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                });

                it('"options.tag.close" is null and ignored', function (done) {
                    result = 'success';
                    const pars = { ...params, options: {tag: {close: null}} };
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                });

                it('"options.tag" contains "open" and "close" keys', function (done) {
                    result = 'success';
                    const pars = { ...params, options: {tag: {open: 'asd', close: 'qwe'}} };
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                });
            });

            describe('options.mode', function() {
                it('Exception: "options.mode" is not an Object', function (done) {
                    const pars = { ...params, options: {mode: 1} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_MODE);
                    done();
                });

                it('Exception: "options.mode" is an Array', function (done) {
                    const pars = { ...params, options: {mode: ['q', 'w']} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_MODE);
                    done();
                });

                it('Exception: "options.mode" is a Map', function (done) {
                    const pars = { ...params, options: {mode:new Map([[1, 2]])} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_MODE);
                    done();
                });

                it('Exception: "options.mode" is a Set', function (done) {
                    const pars = { ...params, options: {mode: new Set([1, 2])} };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.INVALID_MODE);
                    done();
                });

                it('Exception: "options.mode" contains an unknown key', function (done) {
                    const pars = { ...params, options: {mode: {'unknown_key': 'qwerty'} } };
                    validator(testModules, pars);
                    result.exception.code.should.be.equal(Exceptions.UNKNOWN_KEY);
                    done();
                });

                it('"options.mode" contains "fast" key', function (done) {
                    result = 'success';
                    const pars = { ...params, options: {mode: {fast: true}} };
                    validator(testModules, pars);
                    result.should.be.equal('success');
                    done();
                });
            });
        });
    });

});
