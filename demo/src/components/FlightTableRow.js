import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm';
import { styleMap } from 'https://cdn.jsdelivr.net/npm/lit@3.1.2/directives/style-map.js/+esm';

export class FlightTableRow extends LitElement {
  static properties = {
    flight: { type: Object },
    isDeparture: { type: Boolean },
    isRefreshing: { type: Boolean },
    rowHeight: { type: Number }
  };

  static MIN_ROW_HEIGHT = 64;

  // Since we are using Light DOM (returning 'this'), static styles won't work.
  // We use inline styles or expect global CSS for status classes.
  createRenderRoot() { return this; }

  /** * Helpers to keep render() clean 
   */
  _getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    const map = {
      'status-ontime': ['到', 'arrived', '準時', 'on time'],
      'status-delayed': ['誤', 'delayed', '改時間'],
      'status-cancelled': ['消', 'cancelled']
    };
    for (const [className, keywords] of Object.entries(map)) {
      if (keywords.some(k => s.includes(k))) return className;
    }
    return 'status-estimated';
  }

  _getDayOffset(scheduledDate) {
    if (!scheduledDate) return 0;
    
    // 1. Create a date object for the flight (handling YYYY/MM/DD or YYYY-MM-DD)
    // We use replace to ensure compatibility, then set time to midnight local
    const flightDate = new Date(scheduledDate.replace(/\//g, '-'));
    flightDate.setHours(0, 0, 0, 0);

    // 2. Create a date object for "today" at midnight local
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Calculate the difference in milliseconds
    const diff = flightDate.getTime() - today.getTime();
    
    // 4. Return as a signed integer
    return Math.round(diff / 86400000);
  }

  render() {
    const f = this.flight || {};
    const rh = Math.max(FlightTableRow.MIN_ROW_HEIGHT, this.rowHeight || FlightTableRow.MIN_ROW_HEIGHT);
    
    // Shared Styles
    const rowStyles = styleMap({ height: `${rh}px`, maxHeight: `${rh}px`, overflow: 'hidden' });
    const cellStyles = styleMap({ height: `${rh}px`, maxHeight: `${rh}px` });
    
    // Common class for the "Ellipsis Trio" to reduce string size
    const truncate = "overflow-hidden whitespace-nowrap text-ellipsis";

    const dayOffset = this._getDayOffset(f.scheduledDate);
    const dayBadgeColor = dayOffset !== 0 ? 'var(--fids-warning, #f59e0b)' : 'var(--fids-dim)';

    return html`
      <style>
        .fids-cell { padding: 0 0.75rem; vertical-align: middle; }
        .truncate { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .time-cell { font-variant-numeric: tabular-nums; letter-spacing: 0.5px; }
      </style>

      <tr class="${this.isRefreshing ? 'refreshing-row' : ''}" style=${rowStyles}>

        <td class="fids-cell" style=${cellStyles}>
          <div class="truncate" style="font-weight:700; font-size:0.95rem; letter-spacing:0.5px;">
            ${f.fullFlightNumber || '--'}
          </div>
          <div class="truncate" style="font-size:0.68rem; color:var(--fids-dim); margin-top:2px;">
            ${f.airlineNameZH || ''}
          </div>
        </td>

        <td class="fids-cell" style=${cellStyles}>
          <div class="truncate" style="font-weight:700; font-size:0.95rem;">
            ${this.isDeparture ? (f.destinationIATA || '--') : (f.originIATA || '--')}
          </div>
          <div class="truncate" style="font-size:0.78rem; color:var(--fids-dim); margin-top:1px;">
            ${this.isDeparture ? f.destinationEN : f.originEN}
          </div>
          <div class="truncate" style="font-size:0.68rem; color:var(--fids-dim);">
            ${this.isDeparture ? f.destinationZH : f.originZH}
          </div>
        </td>

        <td class="fids-cell time-cell" style=${cellStyles}>
          <div class="truncate" style="font-weight:700; font-size:0.95rem;">
            ${f.scheduledTime?.substring(0, 5) || '--'}
            ${dayOffset !== 0 ? html`
              <sup style="font-size:0.6rem; font-weight:800; color:${dayBadgeColor};">
                ${dayOffset > 0 ? '+' : ''}${dayOffset}
              </sup>` : ''}
          </div>
          ${f.estimatedTime && f.estimatedTime !== f.scheduledTime ? html`
            <div class="truncate" style="font-size:0.68rem; color:#e34234; margin-top:1px;">
              EST ${f.estimatedTime.substring(0, 5)}
            </div>` : ''}
        </td>

        <td class="fids-cell" style=${cellStyles}>
          <div class="truncate" style="font-weight:600; font-size:0.9rem;">${f.gate || '--'}</div>
        </td>

        <td class="fids-cell" style=${cellStyles}>
          <div class="truncate" style="font-size:0.88rem;">
            ${this.isDeparture ? (f.checkInCounter || '--') : (f.baggageCarousel || '--')}
          </div>
        </td>

        <td class="fids-cell" style=${cellStyles}>
          <div style="display:flex; align-items:center; height:100%; overflow:hidden;">
            <span class="status-badge truncate ${this._getStatusClass(f.flightStatus)}">
              ${f.flightStatus || '--'}
            </span>
          </div>
        </td>

      </tr>
    `;
  }
}

customElements.define('flight-table-row', FlightTableRow);