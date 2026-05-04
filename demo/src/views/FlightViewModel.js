import { FlightInfo } from '../models/FlightInfo.js';

export class FlightViewModel {
  constructor(host) {
    this.host = host;
    if (host && typeof host.addController === 'function') {
      host.addController(this);
    }

    this.flights = [];
    this.filteredFlights = [];
    this.lastUpdated = null;
    this.isLoading = false;
    this.isRefreshing = false;
    this.error = null;
    this.hasLoaded = false;
    this.nextRefreshIn = 60;
    this.isAutoFlipEnabled = true;

    this.timerRefresh = null;
    this.timerCountdown = null;
    this.timerPage = null;

    const hash = window.location.hash.toLowerCase();
    const routeType = hash.includes('arrival') ? 'A' : hash.includes('departure') ? 'D' : 'D';

    const params = new URLSearchParams(window.location.search);
    this.viewType = routeType;

    this.startHourOffset = parseInt(params.get('from') || this.defaultFrom);
    this.endHourOffset = parseInt(params.get('to') || this.defaultTo);
  }

  get defaultFrom() {
    return this.viewType === 'D' ? '0' : '-2';
  }

  get defaultTo() {
    return this.viewType === 'D' ? '6' : '4';
  }

  hostConnected() {
    this._syncRoute();
    this.fetchData();
    this.lastHiddenTime = 0;

    this.timerRefresh = setInterval(async () => {
      await this.fetchData();
      this.isRefreshing = true;
      this.host?.requestUpdate();
      setTimeout(() => { 
        this.isRefreshing = false; 
        this.host?.requestUpdate(); 
      }, 800);
    }, 60000);

    this.timerCountdown = setInterval(() => {
      if (!this.isLoading && this.hasLoaded) {
        this.nextRefreshIn = Math.max(0, this.nextRefreshIn - 1);
        this.host?.requestUpdate();
      }
    }, 1000);

    this.timerPage = setInterval(() => {
      if (this.isAutoFlipEnabled) {
        this.host?._autoFlipPage?.();
      }
    }, 9999);

    window.addEventListener('hashchange', this._handleHashChange);
    window.addEventListener('resize', this._handleResize);
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
  }

  hostDisconnected() {
    clearInterval(this.timerRefresh);
    clearInterval(this.timerCountdown);
    clearInterval(this.timerPage);
    window.removeEventListener('hashchange', this._handleHashChange);
    window.removeEventListener('resize', this._handleResize);
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
  }

  _handleHashChange = () => this._syncRoute();
  _handleResize = () => this.host?.requestUpdate();

  _handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // Record the exact time the app goes into the background
      this.lastHiddenTime = Date.now();
    } else if (document.visibilityState === 'visible') {
      // When coming back, check how long it was hidden
      // Only refresh if it was hidden for more than 1 hour (3600000 ms)
      if (this.lastHiddenTime > 0 && Date.now() - this.lastHiddenTime >= 3600000) {
        this.fetchData();
        this.nextRefreshIn = 60;
      }
    }
  };

  _syncRoute() {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('arrival')) {
      this.viewType = 'A';
    } else if (hash.includes('departure')) {
      this.viewType = 'D';
    }
    this.applyFilters();
    this.host?.requestUpdate();
  }

  async fetchData() {
    if (this.hasLoaded) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }
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
      if (!this.hasLoaded) {
        this.flights = [];
        this.filteredFlights = [];
      }
    }

    this.isLoading = false;
    this.isRefreshing = false;
    this.hasLoaded = true;
    this.applyFilters();
    this.host?.requestUpdate();
  }

  parseCSV(text) {
    const lines = text.split(/\r?\n/);
    this.flights = lines
      .filter(line => line.trim() !== '' && line.includes(','))
      .map(line => new FlightInfo(line.split(',')))
      .filter(f => f && f.flightNumber && f.scheduledDateTime && !isNaN(f.scheduledDateTime.getTime()));
  }

  applyFilters() {
    const now = new Date();
    const startTime = new Date(now.getTime() + this.startHourOffset * 60 * 60 * 1000);
    const endTime = new Date(now.getTime() + this.endHourOffset * 60 * 60 * 1000);
    const viewType = (this.viewType || 'D').toUpperCase();

    this.filteredFlights = this.flights
      .filter(f => (f.type || '').toUpperCase() === viewType)
      .filter(f => {
        const fTime = f.scheduledDateTime;
        if (!fTime || isNaN(fTime.getTime())) return false;
        return fTime >= startTime && fTime <= endTime;
      })
      .sort((a, b) => a.scheduledDateTime - b.scheduledDateTime);

    // fallback: if we have any flights in the source and none after filtering, keep all same viewType flights to avoid always showing 'No flights found' due parse drift.
    if (this.flights.length > 0 && this.filteredFlights.length === 0) {
      this.filteredFlights = this.flights
        .filter(f => (f.type || '').toUpperCase() === viewType)
        .sort((a, b) => a.scheduledDateTime - b.scheduledDateTime);
    }
  }

  setRange(start, end) {
    const s = parseInt(start, 10);
    let e = parseInt(end, 10);

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
    this.host?.requestUpdate();
  }

  setViewType(type) {
    this.viewType = type;

    this.startHourOffset = this.defaultFrom;
    this.endHourOffset = this.defaultTo;

    const url = new URL(window.location);
    url.searchParams.set('from', this.startHourOffset >= 0 ? `+${this.startHourOffset}` : this.startHourOffset);
    url.searchParams.set('to', this.endHourOffset >= 0 ? `+${this.endHourOffset}` : this.endHourOffset);

    const hash = type === 'A' ? '#/arrival' : '#/departure';
    window.history.replaceState({}, '', `${url.pathname}${url.search}${hash}`);
    window.dispatchEvent(new Event('hashchange'));

    this.applyFilters();
    this.host?.requestUpdate();
  }

  toggleAutoFlip() {
    this.isAutoFlipEnabled = !this.isAutoFlipEnabled;
    this.host?.requestUpdate();
  }
}
