const jwt = require('jsonwebtoken');
const { USERS, POSTS } = require('../models');

module.exports = (req, res, next) => {
    console.log('req.headers', req.headers);
    const { authorization } = req.headers;
    const [authType, authToken] = (authorization || '').split(' ');
    console.log('authorization', authorization);
    console.log('auth type', authType);
    console.log('auth token', authToken);

    if (!authToken || authType !== 'Bearer') {
        res.status(401).send({
            errorMessage: 'authToken/authType error',
        });
        return;
    }

    try {
        const { userId } = jwt.verify(authToken, 'secretPlease');
        USERS.findByPk(userId).then((user) => {
            res.locals.user = user;
            next();
        });
    } catch (err) {
        console.log('error', err);
        res.status(401).send({
            errorMessage: '로그인 후 이용 가능한 기능입니다.',
        });
    }
};
