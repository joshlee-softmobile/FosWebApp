import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import './FlightTableRow.js';

export class FlightTable extends LitElement {

  static properties = {
    flights: { type: Array },
    isDeparture: { type: Boolean },
    isRefreshing: { type: Boolean }
  };

  static styles = css`
    :host { display: block; }
    .table-wrapper { overflow: auto; max-height: 100%; }
    table { width: 100%; border-collapse: collapse; min-width: 740px; }
    thead { position: sticky; top: 0; background: var(--fids-surface-2); color: var(--fids-dim); z-index: 5; text-align: left; }
    th { padding: 0.75rem; text-align: left; }
    th, td { padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    flight-table-row { display: contents; }
    .status-badge { display: inline-block; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
    .status-ontime { color: var(--fids-success, #10b981); background: rgba(16,185,129,0.15); }
    .status-delayed { color: var(--fids-warning, #f59e0b); background: rgba(245,158,11,0.15); }
    .status-cancelled { color: var(--fids-danger, #ef4444); background: rgba(239,68,68,0.15); text-decoration: line-through; }
    .status-estimated { color: var(--fids-text, #ffffff); background: rgba(255,255,255,0.1); }
    .refreshing-row { animation: row-flash 0.5s ease-in-out; }
    @keyframes row-flash { 0% { background: rgba(59,130,246,0.15); } 100% { background: transparent; } }
  `;

  constructor() {
    super();
    this.flights = [];
    this.isDeparture = true;
    this.isRefreshing = false;
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
    return html`
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Flight</th>
              <th>${this.isDeparture ? 'To' : 'From'}</th>
              <th>Via</th>
              <th>Time</th>
              <th>Gate</th>
              <th>${this.isDeparture ? 'Counter' : 'Baggage'}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.flights.length === 0
        ? html`<tr><td colspan="7" style="text-align:center;color:var(--fids-dim);padding:2rem;">No flights found</td></tr>`
        : this.flights.map(f => html`
                  <flight-table-row
                    .flight=${f}
                    .isDeparture=${this.isDeparture}
                    .isRefreshing=${this.isRefreshing}
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
