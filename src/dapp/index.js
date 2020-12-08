// import DOM from './dom';
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import Contract from "./contract";
// import './flightsurety.css';

const OracleUpdateEntry = ({ title, description, label, error, value }) => {
    return (
        <section>
            <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ marginRight: "15px" }}>{label}</div>
                <div>{error ? String(error) : String(value)}</div>
            </div>
        </section>
    );
};

const AirlineView = ({ contract }) => {
    const [airlines, setAirlines] = useState([contract.airlines[0]]);
    const [selectedAirline, setSelectedAirline] = useState(
        contract.airlines[0]
    );
    const [funded, setFunded] = useState(false);
    const [changed, setChanged] = useState(true);
    const [airlineAddress, setAirlineAddress] = useState("");
    console.log(contract.airlines);
    const registerAirline = () => {
        contract.registerAirline(
            airlineAddress,
            selectedAirline,
            (error, data) => {
                console.log(error, data);
                setAirlineAddress("");
            }
        );
        setChanged(true);
    };

    const handleChange = (e) => {
        setAirlineAddress(e.target.value);
    };

    const handleSelect = (e) => {
        setSelectedAirline(e.target.value);
        setChanged(true);
    };

    useEffect(() => {
        if (!changed) return;
        if (changed) setChanged(false);
        contract.getRegisteredAirlines((error, data) => {
            console.log(error, data);
            setAirlines(data);
        });

        contract.isFundedAirline(selectedAirline, (error, data) => {
            if (error) return;
            console.log("Airline funded: ", data);
            setFunded(data);
        });
    }, [selectedAirline, changed]);

    const fundAirline = () => {
        contract.fundAirline(selectedAirline, (error, data) => {
            console.log(error, data);
            setChanged(true);
        });
    };

    return (
        <div style={{ marginTop: "100px" }}>
            <label>
                {" "}
                Airline to Act As
                <select
                    value={selectedAirline}
                    style={{ marginLeft: "15px" }}
                    onChange={handleSelect}
                >
                    {airlines.map((item) => {
                        return <option value={item}>{item}</option>;
                    })}
                </select>
            </label>
            <h4>Funding Status</h4>
            <div>
                {funded ? "Fully Funded" : "Requires Funding of 10 Ether"}
                {!funded && <button onClick={fundAirline}>Fund Airline</button>}
            </div>
            {funded && (
                <div
                    className="top-20"
                    style={{
                        marginTop: "100px",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <h3>Airlines</h3>
                    <h4>Register Airline</h4>
                    <label>
                        Address
                        <input
                            style={{ marginLeft: "5px", width: "100%" }}
                            type="text"
                            value={airlineAddress}
                            placeholder="Airline Address"
                            onChange={handleChange}
                        />
                    </label>
                    <button onClick={registerAirline}>Register</button>
                </div>
            )}
        </div>
    );
};

const FlightSelection = ({ contract, flights, setSelectedFlight, setView }) => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "300px",
                margin: "0 auto",
            }}
        >
            {flights.map((item, index) => (
                <FlightSelectRow
                    key={index}
                    flight={item}
                    setSelectedFlight={setSelectedFlight}
                    setView={setView}
                />
            ))}
        </div>
    );
};

const FlightSelectRow = ({ flight, setSelectedFlight, setView }) => {
    const handlePurchase = () => {
        setSelectedFlight(flight);
        setView("purchase");
    };
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                width: "300px",
                marginBottom: "5px",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div>{flight.code}</div>
                <div>{flight.time}</div>
            </div>
            <button
                style={{
                    borderRadius: "5px",
                    padding: "5px 10px",
                    border: "none",
                    backgroundColor: "#343A40",
                    color: "white",
                    cursor: "pointer",
                }}
                onClick={() => handlePurchase()}
            >
                Purchase
            </button>
        </div>
    );
};

