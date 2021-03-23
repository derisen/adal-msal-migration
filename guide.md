---
title: Migrating to MSAL Node
titleSuffix: Microsoft identity platform
description: Learn about the differences between the Microsoft Authentication Library for Node.js (MSAL Node) and Azure AD Authentication Library for Node.js (ADAL Node) and how to migrate to MSAL Node
services: active-directory
author: derisen
manager: CelesteDG

ms.service: active-directory
ms.subservice: develop
ms.topic: conceptual
ms.workload: identity
ms.date: 04/10/2019
ms.author: v-doeris
ms.reviewer: saeeda
ms.custom: "aaddev"
#Customer intent: As an application developer, I want to learn about the differences between the ADAL Node and MSAL Node libraries so I can migrate my applications to MSAL Node.
---

# Migrating applications to MSAL Node

Many developers have built and deployed applications using the [Active Directory Authentication Library](https://github.com/AzureAD/azure-activedirectory-library-for-nodejs) (ADAL Node). We now recommend using the [Microsoft Authentication Library](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) (MSAL Node). By using MSAL instead of ADAL:

- You can authenticate a broader set of identities:
  - Azure AD identities (i.e. work and school accounts)
  - personal Microsoft accounts
  - Social and local accounts by using Azure AD B2C
- Your users will get the best single-sign-on experience.
- Your application can enable incremental consent.
- Supporting [Conditional Access](https://docs.microsoft.com/azure/active-directory/develop/v2-conditional-access-dev-guide) is easier.
- You benefit from innovation. Because all Microsoft development efforts are now focused on MSAL, no new features will be implemented in ADAL.

## Differences between ADAL and MSAL apps

This section outlines the differences between ADAL Node and MSAL Node. You will first see the full code for an express.js web application acquiring token for a resource with ADAL Node and then the same application with MSAL Node. After comparison, the code will be discussed in depth.

### Code Comparison

The snippet below demonstrates a confidential client web app written in Express.js and secured with ADAL Node. The web app performs a sign-in when a user hits the authentication route `/auth`, and then displays ID token obtained from Azure AD.

```javascript
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
var clientSecret = 'aX88v~q_TgI~324LaQ4C~477-_VWm7vus3'
var authorityHostUrl = 'https://login.microsoftonline.com';
var tenant = 'msaltestingjs.onmicrosoft.com';
var authorityUrl = authorityHostUrl + '/' + tenant;
var redirectUri = 'http://localhost:3000/getAToken';
var resource = 'https://graph.microsoft.com';

var templateAuthzUrl = 'https://login.microsoftonline.com/' +
  tenant +
  '/oauth2/authorize?response_type=code&client_id=' +
  clientId +
  '&redirect_uri=' +
  redirectUri +
  '&state=<state>&resource=' +
  resource;

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
app.get('/getAToken', function (req, res) {
  if (app.locals.state != req.query.state) {
    res.send('error: state does not match');
  }

  var authenticationContext = new AuthenticationContext(authorityUrl);

  authenticationContext.acquireTokenWithAuthorizationCode(
    req.query.code,
    redirectUri,
    resource,
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
```

An application with the same functionality can be secured by MSAL Node as shown below:

```javascript
const express = require("express");
const msal = require('@azure/msal-node');

const SERVER_PORT = process.env.PORT || 3000;
const REDIRECT_URI = "http://localhost:3000/redirect";

const config = {
    auth: {
        clientId: "Enter_the_Application_Id_Here",
        authority: "Enter_the_Cloud_Instance_Id_HereEnter_the_Tenant_Info_Here",
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

// Create msal application object
const pca = new msal.ConfidentialClientApplication(config);

// Create Express App and Routes
const app = express();

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    // get url to sign user in and consent to scopes needed for application
    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.sendStatus(200);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});


app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`))
```

EXPLANATION

### Initialization

In ADAL Node, you initialize an `AuthenticationContext` object, which then exposes the methods you can use in different authentication grants/flows (e.g. `acquireTokenWithAuthorizationCode` for web apps). When initializing, the only mandatory parameter is **authority URI**:

```javascript
var adal = require('adal-node');

var authenticationContex = new adal.AuthenticationContext("https://login.microsoftonline.com/common");
```

In MSAL Node, you have two alternatives instead: If you are building an a mobile app or a desktop app, you instantiate a `PublicClientApplication` object. The constructor expects a [configuration object](#configuration-options) that contains the `clientId` parameter at the very least. MSAL defaults the authority URI to `https://login.microsoftonline.com/common`.

```javascript
const msal = require('@azure/msal-node');

const pca = new msal.PublicClientApplication({
        auth: {
            clientId = "YOUR_CLIENT_ID"
        }
    });
```

On the other hand, if you are building a web app or a daemon app, you instantiate a `ConfidentialClientApplication` object. With such apps you also need to supply a *client credential*, such as a client secret:

```javascript
const msal = require('@azure/msal-node');

const cca = new msal.ConfidentialClientApplication({
        auth: {
            clientId = "YOUR_CLIENT_ID",
            clientSecret = "YOUR_CLIENT_SECRET"
        }
    });
```

Both `PublicClientApplication` and `ConfidentialClientApplication`, unlike ADAL's `AuthenticationContext`, is bind to a client ID. This means that if you have different client IDs that you like to use in your application, you need to instantiate a new MSAL instance for each.

