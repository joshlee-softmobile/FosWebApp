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

export class FlightView extends LitElement {
  static properties = {
    vm: { type: Object },
    isDark: { type: Boolean },
    ticker: { type: Number }
  };

  constructor() {
    super();
    this.vm = new FlightViewModel(this);
    this.isDark = true;
    this.ticker = 0;
    this.currentPage = 1;
    this.minRowsPerPage = 3;
    this.maxRowsPerPage = 20;
    this.rowHeight = 52;
    this.tableWrapperHeight = 0;
    this._cachedReservedHeight = 220;
    this.isCompact = window.innerWidth <= 400;
  }

  connectedCallback() {
    super.connectedCallback();
    this._applyTheme();
  }

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
    const wrapper = this.shadowRoot.querySelector('.flight-table-wrapper');

    this.tableWrapperHeight = wrapper?.getBoundingClientRect().height || this.tableWrapperHeight;

    const headerHeight = headerEl?.getBoundingClientRect().height || 0;
    const controlHeight = 96; // flight-config + flight-pagination estimated fixed height

    this._cachedReservedHeight = headerHeight + controlHeight + 40;
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
      min-height: 100vh;
      height: auto;
      overflow: auto;
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
      min-height: 100%;
      box-sizing: border-box;
      overflow: visible;
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

    h1 {
      margin: 0;
      font-size: 1.8rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--fids-accent);
      flex: 1 1 auto;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .refresh-indicator-wrapper {
      display: flex;
      justify-content: flex-end;
      flex: 0 0 auto;
      min-width: 0;
      max-width: 46vw;
      overflow: hidden;
    }

    .refresh-indicator {
      display: inline-block;
      min-width: 0;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.85rem;
      color: var(--fids-dim);
      animation: pulse 2s infinite;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-left: 0.75rem;
      max-height: 2.6rem;
    }

    .flight-table-wrapper {
      background-color: var(--fids-surface);
      border-radius: 4px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      flex-grow: 1;
      min-height: 0;
      overflow: visible;
      padding-top: 0.5rem;
      margin-top: 0.25rem;
      margin-bottom: 0.25rem;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
      overscroll-behavior: auto;
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

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.6; }
      100% { opacity: 1; }
    }
  `;

  render() {
    const isDeparture = this.vm.viewType === 'D';

    const countdown = this.vm.nextRefreshIn >= 0 ? `IN ${String(this.vm.nextRefreshIn).padStart(2, '0')}s` : '';
    const lastUpdated = this.vm.lastUpdated ? this.vm.lastUpdated.toLocaleTimeString('zh-TW', { hour12: false }) : 'NEVER';

    const rowsPerPage = this._getRowsPerPage();
    const pageCount = this._getPageCount();
    if (this.currentPage > pageCount) {
      this.currentPage = 1;
    }
    const offset = (this.currentPage - 1) * rowsPerPage;
    const pageFlights = /** @type {any[]} */ (this.vm.filteredFlights.slice(offset, offset + rowsPerPage));
    const compact = window.innerWidth <= 640;


    return html`
      <div class="app-container">
        <header>
          <h1>TPE FIDS</h1>
          <div class="refresh-indicator-wrapper">
            <div class="refresh-indicator">
              ${this.vm.isLoading ? 'UPDATING…' : this.vm.isRefreshing ? 'AUTO-REFRESHING…' : `LAST UPDATED: ${lastUpdated} ${countdown}`}
            </div>
          </div>
        </header>

        <flight-config
          .viewType=${this.vm.viewType}
          .startHourOffset=${this.vm.startHourOffset}
          .endHourOffset=${this.vm.endHourOffset}
          .isDark=${this.isDark}
          .compact=${compact}
          .flightCount=${this.vm.filteredFlights.length}
          @view-changed=${e => { this.vm.setViewType(e.detail); this.currentPage = 1; }}
          @range-changed=${e => { this.vm.setRange(e.detail.start, e.detail.end); this.currentPage = 1; }}
          @theme-toggle=${() => { this.toggleTheme(); }}
        ></flight-config>

        <flight-alert
          .message=${this.vm.error || ''}
          variant="danger"
          .open=${Boolean(this.vm.error && !this.vm.hasLoaded)}
        ></flight-alert>

        <div class="flight-table-wrapper">
          <flight-table
            .flights=${/** @type {never[]} */ (pageFlights)}
            .isDeparture=${isDeparture}
            .isRefreshing=${this.vm.isRefreshing}
          ></flight-table>
        </div>

        <flight-pagination
          .currentPage=${this.currentPage}
          .pageCount=${pageCount}
          @page-changed=${(e) => this._setPage(Number(e.detail.page))}
        ></flight-pagination>
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

customElements.define('flight-view', FlightView);
