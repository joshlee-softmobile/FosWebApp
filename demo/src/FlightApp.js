import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { FlightViewModel } from './FlightViewModel.js';

// Explicitly import Shoelace components for Shadow DOM compatibility
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/select/select.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/option/option.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/icon/icon.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/button/button.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/alert/alert.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/input/input.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/tooltip/tooltip.js';

export class FlightApp extends LitElement {
  static properties = {
    vm: { type: Object },
    isDark: { type: Boolean },
    ticker: { type: Number }
  };

  constructor() {
    super();
    this.vm = new FlightViewModel();
    this.isDark = true;
    this.refreshTimer = null;
    this.countdownTimer = null;
    this.pageSwitchTimer = null;
    this.ticker = 0;
    this.currentPage = 1;
    this.minRowsPerPage = 3;
    this.maxRowsPerPage = 20;
    this.rowHeight = 52;
    this.tableWrapperHeight = 0;
    this._cachedReservedHeight = 220;
  }

  connectedCallback() {
    super.connectedCallback();

    this._applyTheme();

    this.vm.fetchData().then(() => {
      this.currentPage = 1;
      this.requestUpdate();
    });

    this.refreshTimer = setInterval(async () => {
      await this.vm.fetchData();
      this.vm.isRefreshing = true;
      this.requestUpdate();
      setTimeout(() => {
        this.vm.isRefreshing = false;
        this.requestUpdate();
      }, 800);
    }, 60000);

    this.countdownTimer = setInterval(() => {
      if (!this.vm.isLoading && this.vm.hasLoaded) {
        this.vm.nextRefreshIn = Math.max(0, this.vm.nextRefreshIn - 1);
      }
      this.requestUpdate();
    }, 1000);

    this.pageSwitchTimer = setInterval(() => {
      this._autoFlipPage();
    }, 12000);

    window.addEventListener('hashchange', this._handleHashChange);
    window.addEventListener('resize', this._handleResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.refreshTimer);
    clearInterval(this.countdownTimer);
    clearInterval(this.pageSwitchTimer);
    window.removeEventListener('hashchange', this._handleHashChange);
    window.removeEventListener('resize', this._handleResize);
  }

