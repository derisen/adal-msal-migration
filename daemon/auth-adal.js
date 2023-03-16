var adal = require('adal-node');

var AuthenticationContext = adal.AuthenticationContext;

var log = adal.Logging;

log.setLoggingOptions({
    level: log.LOGGING_LEVEL.VERBOSE,
    log: function (level, message, error) {
        if (error) {
            console.log(error);
        }

        console.log(message);
    }
});

const adalConfig = {
    tenant: 'Enter_the_Tenant_Info_Here',
    clientId: 'Enter_the_Application_Id_Here',
    clientSecret: 'Enter_the_Client_Secret_Here',
    resource: 'https://graph.microsoft.com'
};

function getTokenWithAdal(tenantId, callback) {
    var authorityUrl = 'https://login.microsoftonline.com/' + tenantId;
    var context = new AuthenticationContext(authorityUrl, true);

    return context.acquireTokenWithClientCredentials(
        adalConfig.resource,
        adalConfig.clientId,
        adalConfig.clientSecret,
        callback
    );
}

module.exports = getTokenWithAdal;