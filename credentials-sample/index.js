var adal = require('adal-node');

var AuthenticationContext = adal.AuthenticationContext;

var log = adal.Logging;

log.setLoggingOptions(
  {
    level: log.LOGGING_LEVEL.VERBOSE,
    log: function (level, message, error) {
      console.log(message);
      if (error) {
        console.log(error);
      }
    }
  });

const sampleParameters = {
  tenant: 'msaltestingjs.onmicrosoft.com',
  authorityHostUrl: 'https://login.microsoftonline.com',
  clientId: 'e92390db-c49c-46f5-b385-0238ddb6d408',
  resource: 'https://graph.microsoft.com',
  clientSecret: '_._9_~wb1aMwNWQZZW5o6aprBLINE~9s4y'
};

var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;
var validateAuthority = true;

var context = new AuthenticationContext(authorityUrl, validateAuthority);

context.acquireTokenWithClientCredentials(sampleParameters.resource, sampleParameters.clientId, sampleParameters.clientSecret, function (err, tokenResponse) {
  if (err) {
    console.log(err.stack);
  } else {
    console.log(tokenResponse);
  }
});