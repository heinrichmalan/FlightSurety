var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");
const { web } = require("webpack");
const truffleAssert = require("truffle-assertions");

contract("Flight Surety Tests", async (accounts) => {
    var config;
    before("setup contract", async () => {
        config = await Test.Config(accounts);
        // await config.flightSuretyData.authorizeCaller(
        //     config.flightSuretyApp.address
        // );
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {
        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");
    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, {
                from: config.testAddresses[2],
            });
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(
            accessDenied,
            true,
            "Access not restricted to Contract Owner"
        );
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(
            accessDenied,
            false,
            "Access not restricted to Contract Owner"
        );
    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try {
            await config.flightSurety.setTestingMode(true);
        } catch (e) {
            reverted = true;
        }
        assert.equal(
            reverted,
            true,
            "Access not blocked for requireIsOperational"
        );

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);
    });

    it("(airline) first airline is registered when contract is deployed", async () => {
        let { firstAirline } = config;
        let result = await config.flightSuretyData.isAirline.call(firstAirline);
        assert.equal(result, true, "First airline should be registered");
    });

    it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, {
                from: config.firstAirline,
            });
        } catch (e) {
            // console.error(e);
        }
        let result = await config.flightSuretyData.isAirline.call(newAirline);

        // ASSERT
        assert.equal(
            result,
            false,
            "Airline should not be able to register another airline if it hasn't provided funding"
        );
    });

    it("(airline) can register an Airline using registerAirline() if it is funded", async () => {
        // ARRANGE
        let newAirline = accounts[2];
        await config.flightSuretyApp.fundAirline({
            value: web3.utils.toWei("11", "ether"),
            from: config.firstAirline,
        });

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, {
                from: config.firstAirline,
            });
        } catch (e) {
            console.log(e);
        }
        let result = await config.flightSuretyData.isAirline.call(newAirline);

        // ASSERT
        assert.equal(
            result,
            true,
            "Airline should be able to register another airline if it has provided funding"
        );
    });

    it("(anyone) can view registered airlines", async () => {
        let registeredAirlines = [accounts[1], accounts[2]];

        let result = await config.flightSuretyApp.getRegisteredAirlines.call();

        expect(result).to.eql(registeredAirlines);
    });

    it("(airline) cannot register an airline if not a registered airline", async () => {
        let impostor = accounts[3];

        try {
            await config.flightSuretyApp.registerAirline(newAirline, {
                from: impostor,
            });
            asset.fail(
                "Should not be able to register an airline as an unregistered airline"
            );
        } catch (err) {}
    });

    it("(airline) cannot fund an airline if not a registered airline", async () => {
        let impostor = accounts[3];

        try {
            await config.flightSuretyApp.fundAirline({
                from: impostor,
            });
            asset.fail(
                "Should not be able to register an airline as an unregistered airline"
            );
        } catch (err) {}
    });

    it("(airline) a registered airline can register an airline without multiparty concensus up to 4 airlines", async () => {
        let currentRegisterer = accounts[2];
        await config.flightSuretyApp.fundAirline({
            value: web3.utils.toWei("11", "ether"),
            from: currentRegisterer,
        });
        let newAirline = accounts[3];

        let res;
        let events;
        try {
            res = await config.flightSuretyApp.registerAirline(newAirline, {
                from: currentRegisterer,
            });
            events = await config.flightSuretyData.getPastEvents(
                "AirlineRegistered"
            );
            let foundEvt = false;
            for (let evt of events) {
                const { votes, airline } = evt.returnValues;
                if (votes == 1 && airline === newAirline) {
                    foundEvt = true;
                    break;
                }
            }
            if (!foundEvt) assert.fail("Could not find registration event.");
        } catch (e) {
            console.log(e);
            assert.fail("Airline should be able to register another.");
        }

        currentRegisterer = accounts[3];
        await config.flightSuretyApp.fundAirline({
            value: web3.utils.toWei("11", "ether"),
            from: currentRegisterer,
        });
        newAirline = accounts[4];

        try {
            res = await config.flightSuretyApp.registerAirline(newAirline, {
                from: currentRegisterer,
            });
            events = await config.flightSuretyData.getPastEvents(
                "AirlineRegistered"
            );
            let foundEvt = false;
            for (let evt of events) {
                const { votes, airline } = evt.returnValues;
                if (votes == 1 && airline === newAirline) {
                    foundEvt = true;
                    break;
                }
            }
            if (!foundEvt) assert.fail("Could not find registration event.");
        } catch (e) {
            console.log(e);
            assert.fail("Airline should be able to register another.");
        }

        currentRegisterer = accounts[4];
        await config.flightSuretyApp.fundAirline({
            value: web3.utils.toWei("11", "ether"),
            from: currentRegisterer,
        });
        newAirline = accounts[5];
        try {
            await config.flightSuretyApp.registerAirline(newAirline, {
                from: currentRegisterer,
            });
            events = await config.flightSuretyData.getPastEvents(
                "AirlineVoteOpened"
            );
            for (let evt of events) {
                const { candidateAirline } = evt.returnValues;
                if (candidateAirline === newAirline) {
                    foundEvt = true;
                    break;
                }
            }
            if (!foundEvt) assert.fail("Could not find vote open event");
        } catch (e) {
            console.log(e);
            assert.fail(e);
        }
    });

    it("(airline) an airline is registered if it gets more than half of all eligible votes", async () => {
        let newAirline = accounts[5];

        //Two voters of the current 4 should have the airline be registered
        // One has already voted when they tried to register in the test above
        let voter = accounts[1];
        await config.flightSuretyApp.voteOnNewAirline(newAirline, true, {
            from: voter,
        });
        let events = await config.flightSuretyData.getPastEvents(
            "AirlineRegistered"
        );
        let foundEvt = false;
        for (let evt of events) {
            const { votes, airline, success } = evt.returnValues;
            if (airline === newAirline && votes == 2 && success) {
                foundEvt = true;
                break;
            }
            if (!foundEvt) assert.fail("Could not find vote open event");
        }
    });

    it("(airline) an airline does not succeed in being registered if more than half the votes are disapprovals", async () => {
        await config.flightSuretyData.fund({
            value: web3.utils.toWei("11", "ether"),
            from: accounts[5],
        });
        let newAirline = accounts[6];
        let registerer = accounts[1];
        let foundEvt = false;
        await config.flightSuretyApp.registerAirline(newAirline, {
            from: registerer,
        });
        let events = await config.flightSuretyData.getPastEvents(
            "AirlineVoteOpened"
        );
        for (let evt of events) {
            const { candidateAirline } = evt.returnValues;
            if (candidateAirline === newAirline) {
                foundEvt = true;
                break;
            }
        }
        if (!foundEvt) assert.fail("Could not find vote open event");
        //Two voters of the current 4 should have the airline be registered
        // One has already voted when they tried to register in the test above

        for (let i = 2; i <= 4; i++) {
            // Three disapprovals of 5 should make the vote fail
            let voter = accounts[i];
            await config.flightSuretyApp.voteOnNewAirline(newAirline, false, {
                from: voter,
            });
        }
        events = await config.flightSuretyData.getPastEvents(
            "AirlineRegistered"
        );
        foundEvt = false;
        for (let evt of events) {
            const { votes, airline, success } = evt.returnValues;
            if (airline === newAirline && votes == 1 && success === false) {
                foundEvt = true;
                break;
            }
        }
        if (!foundEvt) assert.fail("Could not find airline registration event");
    });

    it("(passenger) can purchase a flight policy", async () => {
        let passenger = accounts[8];
        let flightCode = "QF745";
        let airline = accounts[1];
        let price = web3.utils.toWei(String(1));

        let res = await config.flightSuretyApp.purchasePolicy(
            airline,
            flightCode,
            {
                from: passenger,
                value: web3.utils.toWei(String(1.2)),
            }
        );
        // assert.equal(res, true);
        events = await config.flightSuretyData.getPastEvents("PolicyPurchased");
        foundEvt = false;
        for (let evt of events) {
            const {
                flightCode: policyFlightCode,
                passenger: policyPassenger,
                value,
            } = evt.returnValues;
            if (
                passenger === policyPassenger &&
                value == price &&
                flightCode === policyFlightCode
            ) {
                foundEvt = true;
                break;
            }
        }
        if (!foundEvt) assert.fail("Could not find policy purchase event");
    });

    it("(passenger) can retrieve purchased policies", async () => {
        let passenger = accounts[8];
        let flightCode = "QF745";
        let airline = accounts[1];
        let price = web3.utils.toWei(String(1));

        let res = await config.flightSuretyApp.getActivePolicies.call({
            from: passenger,
        });
        let activePolicy = res[0];
        assert.equal(activePolicy.flightCode, flightCode);
        assert.equal(activePolicy.airline, airline);
        assert.equal(activePolicy.pricePaid, price);
    });

    it("(passenger) passenger without active policies returns nothing but doesn't fail", async () => {
        let passenger = accounts[9];

        let res = await config.flightSuretyApp.getActivePolicies.call({
            from: passenger,
        });
        assert.equal(res.length, 0);
    });
});
