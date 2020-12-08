pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;
// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    FlightSuretyData flightSuretyData;
    address private contractOwner; // Account used to deploy contract
    bool private operational = true;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        // Modify to call data contract's status
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/
    /**
     * @dev Contract constructor
     *
     */
    constructor(address dataContract) public {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return operational; // Modify to call data contract's status
    }

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *
     */

    function registerAirline(address newAirline)
        external
        requireIsOperational
        returns (bool success, uint256 votes)
    {
        require(
            msg.sender == contractOwner ||
                (flightSuretyData.isRegisteredAirline(msg.sender) &&
                    flightSuretyData.isFundedAirline(msg.sender) &&
                    !flightSuretyData.isRegisteredAirline(newAirline)),
            "Caller has to be the contract owner or a registered and funded airline, and airline may not already be registered"
        );
        flightSuretyData.registerAirline(newAirline, msg.sender);
        return (true, 1);
    }

    function getRegisteredAirlines()
        external
        requireIsOperational
        returns (address[])
    {
        return flightSuretyData.getRegisteredAirlines();
        // address[] memory airlines;
        // return airlines;
    }

    function isFundedAirline() public requireIsOperational returns (bool) {
        return flightSuretyData.isFundedAirline(msg.sender);
    }

    function fundAirline() public payable requireIsOperational {
        require(
            flightSuretyData.isRegisteredAirline(msg.sender) &&
                !flightSuretyData.isFundedAirline(msg.sender),
            "Caller must be a registered but unfunded airline"
        );

        flightSuretyData.fund.value(msg.value)();
        flightSuretyData.addAirlineFunding(msg.sender, msg.value);
    }

    function voteOnNewAirline(address newAirline, bool vote)
        external
        requireIsOperational
    {
        require(
            flightSuretyData.isRegisteredAirline(msg.sender) &&
                flightSuretyData.isFundedAirline(msg.sender),
            "Caller has to be a registered and funded airline"
        );
        flightSuretyData.voteOnNewAirline(newAirline, msg.sender, vote);
    }

    function purchasePolicy(address airline, string flightNumber)
        public
        payable
        requireIsOperational
        returns (bool)
    {
        uint256 refund = 0;
        uint256 value = msg.value;
        if (value > 1 ether) {
            refund = msg.value - 1 ether;
            value = 1 ether;
        }
        flightSuretyData.buy(msg.sender, airline, flightNumber, value);
        if (refund > 0) msg.sender.transfer(refund);
        return true;
    }

    function getActivePolicies()
        external
        requireIsOperational
        returns (FlightSuretyData.Policy[])
    {
        return flightSuretyData.getPassengerPolicies(msg.sender);
    }

    function getInsuranceCredits()
        external
        requireIsOperational
        returns (uint256)
    {
        return flightSuretyData.getAccountBalance(msg.sender);
    }

    function withdrawCredits() public requireIsOperational {
        require(
            flightSuretyData.getAccountBalance(msg.sender) > 0,
            "Account balance needs to be greater than 0"
        );
        flightSuretyData.pay(msg.sender);
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */

    function registerFlight() external view requireIsOperational {
        // TODO have a bunch of flights
        // maybe a mapping to a mapping
        // airline -> { flightCode -> struct}
    }

    mapping(string => uint8) private flightStatuses;

    struct FlightStatus {
        string flightCode;
        uint8 status;
    }

    function getFlightStatuses(string[] flightCodes)
        public
        requireIsOperational
        returns (FlightStatus[])
    {
        FlightStatus[] memory flightStatusesView = new FlightStatus[](
            flightCodes.length
        );
        for (uint256 i = 0; i < flightCodes.length; i++) {
            flightStatusesView[i].flightCode = flightCodes[i];
            flightStatusesView[i].status = flightStatuses[flightCodes[i]];
        }
        return flightStatusesView;
    }

    /**
     * @dev Called after oracle has updated flight status
     *
     */

    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal requireIsOperational {
        flightStatuses[flight] = statusCode;
        if (statusCode != uint8(0)) {
            if (statusCode == uint8(20)) {
                flightSuretyData.creditInsurees(flight);
            }
            flightSuretyData.closePolicies(flight);
        }
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string flight,
        uint256 timestamp
    ) external requireIsOperational {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        oracleResponses[key] = ResponseInfo({
            requester: msg.sender,
            isOpen: true
        });

        emit OracleRequest(index, airline, flight, timestamp);
    }

    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable requireIsOperational {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes()
        external
        view
        requireIsOperational
        returns (uint8[3])
    {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp,
        uint8 statusCode
    ) external requireIsOperational {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey(
        address airline,
        string flight,
        uint256 timestamp
    ) internal view requireIsOperational returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        requireIsOperational
        returns (uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account)
        internal
        requireIsOperational
        returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
}
