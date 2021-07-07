const supertest = require('supertest');
const app = require('./app');
const { isCorrectNickname, isCorrectPassword, isSamePassword, isNicknameOverlap } = require('./app.js');


//닉네임 최소 3자
test('닉네임은 최소 3자이어야한다.', () => {
    // const value = supertest(app).isCorrectNickname('leehyunsu');
    // expect(value).toEqual(true);
    expect(isCorrectNickname('ss')).toEqual(false);
});

test('닉네임은 최소 3자이어야한다.', () => {
    // const value = supertest(app).isCorrectNickname('leehyunsu');
    // expect(value).toEqual(true);
    expect(isCorrectNickname('sasdfs')).toEqual(true);
});

//닉네임 숫자 알파벳
test('닉네임은 숫자, 영어 알파벳으로만 이루어져야한다.', () => {
    expect(isCorrectNickname('leehyunsu')).toEqual(true);
});

test('닉네임은 숫자, 영어 알파벳으로만 이루어져야한다.', () => {
    expect(isCorrectNickname('leehyunsuㅇ')).toEqual(false);
});

test('닉네임은 숫자, 영어 알파벳으로만 이루어져야한다.', () => {
    expect(isCorrectNickname('leehyun$u')).toEqual(false);
});


