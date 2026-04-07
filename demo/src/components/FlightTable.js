import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightTable extends LitElement {

  static properties = {
    flights: { type: Array },
    isDeparture: { type: Boolean },
    isRefreshing: { type: Boolean },
    rowHeight: { type: Number }
  };

  // Column widths in px (absolute, for reliable mobile horizontal scroll)
  // Status gets the most space so its content is never truncated unnecessarily.
  static COL_WIDTHS = {
    flight:  130,  // flight no. + airline
    dest:    175,  // IATA + EN + ZH city name
    time:     90,  // HH:MM + EST tag
    gate:     70,  // gate code
    counter: 110,  // check-in counter / baggage carousel
    status:  260,  // status badge — most generous column
  };

  static get TABLE_MIN_WIDTH() {
    const w = FlightTable.COL_WIDTHS;
    return w.flight + w.dest + w.time + w.gate + w.counter + w.status; // 835px
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    /*
     * Horizontal scroll IS allowed here (mobile users can swipe left/right).
     * Vertical scroll is NOT allowed — row count is calculated to fill the height exactly.
     */
    .table-scroll-area {
      flex: 1 1 0;
      min-height: 0;
      overflow-x: auto;
      overflow-y: hidden;
      width: 100%;
      -webkit-overflow-scrolling: touch; /* smooth momentum scroll on iOS */
      overscroll-behavior-x: contain;
    }

    table {
      border-collapse: collapse;
      table-layout: fixed;
      /* min-width set inline from COL_WIDTHS sum so it can reference the JS value */
    }

    thead {
      position: sticky;
      top: 0;
      background: var(--fids-surface-2);
      color: var(--fids-dim);
      z-index: 5;
      text-align: left;
    }

    th {
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    td {
      padding: 0 0.75rem;
      border-bottom: 1px solid var(--fids-separator);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    flight-table-row { display: contents; }

    /* Status badge styles — shared with FlightTableRow light DOM */
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.55rem;
      border-radius: 5px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.3px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .status-ontime    { color: var(--fids-success, #10b981); background: rgba(16,185,129,0.15); }
    .status-delayed   { color: var(--fids-warning, #f59e0b); background: rgba(245,158,11,0.15); }
    .status-cancelled { color: var(--fids-danger, #ef4444);  background: rgba(239,68,68,0.15); text-decoration: line-through; }
    .status-estimated { color: var(--fids-text, #ffffff);    background: rgba(255,255,255,0.1); }

    .refreshing-row { animation: row-flash 0.5s ease-in-out; }
    @keyframes row-flash { 0% { background: rgba(59,130,246,0.15); } 100% { background: transparent; } }

    /* Subtle scrollbar so users know horizontal scroll is available */
    .table-scroll-area::-webkit-scrollbar {
      height: 4px;
    }
    .table-scroll-area::-webkit-scrollbar-track {
      background: transparent;
    }
    .table-scroll-area::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.18);
      border-radius: 2px;
    }
  `;

  constructor() {
    super();
    this.flights = [];
    this.isDeparture = true;
    this.isRefreshing = false;
    this.rowHeight = 64;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('hashchange', this._handleHashChange);
    window.addEventListener('popstate', this._handleHashChange);
    this._handleHashChange();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this._handleHashChange);
    window.removeEventListener('popstate', this._handleHashChange);
  }

  _handleHashChange = () => {
    this.isDeparture = !window.location.hash.toLowerCase().includes('arrival');
  };

  getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('到') || s.includes('arrived') || s.includes('準時') || s.includes('on time')) return 'status-ontime';
    if (s.includes('誤') || s.includes('delayed') || s.includes('改時間')) return 'status-delayed';
    if (s.includes('消') || s.includes('cancelled')) return 'status-cancelled';
    return 'status-estimated';
  }

  render() {
    const rh = this.rowHeight || 64;
    const cw = FlightTable.COL_WIDTHS;
    const minW = FlightTable.TABLE_MIN_WIDTH;

    return html`
      <div class="table-scroll-area">
        <table style="width:max(100%, ${minW}px);min-width:${minW}px;">
          <colgroup>
            <col style="width:${cw.flight}px">
            <col style="width:${cw.dest}px">
            <col style="width:${cw.time}px">
            <col style="width:${cw.gate}px">
            <col style="width:${cw.counter}px">
            <col style="width:${cw.status}px">
          </colgroup>
          <thead>
            <tr>
              <th>Flight</th>
              <th>${this.isDeparture ? 'To' : 'From'}</th>
              <th>Time</th>
              <th>Gate</th>
              <th>${this.isDeparture ? 'Counter' : 'Baggage'}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.flights.length === 0
              ? html`<tr><td colspan="6" style="text-align:center;color:var(--fids-dim);padding:2rem;">No flights found</td></tr>`
              : this.flights.map(f => html`
                  <flight-table-row
                    .flight=${f}
                    .isDeparture=${this.isDeparture}
                    .isRefreshing=${this.isRefreshing}
                    .rowHeight=${rh}
                  ></flight-table-row>
                `)
            }
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define('flight-table', FlightTable);
