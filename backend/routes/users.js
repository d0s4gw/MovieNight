const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Get the profile for the current authenticated user
router.get('/profile', async (req, res, next) => {
    try {
        const user = await User.findOne({ userId: req.user.uid });
        if (!user) {
            // Default profile if none exists
            return res.json({ name: req.user.name || 'User', type: 'adult', age: null });
        }
        res.json({
            name: user.name,
            type: user.type,
            age: user.age,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        next(error);
    }
});

// Update the profile for the current authenticated user
router.post('/profile', 
    body('name').isString().trim().notEmpty(),
    body('type').isIn(['adult', 'child']),
    body('age').optional({ nullable: true }).isInt({ min: 0 }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, type, age } = req.body;
        
        try {
            const updatedUser = await User.findOneAndUpdate(
                { userId: req.user.uid },
                { 
                    userId: req.user.uid,
                    name, 
                    type, 
                    age: age || null, 
                    updatedAt: new Date() 
                },
                { upsert: true, new: true }
            );
            res.json({
                name: updatedUser.name,
                type: updatedUser.type,
                age: updatedUser.age,
                updatedAt: updatedUser.updatedAt
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
