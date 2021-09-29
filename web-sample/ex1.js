var express = require('express');
var crypto = require('crypto');
var adal = require('adal-node');

var clientId = 'Enter_the_Application_Id_Here';
var clientSecret = 'Enter_the_Client_Secret_Here';
var tenant = 'common';
var authorityUrl = 'https://login.microsoftonline.com/' + tenant;
var redirectUri = 'http://localhost:3000/redirect';
var resource = 'https://graph.microsoft.com';

adal.Logging.setLoggingOptions({
    log: function (level, message, error) {
        console.log(message);
    },
    level: adal.Logging.LOGGING_LEVEL.VERBOSE,
    loggingWithPII: false
});

var templateAuthzUrl = 'https://login.microsoftonline.com/' + tenant + '/oauth2/authorize?response_type=code&client_id=' 
 + clientId + '&redirect_uri=' + redirectUri + '&state=<state>&resource=' + resource;

var app = express();
app.locals.state = "";

app.get('/auth', function (req, res) {
    crypto.randomBytes(48, function (ex, buf) {
        app.locals.state = buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
        var authorizationUrl = templateAuthzUrl.replace('<state>', app.locals.state);
        res.redirect(authorizationUrl);
    });
});

app.get('/redirect', function (req, res) {
    if (app.locals.state !== req.query.state) {
        res.send('error: state does not match');
    }

    var authenticationContext = new adal.AuthenticationContext(authorityUrl);

    authenticationContext.acquireTokenWithAuthorizationCode(
        req.query.code, redirectUri, resource, clientId, clientSecret,
        function (err, response) {
            res.send(response);
        }
    );
});

app.listen(3000, function() { console.log(`listening on port 3000!`); });