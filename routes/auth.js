let express = require('express');
let router = express.Router()
let userController = require('../controllers/users')
let bcrypt = require('bcrypt')
let { generateToken, authenticate } = require('../utils/authHandler')

router.post('/register', async function (req, res, next) {
    try {
        let { username, password, email } = req.body;
        let newUser = await userController.CreateAnUser(username, password, email,
            "69b1265c33c5468d1c85aad8"
        )
        res.send(newUser)
    } catch (error) {
        res.status(404).send({
            message: error.message
        })
    }
})
router.post('/login', async function (req, res, next) {
    try {
        let { username, password } = req.body;
        let user = await userController.GetAnUserByUsername(username);
        if (!user) {
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
            return;
        }
        if (user.lockTime > Date.now()) {
            res.status(404).send({
                message: "ban dang bi ban"
            })
            return;
        }
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            await user.save()
            const token = generateToken({ id: user._id, username: user.username });
            res.send({
                token: token
            })
        } else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = Date.now() + 3600 * 1000;
            }
            await user.save()
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
        }
    } catch (error) {
        res.status(404).send({
            message: error.message
        })
    }
})

router.get('/me', authenticate, async function (req, res, next) {
    try {
        const user = await userController.GetAnUserById(req.user.id);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.send({
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.post('/changepassword', authenticate, async function (req, res, next) {
    try {
        const { oldpassword, newpassword } = req.body;
        const user = await userController.GetAnUserById(req.user.id);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        if (!bcrypt.compareSync(oldpassword, user.password)) {
            return res.status(400).send({ message: 'Old password is incorrect' });
        }
        // Validate newpassword: at least 6 characters, contains letters and numbers
        if (newpassword.length < 6 || !/[a-zA-Z]/.test(newpassword) || !/\d/.test(newpassword)) {
            return res.status(400).send({ message: 'New password must be at least 6 characters and contain both letters and numbers' });
        }
        const hashedPassword = bcrypt.hashSync(newpassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.send({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router