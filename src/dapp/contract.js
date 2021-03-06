import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";

// if (window.ethereum) {
//     window.web3 = new Web3(window.ethereum);
//     // Use injected web3
//     window.ethereum.enable();
//     this.web3 = window.web3;
//     console.log("Existing web3");
//     // this.web3 = new Web3(web3.currentProvider);
// } else {
//     /* Fallback to local node or remote node
//      by default local HTTP-RPC server exposes port 8545.
//      you can use Infura Node Urls also
//      'https://ropsten.infura.io/<API KEy>'*/

//     this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
// }

export default class Contract {
    constructor(network, callback) {
        let config = Config[network];
        window.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new window.web3.eth.Contract(
            FlightSuretyApp.abi,
            config.appAddress
        );
        this.owner = null;
        this.airlines = [];
        this.passengers = [];

        this.initialize(callback);
    }

    initialize(callback) {
        window.web3.eth.getAccounts((error, accts) => {
            if (error) return;
            this.owner = accts[0];

            let counter = 1;

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }
            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            console.log("inited. passenger: ", this.passengers);
            callback();
        });
    }

    getPassengers(callback) {
        window.web3.eth.getAccounts((error, accts) => {
            callback(accts.slice(1, 6));
        });
    }

    getAirlines(callback) {
        window.web3.eth.getAccounts((error, accts) => {
            callback(accts.slice(6, 11));
        });
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner }, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000),
        };
        self.flightSuretyApp.methods
            .fetchFlightStatus(
                payload.airline,
                payload.flight,
                payload.timestamp
            )
            .send({ from: self.owner }, (error, result) => {
                callback(error, payload);
            });
    }

    purchasePolicy(passenger, flightCode, value, callback) {
        let airline = this.airlines[0];
        this.flightSuretyApp.methods.purchasePolicy(airline, flightCode).send(
            {
                from: passenger,
                gas: 500000,
                value: web3.utils.toWei(String(value)),
            },
            callback
        );
    }

    getPassengerPolicies(passenger, callback) {
        this.flightSuretyApp.methods
            .getActivePolicies()
            .call({ from: passenger }, callback);
    }

    getFlightsStatus(flightCodes, callback) {
        this.flightSuretyApp.methods
            .getFlightStatuses(flightCodes)
            .call({ from: self.owner }, callback);
    }

    getInsuranceCredit(passenger, callback) {
        this.flightSuretyApp.methods
            .getInsuranceCredits()
            .call({ from: passenger }, callback);
    }

    withdrawCredit(passenger, callback) {
        this.flightSuretyApp.methods
            .withdrawCredits()
            .send({ from: passenger }, callback);
    }

    setOperatingStatus(status, callback) {
        this.flightSuretyApp.methods
            .setOperatingStatus(status)
            .send({ from: this.owner }, callback);
    }

    registerAirline(address, fromAddress, callback) {
        this.flightSuretyApp.methods.registerAirline(address).send(
            {
                from: fromAddress,
                // gas: 1000000
            },
            callback
        );
    }

    getRegisteredAirlines(callback) {
        this.flightSuretyApp.methods.getRegisteredAirlines().call(
            {
                from: this.owner,
                //  gas: 1000000
            },
            callback
        );
    }

    isFundedAirline(airline, callback) {
        this.flightSuretyApp.methods
            .isFundedAirline()
            .call({ from: airline }, callback);
    }

    fundAirline(airline, callback) {
        this.flightSuretyApp.methods.fundAirline().send(
            {
                from: airline,
                // gas: 1000000,
                value: window.web3.utils.toWei("10"),
            },
            callback
        );
    }
}
