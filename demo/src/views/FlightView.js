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

  // Minimum aesthetic row height — used as the baseline for row count math.
  // FlightTableRow will match this as its min-height.
  static MIN_ROW_HEIGHT = 64;

  constructor() {
    super();
    this.vm = new FlightViewModel(this);
    this.isDark = true;
    this.ticker = 0;
    this.currentPage = 1;
    this.minRowsPerPage = 3;
    this.maxRowsPerPage = 20;
    this._tableBodyHeight = 0; // height available for rows (wrapper minus thead)
    this.isCompact = window.innerWidth <= 400;
    this._resizeObserver = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._applyTheme();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
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
    const minRH = FlightView.MIN_ROW_HEIGHT;
    const bodyHeight = this._tableBodyHeight || 0;
    if (bodyHeight <= 0) {
      // Fallback before first measurement: use 65% of viewport
      return Math.max(this.minRowsPerPage, Math.floor((window.innerHeight * 0.65) / minRH));
    }
    // Use floor — but the adjusted row height will stretch rows to fill the gap,
    // so we never under-count (rows * adjustedRH == bodyHeight exactly).
    const possible = Math.max(this.minRowsPerPage, Math.floor(bodyHeight / minRH));
    return Math.min(this.maxRowsPerPage, possible);
  }

  /**
   * Compute the exact row height that perfectly fills the table body area.
   * We use a precise (non-floored) value so CSS distributes the space without
   * leaving a clipped gap at the bottom.
   */
  _getAdjustedRowHeight() {
    const rows = this._getRowsPerPage();
    if (rows <= 0 || this._tableBodyHeight <= 0) return FlightView.MIN_ROW_HEIGHT;
    // Floor the per-row height and subtract a 1px safety buffer before dividing.
    // This ensures rows * height always fits inside the body with no overflow,
    // preventing the last row from being clipped by FlightPagination.
    const safeBodyHeight = this._tableBodyHeight - 1;
    return Math.max(FlightView.MIN_ROW_HEIGHT, Math.floor(safeBodyHeight / rows));
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (!this.shadowRoot) return;
    this._setupResizeObserver();
  }

  _setupResizeObserver() {
    if (this._resizeObserver) return; // already set up
    const wrapper = this.shadowRoot?.querySelector('.flight-table-wrapper');
    if (!wrapper) return;

    this._resizeObserver = new ResizeObserver(() => {
      this._measureTableSizes();
    });
    this._resizeObserver.observe(wrapper);
    this._measureTableSizes();
  }

  _measureTableSizes() {
    const wrapper = this.shadowRoot?.querySelector('.flight-table-wrapper');
    if (!wrapper) return;
    const wrapperHeight = wrapper.getBoundingClientRect().height;

    // Try to find the thead inside the flight-table shadow root
    const flightTable = wrapper.querySelector('flight-table');
    let theadHeight = 0;
    if (flightTable?.shadowRoot) {
      const thead = flightTable.shadowRoot.querySelector('thead');
      if (thead) theadHeight = thead.getBoundingClientRect().height;
    }

    const newBodyHeight = Math.max(0, wrapperHeight - theadHeight);
    if (Math.abs(newBodyHeight - this._tableBodyHeight) > 1) {
      this._tableBodyHeight = newBodyHeight;
      this.requestUpdate();
    }
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
      --fids-separator: rgba(255, 255, 255, 0.09);
      /* Lock host to the full viewport — no page scroll */
      display: block;
      position: fixed;
      inset: 0;
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
      --fids-separator: rgba(0, 0, 0, 0.1);
    }

    :not(:defined) {
      visibility: hidden;
    }

    /* Full-height flex column — children stack vertically */
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      padding: 0.25rem 0.5rem;
    }

    header {
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--fids-accent);
      background: var(--fids-surface);
      padding: 0.75rem 0.5rem;
      margin: 0;
      z-index: 30;
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
      /* flex: 0 1 auto lets the wrapper shrink if h1 needs more room */
      flex: 0 1 auto;
      min-width: 0;
      display: flex;
      align-items: center;
      overflow: hidden;
      margin-left: 0.5rem;
    }

    .refresh-indicator {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.82rem;
      color: var(--fids-dim);
      animation: pulse 2s infinite;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    flight-config {
      flex: 0 0 auto;
    }

    flight-alert {
      flex: 0 0 auto;
    }

    /* The table wrapper fills ALL remaining vertical space */
    .flight-table-wrapper {
      flex: 1 1 0;
      min-height: 0;
      /* Vertical overflow stays locked; horizontal is handled by flight-table internally */
      overflow: hidden;
      background-color: var(--fids-surface);
      border-radius: 4px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-top: 0.25rem;
      margin-bottom: 0.25rem;
      display: flex;
      flex-direction: column;
    }

    flight-table {
      flex: 1 1 0;
      min-height: 0;
      /* Do NOT set overflow:hidden here — it would clip flight-table's
         internal horizontal scroll area in its shadow DOM. */
      display: block;
    }

    flight-pagination {
      flex: 0 0 auto;
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

    const countdown = this.vm.nextRefreshIn >= 0 ? `${String(this.vm.nextRefreshIn).padStart(2, '0')}s` : '';
    const lastUpdated = this.vm.lastUpdated ? this.vm.lastUpdated.toLocaleTimeString('zh-TW', { hour12: false }) : 'NEVER';

    const rowsPerPage = this._getRowsPerPage();
    const pageCount = this._getPageCount();
    if (this.currentPage > pageCount) {
      this.currentPage = 1;
    }
    const offset = (this.currentPage - 1) * rowsPerPage;
    const pageFlights = /** @type {any[]} */ (this.vm.filteredFlights.slice(offset, offset + rowsPerPage));
    const compact = window.innerWidth <= 640;
    const adjustedRowHeight = this._getAdjustedRowHeight();

    return html`
      <div class="app-container">
        <header>
          <h1>TPE FIDS</h1>
          <div class="refresh-indicator-wrapper">
            <div class="refresh-indicator">${
              this.vm.isLoading   ? (compact ? '⋯' : 'UPDATING…') :
              this.vm.isRefreshing ? (compact ? '↻' : 'AUTO-REFRESHING…') :
              compact             ? `${lastUpdated}｜${countdown}`
                                  : `UPDATED: ${lastUpdated} IN ${countdown}`
            }</div>
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
            .rowHeight=${adjustedRowHeight}
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
