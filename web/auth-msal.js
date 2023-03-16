// Import dependencies
const express = require("express");
const msal = require('@azure/msal-node');

// Authentication parameters
const msalConfig = {
    auth: {
        clientId: "Enter_the_Application_Id_Here",
        authority: "https://login.microsoftonline.com/Enter_the_Tenant_Info_Here",
        clientSecret: "Enter_the_Client_Secret_Here"
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

const REDIRECT_URI = "http://localhost:4000/redirect";

const router = express.Router();

// ensure session is available
router.use((req, res, next) => {

    if (!req.session) {
        throw new Error("Session not found. Please check your session middleware configuration.");
    }

    next();
});

router.get('/login', function (req, res, next) {
    // Initialize MSAL Node object using authentication parameters
    const cca = new msal.ConfidentialClientApplication(msalConfig);

    req.session.state = new msal.CryptoProvider().createNewGuid();

    // Construct a request object for auth code
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
        state: req.session.state,
        responseMode: "form_post"
    };

    // Request auth code, then redirect
    cca.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            res.redirect(response);
        }).catch((error) => {
            next(error);
        });
});

router.get('/logout', function (req, res, next) {
    const logoutUri = `${msalConfig.auth.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:4000`;

    // end session with AAD
    req.session.destroy(() => {
        res.redirect(logoutUri);
    });
});

router.post('/redirect', function (req, res, next) {
    // Initialize MSAL Node object using authentication parameters
    const cca = new msal.ConfidentialClientApplication(msalConfig);

    // Use the auth code in redirect request to construct
    // a token request object
    const tokenRequest = {
        code: req.body.code,
        scopes: ["User.Read"],
        redirectUri: REDIRECT_URI,
        state: req.session.state,
    };

    // Exchange the auth code for tokens
    cca.acquireTokenByCode(tokenRequest, req.body)
        .then((response) => {
            req.session.isAuthenticated = true;
            req.session.username = response.account.username;
            res.redirect("/");
        }).catch((error) => {
            next(error);
        });
});

module.exports = router;