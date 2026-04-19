const express = require('express');
const router = express.Router();
const db = require('../database');
const { body, validationResult } = require('express-validator');

router.get('/', (req, res, next) => {
    db.all("SELECT * FROM Users", [], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

router.post('/', 
    body('name').isString().trim().notEmpty(),
    body('type').isIn(['adult', 'child']),
    body('age').optional({ nullable: true }).isInt({ min: 0 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, type, age } = req.body;
        db.run("INSERT INTO Users (name, type, age) VALUES (?, ?, ?)", [name, type, age], function(err) {
            if (err) return next(err);
            res.json({ id: this.lastID, name, type, age });
        });
    }
);

router.delete('/:id', (req, res, next) => {
    db.run("DELETE FROM Users WHERE id = ?", [req.params.id], function(err) {
        if (err) return next(err);
        res.json({ success: true });
    });
});

module.exports = router;
