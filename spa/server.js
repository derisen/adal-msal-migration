const express = require('express');
const path = require('path');

const port = process.env.PORT || 3000;

// initialize express.
const app = express();

// Setup app folders.
app.use(express.static('public'));

// Set up a route for index.html
app.get('/adal', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

// app.get('/msal', (req, res) => {
//     res.sendFile(path.join(__dirname + '/public/index.html'));
// });

// Start the server.
app.listen(port);

console.log(`Listening on port ${port}...`);
