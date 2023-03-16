require('dotenv').config();

const yargs = require('yargs');

const getTokenWithAdal = require('./auth-adal');
// const getTokenWithMsal = require('./auth-msal');

const options = yargs
    .usage('Usage: --tenant <tenant_id> --op <operation_name>')
    .option('tenant', { alias: 't', describe: 'tenant id', type: 'string', demandOption: true })
    .option('op', { alias: 'o', describe: 'operation name', type: 'string', demandOption: true })
    .argv;

async function main() {
    console.log(`You have selected: ${options.op}`);

    switch (yargs.argv['op']) {
        case 'getUsers':

            try {

            } catch (error) {
                return;
            }

            break;
        default:
            console.log('Select a Graph operation first');
            break;
    }
};

main();