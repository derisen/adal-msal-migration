var express = require('express');
var crypto = require('crypto');

var logging = require('adal-node').Logging;
var AuthenticationContext = require('adal-node').AuthenticationContext;

//PII or OII logging disabled. Default Logger does not capture any PII or OII.
logging.setLoggingOptions({
  log: function (level, message, error) {
    console.log(message);

    if (error) {
      console.log(error);
    }
  },
  level: logging.LOGGING_LEVEL.VERBOSE, // provide the logging level
  loggingWithPII: false  // Determine if you want to log personal identification information. The default value is false.
});

var clientId = 'dbf79ff8-ef8a-4acb-86e6-3c1725d04d46';
var clientSecret = 'kW2S~TMK617-Ev2y19yx_smgTzJA_P53Zi'
var authorityHostUrl = 'https://login.microsoftonline.com';
var tenant = 'common';
var authorityUrl = authorityHostUrl + '/' + tenant;
var redirectUri = 'http://localhost:3000/redirect';
var scope = 'https://graph.microsoft.com/user.read';

var templateAuthzUrl = 'https://login.microsoftonline.com/' +
  tenant +
  '/oauth2/v2.0/authorize?response_type=code&client_id=' +
  clientId +
  '&redirect_uri=' +
  redirectUri +
  '&state=<state>&scope=' +
  scope;

function createAuthorizationUrl(state) {
  return templateAuthzUrl.replace('<state>', state);
}

var app = express();

app.locals.state = "";

// Clients get redirected here in order to create an OAuth authorize url and redirect them to AAD.
// There they will authenticate and give their consent to allow this app access to
// some resource they own.
app.get('/auth', function (req, res) {
  crypto.randomBytes(48, function (ex, buf) {
    app.locals.state = buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
    var authorizationUrl = createAuthorizationUrl(app.locals.state);
    res.redirect(authorizationUrl);
  });
});

// After consent is granted AAD redirects here.  The ADAL library is invoked via the
// AuthenticationContext and retrieves an access token that can be used to access the
// user owned resource.
app.get('/redirect', function (req, res) {
  if (app.locals.state != req.query.state) {
    res.send('error: state does not match');
  }

  var authenticationContext = new AuthenticationContext(authorityUrl);

  authenticationContext.acquireTokenWithAuthorizationCode(
    req.query.code,
    redirectUri,
    scope,
    clientId,
    clientSecret,
    function (err, response) {
      var errorMessage = '';

      if (err) {
        errorMessage = 'error: ' + err.message + '\n';
      }

      errorMessage += 'response: ' + JSON.stringify(response);
      res.send(errorMessage);
    }
  );
});

app.listen(3000);

console.log('listening on 3000');