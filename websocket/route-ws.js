const app = require('../app');
var url = require('url');

// credentials
const credentials = {
    admin: {
        user: process.env.ADMIN_USER,
        pass: process.env.ADMIN_PASS
    },
    source: {
        user: process.env.SOURCE_USER,
        pass: process.env.SOURCE_PASS
    }
}


// routing
function routeWsRequest(request, socket, head) {

    // check route path
    switch (url.parse(request.url).pathname) {

        case '/mount': 

            // check headers
            const protocolIsValid = request.headers['sec-websocket-protocol'] == 'webcast'

            if (protocolIsValid) {

                // on first connection
                console.log(`${new Date()} -- Connection accepted`);

                // handle connection
                app.wss.handleUpgrade(request, socket, head, (ws) => {
                    app.get('sourceList').createSource(request, credentials, ws);
                })

            }

            break;

        default:

            // destroy connection
            socket.destroy();

    }

}

module.exports = routeWsRequest;