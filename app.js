const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const app = express();
const { Op } = require('sequelize');
const { USERS, POSTS, COMMENTS } = require('./models');
const authMiddleware = require('./middlewares/auth-middleware');
const { i } = require('mathjs');
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


const postUsersSchema = Joi.object({
    nickname: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().min(3).required(),
    confirmPw: Joi.string().min(3).required(),
})

// 회원가입
router.post('/register', async (req, res) => {
    try {
        const { nickname, password, confirmPw } = await postUsersSchema.validateAsync(req.body);

        if (nickname.includes(password) || password.includes(nickname)) {
            res.status(400).send({
                errorMessage: '비밀번호에 닉네임이 포함되어 있습니다.',
            });
            return;
        }

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
    } catch (error) {
        console.log(error);
        res.status(400).send({
            errorMessage: '데이터 형식이 올바르지 않습니다.',
        })
    }

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

// posts SQL 테이블에 글 넣기
router.post('/post', authMiddleware, async (req, res) => {
    // if not logged in, unable to make the post.
    // it logged in, identify the post with the user's identity.
    try {
        const { user } = res.locals;
        const userId = user.userId;
        console.log('userId', userId);
        const { title, content } = req.body;
        console.log('title content', title, content)


        await POSTS.create({ title, content, userId });

        res.status(201).send({});
    } catch (error) {
        console.log('submitPost error', error);
        res.status(400).send({
            errorMessage: '글 쓰기에 실패했습니다',
        })
    }
})

router.get('/post', async (req, res) => {
    try {
        const allPosts = await POSTS.findAll({});
        const nicknames = await USERS.findAll({})
        res.status(201).send({ allPosts, nicknames });
    } catch (error) {
        console.log('get posts error', error);
        res.status(400).send({
            errorMessage: '글 불러오기에 실패했습니다',
        })
    }
});

router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await POSTS.findOne({
            where: {
                id: postId,
            },
        });
        const nicknames = await USERS.findAll({});

        res.status(201).send({ post, nicknames });
    } catch (error) {
        console.log('get posts error', error);
        res.status(400).send({
            errorMessage: '특정 글 불러오기에 실패했습니다',
        })
    }
});

// COMMENTS
router.post('/comment', authMiddleware, async (req, res) => {
    try {
        const { user } = res.locals;
        const userId = user.userId;
        const { comment, postId } = req.body;
        console.log('comment postId', comment, postId, userId);
        await COMMENTS.create({ postId, userId, comment });
        res.status(201).send({});

    } catch (error) {
        console.log('write comment error', error);
        res.status(400).send({
            errorMessage: '댓글 쓰기 실패했습니다',
        })
    }
})
//DISPLAY COMMENTS
router.get('/comment/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const commentList = await COMMENTS.findAll({
            where: {
                postId: postId,
            },
        });
        res.status(201).send({ commentList });

    } catch (error) {
        console.log('get comment error', error);
        res.status(400).send({
            errorMessage: 'failed to GET comments...',
        })
    }
});

//EDIT COMMENTS
router.post('/editComment', authMiddleware, async (req, res) => {
    try {
        const { user } = res.locals;
        const userId = user.userId;   //현재 로그인 되어있는 유저 아이디
        const { commentId, postId, comment } = req.body;
        console.log('comment postId', comment, postId, userId);
        // await COMMENTS.create({ postId, userId, comment });

        const findComment = await COMMENTS.findOne({
            where: {
                commentId: commentId,
            },
        })
        let commentOwner = findComment.userId;
        if (userId !== commentOwner) {
            res.status(400).send({
                errorMessage: '해당 댓글 작성자만 수정할 수 있습니다.',
            })
            return;
        }

        findComment.comment = comment;
        await findComment.save();

        res.status(201).send({});
    } catch (error) {
        console.log('write comment error', error);
        res.status(400).send({
            errorMessage: '댓글 수정에 실패했습니다',
        })
    }
})

router.delete('/deleteComment', authMiddleware, async (req, res) => {
    try {
        const { user } = res.locals;
        const userId = user.userId;   //현재 로그인 되어있는 유저 아이디
        const { commentId } = req.body;
        console.log('commentid', commentId);

        const findComment = await COMMENTS.findOne({
            where: {
                commentId: commentId,
            },
        })
        let commentOwner = findComment.userId;
        if (userId !== commentOwner) {
            res.status(400).send({
                errorMessage: '해당 댓글 작성자만 삭제할 수 있습니다.',
            })
            return;
        }
        await findComment.destroy();
        res.status(201).send({});

    } catch (error) {
        console.log('DELETE COMMENT ERROR', error);
        res.status(400).send({
            errorMessage: '댓글 삭제에 실패했습니다',
        })
    }
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