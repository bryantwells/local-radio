const express = require('express');
const request = require('request');
const router = express.Router();

// GET home page
router.get('/:slug', function (req, res, next) {
    const newUrl = `https://${process.env.ICECAST_HOST}:${process.env.ICECAST_PORT || '8000'}/${req.params.slug}`;
    request(newUrl).pipe(res);
});

module.exports = router;
