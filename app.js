const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const { Op } = require('sequelize');
const { USERS } = require('./models');
const authMiddleware = require('./middlewares/auth-middleware');
const router = express.Router();
const port = 3000;

// 바디,json,media 데이터
app.use(express.urlencoded({ extended: false }));
app.use('/api', express.urlencoded({ extended: false }), router);

app.use(express.json());
app.use(express.static('public'));



// 템플릿 엔진
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


// 회원가입
router.post('/register', async (req, res) => {
    const { nickname, password, confirmPw } = req.body;

    if (password !== confirmPw) {
        res.status(400).send({
            errorMessage: '비밀번호가 비밀번호 확인란과 동일하지 않습니다',
        });
        return;
    }

    const existUsers = await USERS.findAll({
        where: {
            [Op.or]: [{ nickname }],
        }
    });
    if (existUsers.length) {
        res.status(400).send({
            errorMessage: '중복되는 닉네임 입니다. 다른 닉네임을 선택하세요',
        });
        return;
    }

    await USERS.create({ nickname, password });

    res.status(201).send({});
})

// 로그인
router.post('/auth', async (req, res) => {
    const { nickname, password } = req.body;

    const user = await USERS.findOne({ where: { nickname, password } });

    if (!user) {
        res.status(400).send({
            errorMessage: '닉네임이나 비밀번호가 잘못됐습니다.',
        });
        return;
    }
    const token = jwt.sign({ userId: user.userId }, 'secretPlease');
    res.send({
        token,
    });
});
router.get('/users/me', authMiddleware, async (req, res) => {
    // console.log('res.locals',res.locals);
    const { user } = res.locals;
    console.log('user', user);
    res.send({
        user,
    });
})


// 각종 url
app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.get('/register', (req, res) => {
    res.render('register.ejs');
})


app.get('/allEntries', (req, res) => {
    res.render('allEntries.ejs');
})
app.get('/entry', (req, res) => {
    res.render('entry.ejs');
})



app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
})