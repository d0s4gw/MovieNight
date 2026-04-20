const express = require('express');
const router = express.Router();
const db = require('../database');
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res, next) => {
    try {
        const snapshot = await db.collection('Users').get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        res.json(users);
    } catch (error) {
        next(error);
    }
});

router.post('/', 
    body('name').isString().trim().notEmpty(),
    body('type').isIn(['adult', 'child']),
    body('age').optional({ nullable: true }).isInt({ min: 0 }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, type, age } = req.body;
        
        try {
            const newUser = { name, type, age: age || null };
            const docRef = await db.collection('Users').add(newUser);
            res.json({ id: docRef.id, ...newUser });
        } catch (error) {
            next(error);
        }
    }
);

router.delete('/:id', async (req, res, next) => {
    try {
        await db.collection('Users').doc(req.params.id).delete();
        
        // Also clean up preferences and watchlist for this user
        const prefSnapshot = await db.collection('UserPreferences').where('userId', '==', req.params.id).get();
        prefSnapshot.forEach(doc => doc.ref.delete());
        
        const watchSnapshot = await db.collection('Watchlist').where('userId', '==', req.params.id).get();
        watchSnapshot.forEach(doc => doc.ref.delete());

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
