import { FlightInfo } from './FlightInfo.js';

export class FlightViewModel {
  constructor() {
    this.flights = [];
    this.filteredFlights = [];
    this.lastUpdated = null;
    this.isLoading = false;
    this.error = null;
    this.hasLoaded = false;
    this.nextRefreshIn = 60;

    // Initialize from URL hash route only (no /arrival /departure fallback)
    const hash = window.location.hash.toLowerCase();
    const routeType = hash.includes('arrival') ? 'A' : hash.includes('departure') ? 'D' : 'D';

    const params = new URLSearchParams(window.location.search);

    this.viewType = routeType;

    // Set defaults based on view type
    const defaultFrom = this.viewType === 'D' ? '0' : '-6';
    const defaultTo = this.viewType === 'D' ? '12' : '6';

    this.startHourOffset = parseInt(params.get('from') || defaultFrom);
    this.endHourOffset = parseInt(params.get('to') || defaultTo);
  }

  async fetchData() {
    this.isLoading = true;
    this.error = null;
    this.nextRefreshIn = 60;

    const remoteUrl = 'https://www.taoyuan-airport.com/uploads/flightx/a_flight_v6.txt';
    const proxies = [
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(remoteUrl)}`,
      `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(remoteUrl)}`
    ];

    let success = false;
    for (const proxyUrl of proxies) {
      try {
        console.log(`Attempting fetch via: ${proxyUrl}`);
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('big5');
        const text = decoder.decode(buffer);

        this.parseCSV(text);
        this.lastUpdated = new Date();
        success = true;
        break;
      } catch (err) {
        console.warn(`Proxy failed (${proxyUrl}):`, err.message);
      }
    }

    if (!success) {
      this.error = `Failed to fetch live data from all available proxies. The airport server might be temporarily blocking requests.`;
      this.flights = [];
      this.filteredFlights = [];
    }

    this.isLoading = false;
    this.hasLoaded = true;
    this.applyFilters();
  }

  parseCSV(text) {
    const lines = text.split('\n');
    this.flights = lines
      .filter(line => line.trim() !== '' && line.includes(','))
      .map(line => new FlightInfo(line.split(',')));
  }

  applyFilters() {
    const now = new Date();
    const startTime = new Date(now.getTime() + this.startHourOffset * 60 * 60 * 1000);
    const endTime = new Date(now.getTime() + this.endHourOffset * 60 * 60 * 1000);

    this.filteredFlights = this.flights
      .filter(f => f.type === this.viewType)
      .filter(f => {
        const fTime = f.scheduledDateTime;
        return fTime >= startTime && fTime <= endTime;
      })
      .sort((a, b) => a.scheduledDateTime - b.scheduledDateTime);
  }

  setRange(start, end) {
    const s = parseInt(start);
    let e = parseInt(end);

    // Poka-yoke: Ensure From < To
    if (s >= e) {
      e = s + 1;
    }

    this.startHourOffset = s;
    this.endHourOffset = e;

    const url = new URL(window.location);
    url.searchParams.set('from', s >= 0 ? `+${s}` : s);
    url.searchParams.set('to', e >= 0 ? `+${e}` : e);
    window.history.replaceState({}, '', url);
    this.applyFilters();
  }

  setViewType(type) {
    this.viewType = type;

    // Reset to view-type defaults for better UX when switching tab
    if (type === 'D') {
      this.startHourOffset = 0;
      this.endHourOffset = 12;
    } else {
      this.startHourOffset = -6;
      this.endHourOffset = 6;
    }

    const url = new URL(window.location);
    url.searchParams.set('from', this.startHourOffset >= 0 ? `+${this.startHourOffset}` : this.startHourOffset);
    url.searchParams.set('to', this.endHourOffset >= 0 ? `+${this.endHourOffset}` : this.endHourOffset);

    const hash = type === 'A' ? '#/arrival' : '#/departure';
    window.history.replaceState({}, '', `${url.pathname}${url.search}${hash}`);

    this.applyFilters();
  }
}
