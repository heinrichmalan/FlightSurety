const STATUS_CODES = [0, 10, 20, 30, 40, 50];

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
