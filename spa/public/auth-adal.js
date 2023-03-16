// +--------------------------------------------+
// | APPLICATION UI ELEMENTS                    |
// +--------------------------------------------+

// DOM elements to work with
var welcomeMessage = document.getElementById("welcomeMessage");
var loginButton = document.getElementById("loginButton");
var logoutButton = document.getElementById("logoutButton");
var tokenButton = document.getElementById("tokenButton");

// if user is logged in, update the UI
function updateUI(user) {
    if (!user) {
        return;
    }

    welcomeMessage.innerHTML = 'Hello ' + user.profile.upn + '!';
    welcomeMessage.style.visibility = "visible";
    logoutButton.style.visibility = "visible";
    tokenButton.style.visibility = "visible";
    loginButton.style.visibility = "hidden";
};

// +--------------------------------------------+
// | ADAL APPLICATION CONFIGURATION             |
// +--------------------------------------------+

// attach logger configuration to window
window.Logging = {
    piiLoggingEnabled: false,
    level: 3,
    log: function (message) {
        console.log(message);
    }
};

// ADAL configuration
var adalConfig = {
    instance: 'https://login.microsoftonline.com/',
    clientId: "Enter_the_Application_Id_Here",
    tenant: "Enter_the_Tenant_Info_Here",
    redirectUri: "http://localhost:3000/adal",
    cacheLocation: "sessionStorage",
    popUp: false,
    callback: function (errorDesc, token, error, tokenType) { // for login APIs
        if (error) {
            console.log(error, errorDesc);
        } else {
            updateUI(authContext.getCachedUser());
        }
    }
};

// instantiate ADAL client object
var authContext = new AuthenticationContext(adalConfig);

// +--------------------------------------------+
// | APPLICATION AUTH LOGIC                     |
// +--------------------------------------------+

// handle redirect response or check for cached user
if (authContext.isCallback(window.location.hash)) {
    authContext.handleWindowCallback();
} else {
    updateUI(authContext.getCachedUser());
}


function signIn() {
    authContext.login();
}

function signOut() {
    authContext.logOut();
}

function getToken() {
    authContext.acquireToken(
        "https://graph.microsoft.com",
        function (errorDesc, token, error) {
            if (error) {
                console.log(error, errorDesc);

                if (adalConfig.popUp) {
                    authContext.acquireTokenPopup(
                        "https://graph.microsoft.com",
                        null, // extraQueryParameters
                        null, // claims
                        function (errorDesc, token, error) {
                            if (error) {
                                console.log(error, errorDesc);
                            } else {
                                console.log(token);
                            }
                        }
                    );
                } else {
                    authContext.acquireTokenRedirect(
                        "https://graph.microsoft.com",
                        null, // extraQueryParameters
                        null, // claims
                    );
                }
            } else {
                console.log(token);
            }
        }
    );
}