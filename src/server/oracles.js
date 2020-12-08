const STATUS_CODES = [
    0, // Unknown
    10, // On Time
    20, // Late Airline
    30, // Late Weather
    40, // Late Technical
    50, // Late Other
];

export default class Oracle {
    constructor(address) {
        this.address = address;
    }

    getResult(flightCode) {
        let min = 0;
        let max = STATUS_CODES.length - 1;
        const randomIndex = Math.floor(Math.random() * (max - min + 1) + min);
        return STATUS_CODES[randomIndex];
    }
}
