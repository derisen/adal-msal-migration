var msal = require('@azure/msal-node');

const clientConfig = {
    auth: {
        clientId: 'Enter_the_Application_Id_Here',
        authority: "https://login.microsoftonline.com/Enter_the_Tenant_Info_Here",
        clientSecret: 'Enter_the_Client_Secret_Here',
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

function getTokenWithMsal(tenantId) {
    const cca = new msal.ConfidentialClientApplication(clientConfig);

    const clientCredentialRequest = {
        authority: 'https://login.microsoftonline.com/' + tenantId,
        scopes: ["https://graph.microsoft.com/.default"],
    };

    return cca
        .acquireTokenByClientCredential(clientCredentialRequest)
        .then((response) => {
            console.log(response);
        }).catch((error) => {
            console.log(error);
        });
}

module.exports = getTokenWithMsal;