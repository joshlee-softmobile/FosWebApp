import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightTableRow extends LitElement {
  static properties = {
    flight: { type: Object },
    isDeparture: { type: Boolean },
    isRefreshing: { type: Boolean },
    rowHeight: { type: Number }
  };

  // Must match FlightView.MIN_ROW_HEIGHT
  static MIN_ROW_HEIGHT = 64;

  createRenderRoot() {
    return this;
  }

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
    // rowHeight is always a floored integer from FlightView._getAdjustedRowHeight().
    // Clamp to never go below MIN_ROW_HEIGHT for aesthetics.
    const rh = Math.max(FlightTableRow.MIN_ROW_HEIGHT, this.rowHeight || FlightTableRow.MIN_ROW_HEIGHT);
    const rhPx = `${rh}px`;

    const timeText = f.scheduledTime?.substring(0, 5) || '--';
    const estText = f.estimatedTime && f.estimatedTime !== f.scheduledTime
      ? html`<div style="font-size:0.68rem;color:var(--fids-dim);margin-top:1px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">EST ${f.estimatedTime.substring(0, 5)}</div>`
      : '';

    // --- Day offset badge (+1 / -1) ---
    // Compare the flight's scheduled date with today's local calendar date.
    // We strip time so midnight-boundary cases don't cause off-by-one errors.
    let dayOffset = 0;
    if (f.scheduledDate) {
      const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
      const flightStr = f.scheduledDate.replace(/\//g, '-');   // normalise slashes
      const today   = new Date(todayStr);
      const flightD = new Date(flightStr);
      if (!isNaN(flightD)) {
        dayOffset = Math.round((flightD - today) / 86400000);
      }
    }
    // Format: "+1", "-1", "+2", …  Only shown when non-zero.
    const dayBadge = dayOffset !== 0 ? html`
    <sup style="
      font-size:0.6rem;
      font-weight:800;
      line-height:1;
      vertical-align:sub;
      margin-left:2px;
      color:${dayOffset > 0 ? 'var(--fids-warning, #f59e0b)' : 'var(--fids-dim)'};
      letter-spacing:0;
    ">${dayOffset > 0 ? '+' : ''}${dayOffset}</sup>` : '';

    // Row height is enforced via inline style so content can never expand it.
    const rowStyle = `height:${rhPx};max-height:${rhPx};overflow:hidden;box-sizing:border-box;`;
    const cellStyle = `overflow:hidden;white-space:nowrap;text-overflow:ellipsis;vertical-align:middle;height:${rhPx};max-height:${rhPx};padding:0 0.75rem;`;

    return html`
      <tr class="${this.isRefreshing ? 'refreshing-row' : ''}" style="${rowStyle}">

        <!-- Flight number + airline -->
        <td style="${cellStyle}">
          <div style="font-weight:700;font-size:0.95rem;letter-spacing:0.5px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${f.fullFlightNumber || '--'}</div>
          <div style="font-size:0.68rem;color:var(--fids-dim);margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${f.airlineNameZH || ''}</div>
        </td>

        <!-- Destination / origin -->
        <td style="${cellStyle}">
          <div style="font-weight:700;font-size:0.95rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${this.isDeparture ? (f.destinationIATA || '--') : (f.originIATA || '--')}</div>
          <div style="font-size:0.78rem;color:var(--fids-dim);margin-top:1px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${this.isDeparture ? (f.destinationEN || '') : (f.originEN || '')}</div>
          <div style="font-size:0.68rem;color:var(--fids-dim);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${this.isDeparture ? (f.destinationZH || '') : (f.originZH || '')}</div>
        </td>

        <!-- Scheduled + estimated time with optional day-offset badge -->
        <td style="${cellStyle}">
          <div style="font-weight:700;font-size:0.95rem;font-variant-numeric:tabular-nums;letter-spacing:0.5px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
            ${timeText}${dayBadge}
          </div>
          ${estText}
        </td>

        <!-- Gate -->
        <td style="${cellStyle}">
          <div style="font-weight:600;font-size:0.9rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${f.gate || '--'}</div>
        </td>

        <!-- Counter / Baggage -->
        <td style="${cellStyle}">
          <div style="font-size:0.88rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${this.isDeparture ? (f.checkInCounter || '--') : (f.baggageCarousel || '--')}</div>
        </td>

        <!-- Status badge — hard-clipped so it never stretches the row -->
        <td style="${cellStyle}">
          <div style="display:flex;align-items:center;height:100%;overflow:hidden;">
            <span
              class="status-badge ${this.getStatusClass(f.flightStatus)}"
              style="
                display:inline-block;
                padding:0.25rem 0.55rem;
                border-radius:5px;
                font-size:0.72rem;
                font-weight:700;
                letter-spacing:0.3px;
                max-width:100%;
                overflow:hidden;
                white-space:nowrap;
                text-overflow:ellipsis;
                box-sizing:border-box;
              ">
              ${f.flightStatus || '--'}
            </span>
          </div>
        </td>

      </tr>
    `;
  }
}

customElements.define('flight-table-row', FlightTableRow);
