export class FlightInfo {
  constructor(data) {
    this.terminal = data[0]?.trim();
    this.type = data[1]?.trim(); // A: Arrival, D: Departure
    this.airlineCode = data[2]?.trim();
    this.airlineNameZH = data[3]?.trim();
    this.flightNumber = data[4]?.trim();
    this.gate = data[5]?.trim();
    this.scheduledDate = data[6]?.trim();
    this.scheduledTime = data[7]?.trim();
    this.estimatedDate = data[8]?.trim();
    this.estimatedTime = data[9]?.trim();
    this.destinationIATA = data[10]?.trim();
    this.originIATA = data[10]?.trim();
    this.destinationEN = data[11]?.trim();
    this.originEN = data[11]?.trim();
    this.destinationZH = data[12]?.trim();
    this.originZH = data[12]?.trim();
    this.flightStatus = data[13]?.trim();
    this.aircraftType = data[14]?.trim();
    this.viaIATA = data[15]?.trim();
    this.viaEN = data[16]?.trim();
    this.viaZH = data[17]?.trim();
    this.baggageCarousel = data[18]?.trim();
    this.checkInCounter = data[19]?.trim();
    this.statusZH = data[20]?.trim();
    this.statusEN = data[21]?.trim();
  }

  get fullFlightNumber() {
    return `${this.airlineCode}${this.flightNumber}`;
  }

  get scheduledDateTime() {
    if (!this.scheduledDate || !this.scheduledTime) return null;
    return new Date(`${this.scheduledDate.replace(/\//g, '-')}T${this.scheduledTime}`);
  }

  get estimatedDateTime() {
    if (!this.estimatedDate || !this.estimatedTime) return null;
    return new Date(`${this.estimatedDate.replace(/\//g, '-')}T${this.estimatedTime}`);
  }
}
