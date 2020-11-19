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
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        window.web3.eth.getAccounts((error, accts) => {
            this.owner = accts[0];

            let counter = 1;

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }
            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            callback();
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
                console.log(result);
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
}
