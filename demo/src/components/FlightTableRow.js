import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightTableRow extends LitElement {
  static properties = {
    flight: { type: Object },
    isDeparture: { type: Boolean },
    isRefreshing: { type: Boolean }
  };

  createRenderRoot() {
    return this;
  }

  static styles = css`
    :host { display: contents; }
    .status-badge { display: inline-block; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
    .refreshing-row { animation: row-flash 0.5s ease-in-out; }
    @keyframes row-flash { 0% { background: rgba(59,130,246,0.15); } 100% { background: transparent; } }
  `;

  getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('到') || s.includes('arrived') || s.includes('準時') || s.includes('on time')) return 'status-ontime';
    if (s.includes('誤') || s.includes('delayed') || s.includes('改時間')) return 'status-delayed';
    if (s.includes('消') || s.includes('cancelled')) return 'status-cancelled';
    return 'status-estimated';
  }

  render() {
    const f = this.flight || {};
    const timeText = f.scheduledTime?.substring(0,5) || '--';
    const estText = f.estimatedTime && f.estimatedTime !== f.scheduledTime
      ? html`<div style="font-size:0.7rem;color:var(--fids-dim);">EST ${f.estimatedTime.substring(0,5)}</div>`
      : '';

    return html`
      <tr class="${this.isRefreshing ? 'refreshing-row' : ''}">
        <td><div style="font-weight:700;">${f.fullFlightNumber || '--'}</div><div style="font-size:0.7rem;color:var(--fids-dim);">${f.airlineNameZH || '--'}</div></td>
        <td>${this.isDeparture ? (f.destinationZH || '--') : (f.originZH || '--')}</td>
        <td>
          ${f.viaIATA ? html`<div style="font-weight:700">${f.viaIATA}</div>` : ''}
          ${f.viaEN ? html`<div style="font-size:0.7rem;color:var(--fids-dim);">${f.viaEN}</div>` : ''}
          ${f.viaZH ? html`<div style="font-size:0.7rem;color:var(--fids-dim);">${f.viaZH}</div>` : ''}
        </td>
        <td>${timeText}${estText}</td>
        <td>${f.gate || '--'}</td>
        <td>${this.isDeparture ? (f.checkInCounter || '--') : (f.baggageCarousel || '--')}</td>
        <td>
          <span class="status-badge ${this.getStatusClass(f.flightStatus)}">${f.flightStatus || '--'}</span>
          ${f.statusEN ? html`<div style="font-size:0.7rem;color:var(--fids-dim);">${f.statusEN}</div>` : ''}
          ${f.statusZH ? html`<div style="font-size:0.7rem;color:var(--fids-dim);">${f.statusZH}</div>` : ''}
        </td>
      </tr>
    `;
  }
}

customElements.define('flight-table-row', FlightTableRow);
