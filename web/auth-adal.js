// Import dependencies
var express = require('express');
var crypto = require('crypto');
var adal = require('adal-node');

// Authentication parameters
var clientId = 'Enter_the_Application_Id_Here';
var clientSecret = 'Enter_the_Client_Secret_Here';
var tenant = 'Enter_the_Tenant_Info_Here';
var authorityUrl = 'https://login.microsoftonline.com/' + tenant;
var redirectUri = 'http://localhost:4000/redirect';
var resource = 'https://graph.microsoft.com';

// Configure logging
adal.Logging.setLoggingOptions({
    log: function (level, message, error) {
        console.log(message);
    },
    level: adal.Logging.LOGGING_LEVEL.VERBOSE,
    loggingWithPII: false
});

// Auth code request URL template
var templateAuthzUrl = 'https://login.microsoftonline.com/'
    + tenant + '/oauth2/authorize?response_type=code&client_id='
    + clientId + '&response_mode=form_post' + '&redirect_uri=' + redirectUri
    + '&state=<state>&resource=' + resource;

var router = express.Router();

// ensure session is available
router.use((req, res, next) => {

    if (!req.session) {
        throw new Error("Session not found. Please check your session middleware configuration.");
    }

    next();
});

router.get('/login', function (req, res, next) {
    // Create a random string to use against XSRF
    crypto.randomBytes(48, function (ex, buf) {
        req.session.state = buf.toString('base64')
            .replace(/\//g, '_')
            .replace(/\+/g, '-');

        // Construct auth code request URL
        var authorizationUrl = templateAuthzUrl
            .replace('<state>', req.session.state);

        res.redirect(authorizationUrl);
    });
});

router.get('/logout', function (req, res, next) {
    const logoutUri = "https://login.microsoftonline.com/" + tenant + "/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:4000";

    // Clear session
    req.session.destroy(() => {
        res.redirect(logoutUri);
    });
});

router.post('/redirect', function (req, res, next) {
    // Compare state parameter against XSRF
    if (req.session.state !== req.body.state) {
        res.send('error: state does not match');
    }

    // Initialize an AuthenticationContext object
    var authenticationContext =
        new adal.AuthenticationContext(authorityUrl);

    // Exchange auth code for tokens
    authenticationContext.acquireTokenWithAuthorizationCode(
        req.body.code,
        redirectUri,
        resource,
        clientId,
        clientSecret,
        function (err, response) {
            if (err) {
                return next(err);
            }

            req.session.isAuthenticated = true;
            req.session.username = response.userId;
            res.redirect("/");
        }
    );
});

module.exports = router;