See for more: [Initialization of MSAL Node](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md)

### Configuration options

When building apps on Microsoft identity platform, your app will contain many parameters related to authentication. In ADAL Node, 

```javascript
var adal = require('adal-node');

var options = {
    authority: ""
    validateAuthority: true,
    cache: ""
}

var authenticationContex = new adal.AuthenticationContext(authority, validateAuthority, cache);
```

- authority
- validateAuthority
- cache

MSAL Node on the other hand uses a configuration object that contains the following fields:

```javascript

const msalConfig = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "https://login.microsoftonline.com/common",
        clientSecret: "YOUR_TENANT_ID",
        knownAuthorities: [],
    },
    cache: {
        // cache related options
    },
    system: {
        // logging related options
    }
}
```

### Logging in MSAL Node

In ADAL Node, you configure logging separately at any place in your code:

```javascript
var adal = require('adal-node');

//PII or OII logging disabled. Default Logger does not capture any PII or OII.
adal.logging.setLoggingOptions({
  log: function (level, message, error) {
    console.log(message);

    if (error) {
      console.log(error);
    }
  },
  level: logging.LOGGING_LEVEL.VERBOSE, // provide the logging level
  loggingWithPII: false  // Determine if you want to log personal identification information. The default value is false.
});
```

On the other hand, in MSAL Node, logging is configured during the initialization of MSAL Node instance:

```javascript
const msal = require('@azure/msal-node');

const msalConfig = {
    auth: {
        // authentication related parameters
    },
    cache: {
        // cache related parameters
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
}

const cca = new msal.ConfidentialClientApplication(msalConfig);
```

### Caching in MSAL Node

```javascript
```

```javascript
```

See for more: [Configuration Options](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md)

### Public API

Most of the public methods in ADAL Node have equivalents in MSAL Node:

| ADAL                              | MSAL                            | Notes                             |
|-----------------------------------|---------------------------------|-----------------------------------|
| acquireToken                      | acquireTokenSilent              |                                   |
| acquireTokenWithAuthorizationCode | acquireByAuthorizationCode      |                                   |
| acquireTokenWithClientCredentials | acquireTokenByClientCredentials |                                   |
| acquireTokenWithRefreshToken      | acquireTokenByRefreshToken      |                                   |
| acquireTokenWithDeviceCode        | acquireTokenByDeviceCode        |                                   |
| acquireTokenWithUsernamePassword  | acquireTokenByUsernamePassword  |                                   |

However, some methods in ADAL Node are deprecated, while MSAL Node offers new methods:

| ADAL                              | MSAL                            | Notes                             |
|-----------------------------------|---------------------------------|-----------------------------------|
| acquireUserCode                   | N/A                             |                                   |
| N/A                               | acquireTokenOnBehalfOf          |                                   |
| acquireTokenWithClientCertificate | N/A                             |                                   |
| N/A                               | getAuthCodeUrl                  |                                   |

### Other notable differences

#### Scopes, not resources

When working with ADAL Node, you were likely using Azure AD v1.0 endpoint. MSAL Node on the other hand is built for v2.0 endpoint. An important difference between v1.0 vs. v2.0 endpoints is about how the resources are accessed. In ADAL Node, you would request an access token for a resource:

```javascript
  authenticationContext.acquireTokenWithAuthorizationCode(
    req.query.code,
    redirectUri,
    resource,
    clientId,
    clientSecret,
    function (err, response) {
      // do something with auth response
  );
```

 v2.0 endpoint employs a scope-centric model to access resources. Thus when you request an access token for a resource, you only acquire it for a particular scope of that resource:

```javascript
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        // do something with auth response
    }).catch((error) => {
        console.log(error);
    });
```

See for more: [Resources and scopes](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md)

#### Promises, not callbacks

In ADAL Node, callbacks are used for any operation after the authentication succeeds and a response is obtained:

```javascript
  var authenticationContext = new AuthenticationContext(authorityUrl);
  
  authenticationContext.acquireTokenWithAuthorizationCode(
    req.query.code,
    redirectUri,
    resource,
    clientId,
    clientSecret,
    function (err, response) {
      // do something with auth response
    }
  );
```

In MSAL Node, promises are used instead:

```javascript
    const cca = new msal.ConfidentialClientApplication(msalConfig);

    cca.acquireTokenByCode(tokenRequest).then((response) => {
        // do something with the auth response
    }).catch((error) => {
        console.log(error);
    });
```

You can also use the **async/await** syntax in ES6:

```javascript
    try {
        const authResponse = await cca.acquireTokenByCode(tokenRequest);
    } catch (error) {
        console.log(error);
    }
```

#### Accounts, not users

```javascript
```

```javascript

```

See for more: [Accounts in MSAL Node](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/accounts.md)

## More Information

[Scopes, permissions, and consent in the Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent)
[Migrate applications to the Microsoft Authentication Library (MSAL)](https://docs.microsoft.com/azure/active-directory/develop/msal-migration)
[Why update to Microsoft identity platform (v2.0)?](https://docs.microsoft.com/azure/active-directory/azuread-dev/azure-ad-endpoint-comparison)
[Code samples]()
