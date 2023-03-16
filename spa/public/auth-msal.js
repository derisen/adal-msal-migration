// +--------------------------------------------+
// | APPLICATION UI ELEMENTS                    |
// +--------------------------------------------+

// DOM elements to work with
const welcomeMessage = document.getElementById("welcomeMessage");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const tokenButton = document.getElementById("tokenButton");

// if user is logged in, update the UI
const updateUI = (account) => {
    if (!account) {
        return;
    }

    welcomeMessage.innerHTML = `Hello ${account.username}!`;
    welcomeMessage.style.visibility = "visible";
    logoutButton.style.visibility = "visible";
    tokenButton.style.visibility = "visible";
    loginButton.style.visibility = "hidden";
};

// +--------------------------------------------+
// | MSAL APPLICATION CONFIGURATION             |
// +--------------------------------------------+

// use popup or redirect APIs
const usePopup = false;

// MSAL configuration
const msalConfig = {
    auth: {
        clientId: "Enter_the_Application_Id_Here",
        authority: "https://login.microsoftonline.com/Enter_the_Tenant_Info_Here",
        redirectUri: "http://localhost:3000/msal",
    },
    cache: {
        cacheLocation: "sessionStorage"
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

// instantiate MSAL client object
const pca = new msal.PublicClientApplication(msalConfig);

// +--------------------------------------------+
// | APPLICATION AUTH LOGIC                     |
// +--------------------------------------------+

// handle redirect response or check for cached user
pca.handleRedirectPromise().then((response) => {
    if (response) {
        pca.setActiveAccount(response.account);
        updateUI(response.account);
    } else {
        const account = pca.getAllAccounts()[0];
        updateUI(account);
    }
}).catch((error) => {
    console.log(error);
});

function signIn() {
    if (usePopup) {
        pca.loginPopup().then((response) => {
            pca.setActiveAccount(response.account);
            updateUI(response.account);
        })
    } else {
        pca.loginRedirect();
    }
}

function signOut() {
    if (usePopup) {
        pca.logoutPopup().then((response) => {
            window.location.reload();
        });
    } else {
        pca.logoutRedirect();
    }
}

function getToken() {
    const account = pca.getActiveAccount();

    pca.acquireTokenSilent({
        account: account,
        scopes: ["User.Read"]
    }).then((response) => {
        console.log(response);
    }).catch((error) => {
        if (error instanceof msal.InteractionRequiredAuthError) {
            if (usePopup) {
                pca.acquireTokenPopup({
                    scopes: ["User.Read"]
                }).then((response) => {
                    console.log(response);
                });
            } else {
                pca.acquireTokenRedirect({
                    scopes: ["User.Read"]
                });
            }
        }

        console.log(error);
    });
}