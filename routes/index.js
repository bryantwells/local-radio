const express = require('express');

const router = express.Router();

// GET home page
router.get('/', (req, res) => {
    const sourceList = req.app.get('sourceList');

    sourceList.getStats()
        .then((response) => {
            // render options
            const sources = response.source || [];
            res.render('index', {
                title: 'Local Radio',
                host: req.headers.host,
                sources: sources.map(s => ({
                    mount: s.$.mount,
                    title: JSON.parse(s.title[0]).title,
                    description: JSON.parse(s.title[0]).description,
                    listeners: s.listeners,
                    streamStart: s.stream_start_iso8601,
                })),
            });
        })
        .catch((error) => {
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.log(error);
        });
});

module.exports = router;