const FlightPurchase = ({ contract, passenger, selectedFlight, setView }) => {
    const [purchasePrice, setPurchasePrice] = useState(0.01);

    const handlePriceChange = (e) => {
        setPurchasePrice(e.target.value);
    };

    const handlePurchase = () => {
        contract.purchasePolicy(
            passenger,
            selectedFlight.code,
            purchasePrice,
            (error, result) => {
                if (error) {
                    console.error(error);
                    return;
                }
                setView("selection");
            }
        );
    };

    const cancel = () => {
        setView("selection");
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "300px",
                margin: "0 auto",
            }}
        >
            <h3>Purchase</h3>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "space-between",
                }}
            >
                <h4>{selectedFlight.code}</h4>
                <h5>{selectedFlight.time}</h5>
            </div>
            <label>
                Purchase Price
                <input
                    type="number"
                    max={1.0}
                    min={0.01}
                    value={purchasePrice}
                    style={{ width: "100%" }}
                    step="0.01"
                    onChange={handlePriceChange}
                />
            </label>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "space-between",
                }}
            >
                <button
                    style={{
                        borderRadius: "5px",
                        padding: "5px 10px",
                        border: "none",
                        backgroundColor: "#59b759",
                        color: "white",
                        cursor: "pointer",
                        width: "100px",
                    }}
                    onClick={handlePurchase}
                >
                    Buy
                </button>
                <button
                    style={{
                        borderRadius: "5px",
                        padding: "5px 10px",
                        border: "none",
                        backgroundColor: "#cc5b5b",
                        color: "white",
                        cursor: "pointer",
                        width: "100px",
                    }}
                    onClick={cancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

const getAvailableFlights = (policyData) => {
    const FLIGHTS = [
        {
            code: "QF1",
            time: "12:50pm",
        },
        {
            code: "LH1",
            time: "4:25pm",
        },
        {
            code: "JL1",
            time: "9:30am",
        },
        {
            code: "QR1",
            time: "2:15pm",
        },
        {
            code: "SQ1",
            time: "8:45pm",
        },
        {
            code: "UA1",
            time: "5:30am",
        },
    ];

    const policyFlightCodes = policyData.data.map((item) => item.flightCode);
    return FLIGHTS.filter((item) => policyFlightCodes.indexOf(item.code) == -1);
};

const InsurancePurchaseView = ({ contract, passenger, policyData }) => {
    const availableFlights = policyData.loading
        ? []
        : getAvailableFlights(policyData);
    const [view, setView] = useState("selection");
    const [selectedFlight, setSelectedFlight] = useState(null);

    return view === "selection" ? (
        <FlightSelection
            contract={contract}
            flights={availableFlights}
            setSelectedFlight={setSelectedFlight}
            setView={setView}
        />
    ) : (
        <FlightPurchase {...{ selectedFlight, contract, setView, passenger }} />
    );
};

const PolicyRow = ({ label, value }) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
            }}
        >
            <div>{label}:</div>
            <div>{value}</div>
        </div>
    );
};

