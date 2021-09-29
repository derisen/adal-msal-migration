const express = require('express');
const path = require('path');

const DEFAULT_PORT = process.env.PORT || 3000;

// initialize express.
const app = express();

// Initialize variables.
let port = DEFAULT_PORT;

// Setup app folders.
app.use(express.static('App'));

// Set up a route for index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/index2.html'));
});

// Start the server.
app.listen(port);

console.log(`Listening on port ${port}...`);
