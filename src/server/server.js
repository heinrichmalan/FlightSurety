import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";
import Oracle from "./oracles.js";

let config = Config["localhost"];
let web3 = new Web3(
    new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);

let flightSuretyApp = new web3.eth.Contract(
    FlightSuretyApp.abi,
    config.appAddress
);

const addOracleRequestListener = () => {
    flightSuretyApp.events.OracleRequest(
        {
            fromBlock: 0,
        },
        function (error, event) {
            if (error) console.log(error);
            const { index, airline, flight, timestamp } = event.returnValues;
            console.log(
                `Oracle Request Received\nIndex: ${index}\nAirline: ${airline}\nFlight Code: ${flight}\n${timestamp}\n`
            );
            let oracles = oracleIndexMap[Number(index)];
            if (!oracles) {
                console.log("No oracles");
                return;
            }
            for (let oracle of oracles) {
                let statusCode = oracle.getResult(flight);
                flightSuretyApp.methods
                    .submitOracleResponse(
                        index,
                        airline,
                        flight,
                        timestamp,
                        statusCode
                    )
                    .send(
                        { from: oracle.address, gas: 500000 },
                        (error, result) => {
                            // console.log(error, result);
                        }
                    );
            }
        }
    );
};

const oracles = [];
const oracleIndexMap = {};
web3.eth.getAccounts((error, accounts) => {
    web3.eth.defaultAccount = accounts[0];
    for (let i = 0; i < 20; i++) {
        let account = accounts[i];
        oracles.push(new Oracle(account));
        flightSuretyApp.methods.registerOracle().send(
            {
                from: account,
                value: web3.utils.toWei("1"),
                gas: 500000,
            },
            (error, result) => {
                if (error) {
                    console.error(error);
                    return;
                }

                flightSuretyApp.methods
                    .getMyIndexes()
                    .call({ from: account, gas: 500000 }, (error, result) => {
                        if (error) {
                            console.error(error);
                        }
                        for (let index of result) {
                            if (!oracleIndexMap[Number(index)]) {
                                oracleIndexMap[Number(index)] = [oracles[i]];
                            } else {
                                oracleIndexMap[Number(index)].push(oracles[i]);
                            }
                        }
                        if (i == 19) addOracleRequestListener();
                    });
            }
        );
    }
});

const app = express();
app.get("/api", (req, res) => {
    res.send({
        message: "An API for use with your Dapp!",
    });
});

export default app;