const PassengerData = ({ contract, passenger, setPolicyData }) => {
    if (!passenger) return null;
    const [passengerBalance, setPassengerBalance] = useState("Fetching");
    const [insuranceCredits, setInsuranceCredits] = useState("Fetching");
    const [activePolicies, setActivePolicies] = useState([]);
    const [changed, setChanged] = useState(false);

    useEffect(() => {
        if (changed) setChanged(false);
        web3.eth.getBalance(passenger).then((data) => {
            setPassengerBalance(web3.utils.fromWei(String(data)));
        });

        contract.getInsuranceCredit(passenger, (error, result) => {
            if (error) {
                console.error(error);
                return;
            }
            setInsuranceCredits(result);
        });

        contract.getPassengerPolicies(passenger, (error, result) => {
            if (error) {
                console.error(error);
                return;
            }
            // setActivePolicies(result);
            const policies = [];
            for (let policy of result) policies.push({ ...policy });
            const policyCodes = result.map((item) => item.flightCode);
            contract.getFlightsStatus(policyCodes, (error, result) => {
                if (error) return;
                for (let status of result) {
                    for (let policy of policies) {
                        if (policy.flightCode == status.flightCode)
                            policy.status = status.status;
                    }
                }
                setActivePolicies(policies);
            });

            setPolicyData({ loading: false, data: result });
        });
    }, [passenger, changed]);

    const getStatusFromCode = (statusCode) => {
        const statusMap = {
            0: "Unknown",
            10: "On Time",
            20: "Late Airline",
            30: "Late Weather",
            40: "Late Technical",
            50: "Late Other",
        };

        return statusMap[statusCode];
    };

    const handleOracleSubmit = (flight) => {
        contract.fetchFlightStatus(flight, (error, result) => {
            let data = {
                label: "Fetch Flight Status",
                error: error,
                value: result.flight + " " + result.timestamp,
            };
            setChanged(true);
        });
    };

    const withdrawCredits = () => {
        contract.withdrawCredit(passenger, (error, result) => {
            console.log(error, result);
            setChanged(true);
        });
    };

    return (
        <div
            style={{ width: "100%", textAlign: "center", marginBottom: "15px" }}
        >
            <div>Wallet Balance: {passengerBalance} ETH</div>
            <div>
                Insurance Credits:{" "}
                {insuranceCredits != "Fetching" &&
                    web3.utils.fromWei(String(insuranceCredits))}{" "}
                ETH
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
                {insuranceCredits > 0 && (
                    <button onClick={withdrawCredits}>
                        Withdraw Credits to Account
                    </button>
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    marginTop: "15px",
                }}
            >
                <h4>Active Policies</h4>
                {activePolicies.map((item, index) => {
                    return (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                width: "450px",
                                marginBottom: "5px",
                                border: "1px solid grey",
                                borderRadius: "5px",
                                padding: "5px",
                            }}
                            key={index}
                        >
                            <PolicyRow label="Airline" value={item.airline} />
                            <PolicyRow label="Flight" value={item.flightCode} />
                            <PolicyRow
                                label="Flight Status"
                                value={getStatusFromCode(item.status)}
                            />
                            <PolicyRow
                                label="Policy Status"
                                value={item.policyOpen ? "Open" : "Closed"}
                            />
                            <PolicyRow
                                label="Price Paid"
                                value={`${web3.utils.fromWei(
                                    item.pricePaid
                                )} ETH`}
                            />
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-around",
                                }}
                            >
                                {item.policyOpen && (
                                    <button
                                        onClick={() =>
                                            handleOracleSubmit(item.flightCode)
                                        }
                                    >
                                        Update Status
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PassengerView = ({ contract }) => {
    const { passengers } = contract;
    const [selectedPassenger, setSelectedPassenger] = useState(passengers[0]);
    const [policyData, setPolicyData] = useState({
        loading: true,
        activePolicies: [],
    });
    const handleSelect = (e) => {
        setSelectedPassenger(e.target.value);
    };
    return (
        <div style={{ margin: "0 auto", marginTop: "100px", width: "450px" }}>
            <label style={{ textAlign: "center", width: "100%" }}>
                {" "}
                Passenger to Act As
                <select
                    value={selectedPassenger}
                    style={{ marginLeft: "15px" }}
                    onChange={handleSelect}
                >
                    {passengers
                        .filter((item) => {
                            return item != null || item != undefined;
                        })
                        .map((item) => {
                            return <option value={item}>{item}</option>;
                        })}
                </select>
            </label>
            <PassengerData
                passenger={selectedPassenger}
                contract={contract}
                setPolicyData={setPolicyData}
            />
            <InsurancePurchaseView
                contract={contract}
                passenger={selectedPassenger}
                policyData={policyData}
            />
        </div>
    );
};

const OraclesView = ({ contract }) => {
    const [flight, setFlight] = useState("");
    const [oracleUpdates, setOracleUpdates] = useState([]);

    const handleFlightUpdate = (e) => {
        setFlight(e.target.value);
    };

    const handleOracleSubmit = () => {
        contract.fetchFlightStatus(flight, (error, result) => {
            let data = {
                label: "Fetch Flight Status",
                error: error,
                value: result.flight + " " + result.timestamp,
            };
            setOracleUpdates([
                ...oracleUpdates,
                <OracleUpdateEntry {...data} key={result.flight} />,
            ]);
        });
    };
    return (
        <main className="container">
            <div className="row top-20" style={{ marginTop: "100px" }}>
                <label
                    className="form"
                    style={{
                        marginRight: "5px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    Flight
                </label>
                <input
                    type="text"
                    id="flight-number"
                    onChange={handleFlightUpdate}
                    style={{ marginRight: "5px" }}
                />
                <button
                    className="btn btn-primary"
                    id="submit-oracle"
                    onClick={handleOracleSubmit}
                >
                    Submit to Oracles
                </button>
            </div>
            <div
                id="display-wrapper"
                className="top-20"
                style={{ marginTop: "100px" }}
            >
                <section>
                    <h2>{"Oracles"}</h2>
                    <h5>{"Trigger oracles"}</h5>
                    {oracleUpdates}
                </section>
            </div>
        </main>
    );
};

const ContractOwnerView = ({ contract }) => {
    const [airlineAddress, setAirlineAddress] = useState("");
    console.log(contract.airlines[0]);
    const setContractOperatingStatus = (value) => {
        contract.setOperatingStatus(value, (error, data) => {
            console.log(error, data);
            window.location.reload();
        });
    };

    const registerAirline = () => {
        contract.registerAirline(
            airlineAddress,
            contract.owner,
            (error, data) => {
                console.log(error, data);
                setAirlineAddress("");
            }
        );
    };

    const handleChange = (e) => {
        setAirlineAddress(e.target.value);
    };

    return (
        <main className="container">
            <div
                className="top-20"
                style={{
                    marginTop: "100px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <button
                    style={{
                        width: "auto",
                        marginBottom: "5px",
                        backgroundColor: "#fc7b7b",
                        border: "none",
                        color: "white",
                        padding: "5px",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}
                    onClick={() => setContractOperatingStatus(false)}
                >
                    Suspend Contract Operation
                </button>
                <button
                    style={{
                        width: "auto",
                        marginBottom: "5px",
                        backgroundColor: "#3ddb5a",
                        border: "none",
                        color: "white",
                        padding: "5px",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}
                    onClick={() => setContractOperatingStatus(true)}
                >
                    Start/Resume Contract Operation
                </button>
            </div>
            <div
                className="top-20"
                style={{
                    marginTop: "100px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <h3>Airlines</h3>
                <h4>Register Airline</h4>
                <label>
                    Address
                    <input
                        style={{ marginLeft: "5px", width: "100%" }}
                        type="text"
                        value={airlineAddress}
                        placeholder="Airline Address"
                        onChange={handleChange}
                    />
                </label>
                <button onClick={registerAirline}>Register</button>
            </div>
        </main>
    );
};

const Navbar = ({ contract }) => {
    const [operational, setOperational] = useState("Fetching");

    useEffect(() => {
        contract.isOperational((error, result) => {
            if (error || !result) {
                setOperational("Not Operational");
            } else {
                setOperational("Operational");
            }
        });
    }, []);

    return (
        <nav
            className="navbar navbar-expand-md navbar-dark bg-dark fixed-top"
            style={{ display: "flex", justifyContent: "space-between" }}
        >
            <div>
                <Link
                    className="navbar-brand"
                    to="/"
                    style={{ marginRight: "15px" }}
                >
                    FlightSurety
                </Link>
                <Link
                    className="navbar-brand"
                    to="/passengers"
                    style={{ marginRight: "15px", fontSize: "15px" }}
                >
                    Passenger View
                </Link>
                <Link
                    className="navbar-brand"
                    to="/airlines"
                    style={{ marginRight: "15px", fontSize: "15px" }}
                >
                    Airline View
                </Link>
                <Link
                    className="navbar-brand"
                    to="/contract-owner"
                    style={{ marginRight: "15px", fontSize: "15px" }}
                >
                    Contract Owner View
                </Link>
            </div>
            <button
                className="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#navbarsExampleDefault"
                aria-controls="navbarsExampleDefault"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>
            <div style={{ color: "white" }}>Status: {operational}</div>
        </nav>
    );
};

const App = () => {
    const contract = new Contract("localhost", () => {});

    return (
        <Router>
            <Navbar contract={contract} />
            <Switch>
                <Route path="/passengers">
                    <PassengerView contract={contract} />
                </Route>
                <Route path="/airlines">
                    <AirlineView contract={contract} />
                </Route>
                <Route path="/contract-owner">
                    <ContractOwnerView contract={contract} />
                </Route>
                <Route path="/">
                    <PassengerView contract={contract} />
                </Route>
            </Switch>
        </Router>
    );
};

ReactDOM.render(<App />, document.getElementById("app"));
