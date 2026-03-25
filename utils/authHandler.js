const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(path.join(__dirname, '../private.pem'), 'utf8');
const publicKey = fs.readFileSync(path.join(__dirname, '../public.pem'), 'utf8');

function generateToken(payload) {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1h' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (err) {
        return null;
    }
}

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Token required' });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).send({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
}

module.exports = { generateToken, verifyToken, authenticate };