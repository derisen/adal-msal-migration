window.config = {
    instance: 'https://login.microsoftonline.com/',
    clientId: "4c013f26-e4a7-498a-980a-d897f4312fc3",
    tenant: "cbaf2168-de14-4c72-9d88-f5f05366dbef",
    cacheLocation: "sessionStorage",
    postLogoutRedirectUri: window.location.origin,
    popUp: true,
    callback: function(errorDesc, token, error, tokenType) {
      console.log(errorDesc);
      console.log(error);
      console.log(token);
      console.log(tokenType);
    }
};

var authContext = new AuthenticationContext(config);

var Logging = {
  level: 3,
  log: function (message) {
      console.log(message);
  },
  piiLoggingEnabled: false
};


authContext.log(Logging)

console.log(authContext);

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const tokenButton = document.getElementById("tokenButton");

loginButton.addEventListener('click', () => authContext.login());
logoutButton.addEventListener('click', () => authContext.logOut());
tokenButton.addEventListener('click', () => authContext.acquireTokenPopup("https://graph.microsoft.com", "", "", (error, token) => console.log(error, token)))

// var user = authContext.getCachedUser();
// var username = user.userName;
// var upn = user.profile.upn;