  _handleHashChange = () => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('arrival')) {
      this.vm.viewType = 'A';
    } else if (hash.includes('departure')) {
      this.vm.viewType = 'D';
    }
    this.currentPage = 1;
    this.vm.applyFilters();
    this.requestUpdate();
  };

  _handleResize = () => {
    this.requestUpdate();
  };

  _autoFlipPage() {
    const pageCount = this._getPageCount();
    if (pageCount <= 1) return;
    this.currentPage += 1;
    if (this.currentPage > pageCount) this.currentPage = 1;
    this.requestUpdate();
  }

  _getRowsPerPage() {
    if (typeof window === 'undefined') return 10;

    const reserved = this._cachedReservedHeight || 220;
    const rowHeight = this.rowHeight || 48;
    const availableHeight = this.tableWrapperHeight
      ? Math.max(0, this.tableWrapperHeight)
      : Math.max(0, window.innerHeight - reserved);

    const possible = Math.max(this.minRowsPerPage, Math.floor(availableHeight / rowHeight));
    return Math.min(this.maxRowsPerPage, possible);
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (!this.shadowRoot) return;

    const firstRow = this.shadowRoot.querySelector('.flight-table tbody tr:not([style*="text-align:center"])');
    if (firstRow) {
      const height = firstRow.getBoundingClientRect().height;
      if (height && Math.abs(height - this.rowHeight) > 2) {
        this.rowHeight = height;
      }
    }

    const headerEl = this.shadowRoot.querySelector('header');
    const configEl = this.shadowRoot.querySelector('.config-row');
    const pagerEl = this.shadowRoot.querySelector('.pagination-bar');
    const wrapper = this.shadowRoot.querySelector('.flight-table-wrapper');

    this.tableWrapperHeight = wrapper?.getBoundingClientRect().height || this.tableWrapperHeight;

    this._cachedReservedHeight =
      (headerEl?.getBoundingClientRect().height || 0)
      + (configEl?.getBoundingClientRect().height || 0)
      + (pagerEl?.getBoundingClientRect().height || 0)
      + 40;
  }

  _getPageCount() {
    const rowsPerPage = this._getRowsPerPage();
    return Math.max(1, Math.ceil(this.vm.filteredFlights.length / rowsPerPage));
  }

  _setPage(page) {
    const pageCount = this._getPageCount();
    this.currentPage = Math.min(Math.max(1, page), pageCount);
    this.requestUpdate();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    this._applyTheme();
  }

  _applyTheme() {
    document.body.classList.toggle('light-theme', !this.isDark);
    this.classList.toggle('light-theme', !this.isDark);

    if (this.isDark) {
      document.body.classList.add('sl-theme-dark');
      document.body.classList.remove('sl-theme-light');
    } else {
      document.body.classList.remove('sl-theme-dark');
      document.body.classList.add('sl-theme-light');
    }
  }

  formatTimeRange() {
    const now = new Date();
    const start = new Date(now.getTime() + this.vm.startHourOffset * 60 * 60 * 1000);
    const end = new Date(now.getTime() + this.vm.endHourOffset * 60 * 60 * 1000);
    const fmt = (d) => d.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });
    return `${fmt(start)} - ${fmt(end)}`;
  }

  handleRangeChange() {
    const start = this.shadowRoot.getElementById('start-hour').value;
    const end = this.shadowRoot.getElementById('end-hour').value;
    this.vm.setRange(start, end);
    this.requestUpdate();
  }

  static styles = css`
    :host {
      --fids-bg: #0b0e14;
      --fids-surface: #1a1f26;
      --fids-surface-2: #242b35;
      --fids-text: #ffffff;
      --fids-accent: #ffcc00;
      --fids-dim: #94a3b8;
      --fids-success: #10b981;
      --fids-warning: #f59e0b;
      --fids-danger: #ef4444;
      display: block;
      height: 100vh;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
      color: var(--fids-text);
      background: var(--fids-bg);
    }

    :host(.light-theme) {
      --fids-bg: #f8fafc;
      --fids-surface: #ffffff;
      --fids-surface-2: #e2e8f0;
      --fids-text: #0f172a;
      --fids-dim: #64748b;
      --fids-accent: #eab308;
    }

    :not(:defined) {
      visibility: hidden;
    }

    .app-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0.25rem 0.5rem 0.25rem;
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--fids-accent);
      background: var(--fids-surface);
      padding: 0.75rem 0.5rem;
      margin: 0;
    }

    .config-row {
      position: sticky;
      top: 60px;
      z-index: 25;
    }

    .pagination-bar {
      position: sticky;
      bottom: 0;
      z-index: 25;
    }

    h1 {
      margin: 0;
      font-size: 1.8rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--fids-accent);
    }

    .refresh-indicator {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.85rem;
      color: var(--fids-dim);
      animation: pulse 2s infinite;
      white-space: nowrap;
      margin-left: 0.75rem;
    }

    .config-row {
      position: sticky;
      top: 60px;
      z-index: 15;
      display: flex;
      gap: 0.75rem;
      align-items: center;
      background: var(--fids-surface);
      border-bottom: 1px solid rgba(0,0,0,0.1);
      padding: 0.5rem;
      flex-wrap: wrap;
      backdrop-filter: blur(6px);
    }

    .nav-links {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      background: rgba(255,255,255,0.08);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      min-width: 170px;
    }

    .nav-links a {
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    sl-select {
      min-width: 130px;
      max-width: 150px;
    }

    .flight-table-wrapper {
      background-color: var(--fids-surface);
      border-radius: 4px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      flex-grow: 1;
      min-height: 0;
      overflow: auto;
      padding-top: 0.5rem;
      margin-top: 0.25rem;
      margin-bottom: 0.25rem;
    }

    .pagination-bar {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem;
      border-top: 1px solid rgba(0,0,0,0.08);
      color: var(--fids-dim);
      font-size: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
      background: var(--fids-surface-2);
    }

    .pagination-bar button {
      border: none;
      background: transparent;
      color: inherit;
      padding: 0.25rem 0.45rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 700;
    }

    .pagination-bar button.active,
    .pagination-bar button:hover {
      background: rgba(255,255,255,0.15);
      color: var(--fids-accent);
    }

    .pagination-bar span {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-weight: 700;
    }

    .pagination-bar input[type="range"] {
      flex-grow: 1;
      margin: 0 0.5rem;
      max-width: 240px;
      background: linear-gradient(90deg, var(--fids-accent), var(--fids-accent));
      cursor: pointer;
    }

    .pagination-bar button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .flight-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }

    .flight-table th {
      position: sticky;
      top: 0;
      background-color: var(--fids-surface-2);
      color: var(--fids-dim);
      text-align: left;
      padding: 0.75rem;
      text-transform: uppercase;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      z-index: 10;
    }

    .flight-table td {
      padding: 0.85rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.9rem;
      color: var(--fids-text);
    }

    .refreshing-row {
      animation: row-flash 0.5s ease-in-out;
    }

    @keyframes row-flash {
      0% { background-color: rgba(59, 130, 246, 0.15); }
      100% { background-color: transparent; }
    }

    :host(.light-theme) .flight-table td {
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      color: var(--fids-text);
    }

    .flight-number {
      font-family: 'Roboto Mono', monospace;
      font-weight: 700;
      color: var(--fids-accent);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .time {
      font-family: 'Roboto Mono', monospace;
      font-weight: 500;
    }

    .time-actual {
      display: block;
      font-size: 0.75rem;
      color: var(--fids-dim);
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .status-ontime { background: rgba(16, 185, 129, 0.2); color: var(--fids-success); }
    .status-delayed { background: rgba(245, 158, 11, 0.2); color: var(--fids-warning); }
    .status-cancelled { background: rgba(239, 68, 68, 0.2); color: var(--fids-danger); }
    .status-estimated { background: rgba(148, 163, 184, 0.2); color: var(--fids-dim); }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.6; }
      100% { opacity: 1; }
    }

    sl-select::part(base) {
      background-color: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.2);
      color: currentColor;
    }

    :host(.light-theme) sl-select::part(base) {
      background-color: rgba(15, 23, 42, 0.06);
      border-color: rgba(99, 102, 241, 0.2);
      color: currentColor;
    }
  `;

  render() {
    const isDeparture = this.vm.viewType === 'D';

    const options = [];
    for (let i = -48; i <= 48; i++) {
      options.push(html`<sl-option value="${i}">${i > 0 ? '+' : ''}${i}h</sl-option>`);
    }

    const countdown = this.vm.nextRefreshIn >= 0 ? ` | refresh in ${String(this.vm.nextRefreshIn).padStart(2, '0')}s` : '';
    const lastUpdated = this.vm.lastUpdated ? this.vm.lastUpdated.toLocaleTimeString('zh-TW', { hour12: false }) : 'NEVER';

    const rowsPerPage = this._getRowsPerPage();
    const pageCount = this._getPageCount();
    if (this.currentPage > pageCount) {
      this.currentPage = 1;
    }
    const offset = (this.currentPage - 1) * rowsPerPage;
    const pageFlights = this.vm.filteredFlights.slice(offset, offset + rowsPerPage);

    let tableBody;
    if (this.vm.isLoading && !this.vm.hasLoaded) {
      tableBody = html`<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--fids-dim);">Loading flight data…</td></tr>`;
    } else if (this.vm.error && !this.vm.hasLoaded) {
      tableBody = html`<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--fids-dim);">Unable to load flight data. ${this.vm.error}</td></tr>`;
    } else if (this.vm.filteredFlights.length === 0) {
      tableBody = html`<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--fids-dim);">No flights found in this range.</td></tr>`;
    } else {
      tableBody = pageFlights.map(f => html`
        <tr class="${this.vm.isRefreshing ? 'refreshing-row' : ''}">
          <td>
            <span class="time">${f.scheduledTime.substring(0,5)}</span>
            ${f.estimatedTime && f.estimatedTime !== f.scheduledTime ? html`<span class="time-actual">EST ${f.estimatedTime.substring(0,5)}</span>` : ''}
          </td>
          <td>
            <div class="flight-number">${f.fullFlightNumber}</div>
            <span style="font-size:0.7rem;color:var(--fids-dim);">${f.airlineNameZH}</span>
          </td>
          <td>
            <div style="font-weight:700;">${f.destinationZH}</div>
            <div style="font-size:0.8rem;color:var(--fids-dim);">${f.destinationEN} (${f.destinationIATA})</div>
          </td>
          <td class="time">${f.gate || '--'}</td>
          <td>
            <span class="status-badge ${this.getStatusClass(f.flightStatus)}">${f.flightStatus}</span>
          </td>
          <td style="font-size:0.8rem;">
            ${!isDeparture && f.baggageCarousel ? html`<div>Baggage: ${f.baggageCarousel}</div>` : ''}
            ${isDeparture && f.checkInCounter ? html`<div>Counter: ${f.checkInCounter}</div>` : ''}
          </td>
        </tr>
      `);
    }

    return html`
      <div class="app-container">
        <header>
          <h1>TPE FIDS</h1>
          <div class="refresh-indicator">
            ${this.vm.isLoading ? 'UPDATING…' : this.vm.isRefreshing ? 'AUTO-REFRESHING…' : `LAST UPDATED: ${lastUpdated}${countdown}`}
          </div>
        </header>

        <div class="config-row">
          <nav class="nav-links">
            <a href="#/departure" @click="${() => { this.vm.setViewType('D'); this.requestUpdate(); }}" style="color:${isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">DEPARTURE</a>
            <div style="width:1px;height:12px;background:var(--fids-dim);opacity:0.3;"></div>
            <a href="#/arrival" @click="${() => { this.vm.setViewType('A'); this.requestUpdate(); }}" style="color:${!isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">ARRIVAL</a>
          </nav>

          <sl-select id="start-hour" size="small" pill value="${this.vm.startHourOffset}" @sl-change="${this.handleRangeChange}" style="min-width:130px; max-width:150px;">
            <sl-icon name="clock" slot="prefix"></sl-icon>
            ${options}
          </sl-select>

          <sl-icon name="arrow-right" style="color:var(--fids-dim);font-size:0.8rem;"></sl-icon>

          <sl-select id="end-hour" size="small" pill value="${this.vm.endHourOffset}" @sl-change="${this.handleRangeChange}" style="min-width:130px; max-width:150px;">
            <sl-icon name="clock-fill" slot="prefix"></sl-icon>
            ${options}
          </sl-select>

          <div style="font-family:'Roboto Mono',monospace;font-size:0.95rem;color:var(--fids-accent);font-weight:700;margin-left:0.5rem;white-space:nowrap;">
            ${this.formatTimeRange()}
          </div>

          <div style="flex-grow:1;"></div>

          <sl-button @click="${this.toggleTheme}" size="small" circle>
            <sl-icon name="${this.isDark ? 'sun' : 'moon'}"></sl-icon>
          </sl-button>

          <div style="text-align:right;color:var(--fids-dim);font-size:0.75rem;font-weight:700;">
            ${this.vm.filteredFlights.length} FLIGHTS
          </div>
        </div>

        ${this.vm.error && !this.vm.hasLoaded ? html`<sl-alert variant="danger" open closable @sl-after-hide="${() => { this.vm.error = null; this.requestUpdate(); }}" style="margin-bottom:1rem;">
            <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
            ${this.vm.error}
          </sl-alert>` : ''}

        <div class="flight-table-wrapper">
          <table class="flight-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Flight</th>
                <th>${isDeparture ? 'To' : 'From'}</th>
                <th>Gate</th>
                <th>Status</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              ${tableBody}
            </tbody>
          </table>
        </div>

        <div class="pagination-bar" role="navigation" aria-label="flight page navigation">
          <button @click="${() => this._setPage(1)}" ?disabled="${this.currentPage <= 1}">⏮</button>
          <button @click="${() => this._setPage(this.currentPage - 1)}" ?disabled="${this.currentPage <= 1}">◀</button>

          <span>Page ${this.currentPage} / ${pageCount}</span>

          <input
            type="range"
            min="1"
            max="${pageCount}"
            value="${this.currentPage}"
            @input="${(e) => this._setPage(Number(e.target.value))}"
            aria-label="Select flight page"
          />

          <button @click="${() => this._setPage(this.currentPage + 1)}" ?disabled="${this.currentPage >= pageCount}">▶</button>
          <button @click="${() => this._setPage(pageCount)}" ?disabled="${this.currentPage >= pageCount}">⏭</button>
        </div>
      </div>
    `;
  }

  getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('到') || s.includes('arrived') || s.includes('準時') || s.includes('on time')) return 'status-ontime';
    if (s.includes('誤') || s.includes('delayed') || s.includes('改時間')) return 'status-delayed';
    if (s.includes('消') || s.includes('cancelled')) return 'status-cancelled';
    return 'status-estimated';
  }
}

customElements.define('flight-app', FlightApp);
