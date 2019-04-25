const express = require('express');

const router = express.Router();

// GET home page
router.get('/', (request, response) => {
    response.render('new', { 
        title: 'New Station',
        host: request.headers.host,
    });
});

module.exports = router;
