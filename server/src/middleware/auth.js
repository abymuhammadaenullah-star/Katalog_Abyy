import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'katalogwa_super_secret_jwt_key_2026';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi tidak ditemukan'});
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Sesi kedaluwarsa atau token tidak valid' });
        }
        req.user = user;
        next();
    });
};

export { JWT_SECRET };