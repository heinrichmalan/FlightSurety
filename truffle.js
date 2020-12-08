var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic =
    "involve hero zero valid donor august cycle layer song liquid year network";
var NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker");
module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*", // Match any network id
        },
    },
    compilers: {
        solc: {
            version: "^0.4.24",
        },
    },
};
