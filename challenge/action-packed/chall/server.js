const express = require('express');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');

const app = express();
const upload = multer();
const PORT = process.env.PORT || 8160;
const FLAG = process.env.FLAG || "LEEXY{c693172d-af96-4766-9dc8-0f54de51cbf3}";

const users = [];

users.push({
    id: 1,
    username: 'admin',
    password: crypto.randomBytes(16).toString('hex'),
    role: 'admin'
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'action-packed-secret-key-super-secure',
    resave: false,
    saveUninitialized: false
}));

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.userId = user.id;
        req.session.role = user.role;
        return res.redirect('/');
    }
    res.send('<script>alert("Invalid credentials"); window.location="/login";</script>');
});

app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send('<script>alert("Missing fields"); window.location="/register";</script>');
    }
    if (users.find(u => u.username === username)) {
        return res.send('<script>alert("Username exists"); window.location="/register";</script>');
    }
    users.push({
        id: users.length + 1,
        username,
        password,
        role: 'user'
    });
    res.redirect('/login');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/api/me', requireAuth, (req, res) => {
    res.json({ role: req.session.role });
});

app.post('/', requireAuth, upload.none(), (req, res) => {
    const origin = req.headers.origin;
    const host = req.headers.host;

    if (origin && host) {
        try {
            const originUrl = new URL(origin);
            if (originUrl.host !== host) {
                return res.status(500).send("Internal Server Error");
            }
        } catch (e) {
            return res.status(500).send("Internal Server Error");
        }
    } else if (!origin) {
        return res.status(500).send("Internal Server Error");
    }

    const nextAction = req.headers['next-action'];
    res.type('text/x-component');

    if (nextAction === 'cd2b4b472561774fc0bd652dc4da5719a893167d') {
        const responseText = `0:["$@1",["BXWGN_shhgAoAo8Z4rloN",null]]\n1:{"success":true,"message":"Profile updated successfully."}`;
        return res.send(responseText);
    }
    else if (nextAction === '33924c174e655435ab82a6bdaee5448329835b12') {
        const responseText = `0:["$@1",["BXWGN_shhgAoAo8Z4rloN",null]]\n1:{"token":"${FLAG}"}`;
        return res.send(responseText);
    }
    else {
        return res.status(400).send("Bad Request");
    }
});

app.listen(PORT, () => {
    console.log(`Action-Packed server listening on port ${PORT}`);
});
