var yargs = require('yargs');

var getTokenWithAdal = require('./auth-adal');
// var getTokenWithMsal = require('./auth-msal');

var options = yargs
    .usage('Usage: --tenant <tenant_id> --op <operation_name>')
    .option('tenant', { alias: 't', describe: 'tenant id', type: 'string', demandOption: true })
    .option('operation', { alias: 'o', describe: 'operation name', type: 'string', demandOption: true })
    .argv;

function main() {
    console.log(`You have selected: ${options.operation}`);

    switch (options.operation) {
        case 'getToken':

            getTokenWithAdal(options.tenant, function (err, tokenResponse) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(tokenResponse);
                }
            });

            // getTokenWithMsal(options.tenant).then((response) => {
            //     console.log(response);
            // }).catch((error) => {
            //     console.log(error)
            // });

            break;
        default:
            console.log('Select a valid operation first');
            break;
    }
};

main();