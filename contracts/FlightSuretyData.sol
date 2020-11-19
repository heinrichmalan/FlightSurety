pragma solidity ^0.4.25;

pragma experimental ABIEncoderV2;
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

library SharedStructs {}

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    mapping(address => bool) private airlineRegistrationStatus;
    mapping(address => uint256) private airlineFunding;
    address[] private airlines;
    uint64 private numAirlines = 0;

    struct Vote {
        bool isOpen;
        uint256 approvals;
        uint256 requiredApprovals;
        address[] voters;
        address[] hasVoted;
    }
    mapping(address => Vote) private votes;
    struct Policy {
        string flightCode;
        address airline;
        uint256 pricePaid;
    }
    mapping(address => Policy[]) private passengerPolicies;

    function getPassengerPolicies(address passenger)
        external
        returns (Policy[])
    {
        return passengerPolicies[passenger];
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() public {
        contractOwner = msg.sender;
        address firstAirline = 0xe96ed4fe1676a8da886e5a966a6ca59a307ccb4b;
        airlineRegistrationStatus[firstAirline] = true;
        airlines.push(firstAirline);
        numAirlines = 1;
    }

    event AirlineFunded(address airline, uint256 amount);
    event AirlineRegistered(address airline, uint256 votes, bool success);

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

    modifier requireRegisteredAirline() {
        require(
            airlineRegistrationStatus[msg.sender],
            "Caller is not a registered airline."
        );
        _;
    }

    modifier requireFundedAirline() {
        require(
            airlineFunding[msg.sender] >= 10,
            "Airline must have funded 10 Ether or more to participate."
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */

    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller(address addr) external requireContractOwner {
        contractOwner = addr;
    }

    function isRegisteredAirline(address addr) external returns (bool) {
        return airlineRegistrationStatus[addr];
    }

    event FundingStatus(uint256 currentFunding, uint256 requiredFunding);

    function isFundedAirline(address addr) external returns (bool) {
        emit FundingStatus(airlineFunding[addr], 10 ether);
        return airlineFunding[addr] >= 10 ether;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function getRegisteredAirlines() public view returns (address[]) {
        return airlines;
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    event AirlineVoteOpened(
        address candidateAirline,
        uint256 requiredApprovals
    );

    function registerAirline(address newAirline, address fromAirline)
        external
        requireIsOperational
    {
        if (numAirlines < 4) {
            airlineRegistrationStatus[newAirline] = true;
            airlines.push(newAirline);
            numAirlines += 1;
            emit AirlineRegistered(newAirline, 1, true);
        } else {
            // struct Vote {
            //     bool isOpen;
            //     bool[] votes;
            //     address[] voters;
            //     address[] hasVoted;
            // }
            Vote memory airlineVote;

            airlineVote.isOpen = true;
            airlineVote.approvals = 1;

            airlineVote.hasVoted = new address[](0x00);
            airlineVote.voters = new address[](0x00);

            votes[newAirline] = airlineVote;
            votes[newAirline].hasVoted.push(fromAirline);
            for (uint256 i = 0; i < airlines.length; i++) {
                address airlineAddr = airlines[i];
                if (airlineFunding[airlineAddr] >= 10 ether) {
                    votes[newAirline].voters.push(airlineAddr);
                }
            }

            uint256 threshold = votes[newAirline].voters.length / uint256(2);
            if (votes[newAirline].voters.length % uint256(2) != 0) {
                threshold += 1;
            }

            votes[newAirline].requiredApprovals = threshold;
            emit AirlineVoteOpened(
                newAirline,
                votes[newAirline].requiredApprovals
            );
        }
    }

    /**
     */
    function isAirline(address airline) external view returns (bool) {
        return airlineRegistrationStatus[airline];
    }

    function isFunded(address airline) external view returns (bool) {
        return airlineFunding[airline] >= 10 ether;
    }

    event AirlineRegistrationVote(
        address fromAirline,
        address candidateAirline,
        bool vote
    );
    event Info(address[] voters);

    function voteOnNewAirline(
        address newAirline,
        address fromAirline,
        bool vote
    ) external requireIsOperational {
        Vote airlineVote = votes[newAirline];

        require(airlineVote.isOpen, "Vote must still be open.");

        bool isVoter = false;

        for (uint256 i = 0; i < airlineVote.voters.length; i++) {
            if (airlineVote.voters[i] == fromAirline) {
                isVoter = true;
                break;
            }
        }
        require(isVoter, "Airline casting vote must be a valid voter");

        bool alreadyVoted = false;

        for (uint256 j = 0; j < airlineVote.hasVoted.length; j++) {
            if (airlineVote.hasVoted[j] == fromAirline) {
                alreadyVoted = true;
                break;
            }
        }

        require(!alreadyVoted, "Airline can not already have voted");
        votes[newAirline].hasVoted.push(fromAirline);

        if (vote) {
            votes[newAirline].approvals += 1;
        }

        if (
            votes[newAirline].approvals >= votes[newAirline].requiredApprovals
        ) {
            // Passed the required vote threshold
            votes[newAirline].isOpen = false;
            airlineRegistrationStatus[newAirline] = true;
            airlines.push(newAirline);
            numAirlines += 1;
            emit AirlineRegistered(
                newAirline,
                votes[newAirline].approvals,
                true
            );
        } else if (
            // Did not and won't pass the required vote threshold
            votes[newAirline].voters.length -
                votes[newAirline].hasVoted.length <
            votes[newAirline].requiredApprovals - votes[newAirline].approvals
        ) {
            votes[newAirline].isOpen = false;
            emit AirlineRegistered(
                newAirline,
                votes[newAirline].approvals,
                false
            );
        }
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    event PolicyPurchased(address passenger, string flightCode, uint256 value);

    function buy(
        address passenger,
        address airline,
        string flightNumber,
        uint256 value
    ) external {
        Policy memory passengerPolicy;
        passengerPolicy.airline = airline;
        passengerPolicy.flightCode = flightNumber;
        passengerPolicy.pricePaid = value;
        passengerPolicies[passenger].push(passengerPolicy);
        emit PolicyPurchased(passenger, flightNumber, value);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees() external pure {}

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external pure {}

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */

    function fund() public payable {
        airlineFunding[msg.sender] += msg.value;
        emit AirlineFunded(msg.sender, airlineFunding[msg.sender]);
    }

    function getFunding(address airline) public returns (uint256) {
        return airlineFunding[airline];
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        fund();
    }
}
