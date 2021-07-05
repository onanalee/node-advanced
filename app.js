const express = require('express');
const app = express();
const port = 3000;

// 바디,json,media 데이터
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static('public'));



// 템플릿 엔진
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');



// 각종 url
app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
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