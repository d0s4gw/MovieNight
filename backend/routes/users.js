const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { body, validationResult } = require('express-validator');

// Get all profiles for the authenticated owner
router.get('/', async (req, res, next) => {
    try {
        const profiles = await Profile.find({ ownerId: req.user.uid });
        res.json(profiles.map(p => ({
            id: p._id,
            name: p.name,
            type: p.type,
            age: p.age,
            updatedAt: p.updatedAt
        })));
    } catch (error) {
        next(error);
    }
});

// Create a new household profile
router.post('/', 
    body('name').isString().trim().notEmpty(),
    body('type').isIn(['adult', 'child']),
    body('age').optional({ nullable: true }).isInt({ min: 0 }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, type, age } = req.body;
        
        try {
            const profile = new Profile({
                ownerId: req.user.uid,
                name,
                type,
                age: age || null
            });
            await profile.save();
            res.json({
                id: profile._id,
                name: profile.name,
                type: profile.type,
                age: profile.age,
                updatedAt: profile.updatedAt
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update a household profile
router.put('/:id',
    body('name').isString().trim().notEmpty(),
    body('type').isIn(['adult', 'child']),
    body('age').optional({ nullable: true }).isInt({ min: 0 }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, type, age } = req.body;
        
        try {
            const profile = await Profile.findOneAndUpdate(
                { _id: req.params.id, ownerId: req.user.uid },
                { name, type, age: age || null },
                { new: true }
            );
            if (!profile) return res.status(404).json({ error: 'Profile not found' });
            res.json({
                id: profile._id,
                name: profile.name,
                type: profile.type,
                age: profile.age,
                updatedAt: profile.updatedAt
            });
        } catch (error) {
            next(error);
        }
    }
);

// Delete a household profile
router.delete('/:id', async (req, res, next) => {
    try {
        const profile = await Profile.findOneAndDelete({ _id: req.params.id, ownerId: req.user.uid });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// Backwards compatibility for the /profile endpoint (returns the owner's primary profile or first one)
router.get('/profile', async (req, res, next) => {
    try {
        let profile = await Profile.findOne({ ownerId: req.user.uid });
        if (!profile) {
            // Create a default one if none exists
            profile = new Profile({
                ownerId: req.user.uid,
                name: req.user.name || 'User',
                type: 'adult'
            });
            await profile.save();
        }
        res.json({
            id: profile._id,
            name: profile.name,
            type: profile.type,
            age: profile.age,
            updatedAt: profile.updatedAt
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
