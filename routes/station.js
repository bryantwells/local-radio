const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/:slug', (req, res) => {
    const sourceList = req.app.get('sourceList');

    sourceList.getStats()
        .then((response) => {
            // render options
            const sources = response.source || [];
            const source = sources.filter(s => s.$.mount === `/${req.params.slug}`)
                .map(s => ({
                    mount: s.$.mount,
                    title: JSON.parse(s.title[0]).title,
                    description: JSON.parse(s.title[0]).description,
                    listeners: s.listeners,
                    streamStart: s.stream_start_iso8601,
                }))[0];
            res.render('station', {
                title: source.title,
                host: req.headers.host,
                source,
            });
        })
        .catch((error) => {
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.log(error);
        });
});

module.exports = router;
