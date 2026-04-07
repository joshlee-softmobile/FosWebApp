import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightConfig extends LitElement {
  static properties = {
    viewType: { type: String },
    startHourOffset: { type: Number },
    endHourOffset: { type: Number },
    isDark: { type: Boolean },
    compact: { type: Boolean },
    collapsed: { type: Boolean },
    flightCount: { type: Number },
    isRefreshing: { type: Boolean }
  };

  static styles = css`
    :host { display: block; }
    .config-row {
      position: sticky;
      top: 60px;
      z-index: 20;
      display: flex;
      gap: 0.75rem;
      align-items: center;
      background: var(--fids-surface);
      border-bottom: 1px solid rgba(0,0,0,0.1);
      padding: 0.5rem;
      flex-wrap: wrap;
      backdrop-filter: blur(6px);
    }
    
    .hidden-tools { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; width: auto; flex-grow: 1; }
    
    flight-config-menu {
      flex-grow: 1;
      width: 100%;
    }

    sl-select {
      min-width: 130px;
      max-width: 150px;
    }

    sl-select::part(base) {
      background-color: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.2);
      color: currentColor;
    }

    :host-context(.light-theme) sl-select::part(base),
    :host(.light-theme) sl-select::part(base) {
      background-color: rgba(15, 23, 42, 0.06);
      border-color: rgba(99, 102, 241, 0.2);
      color: currentColor;
    }

    .space-filler { flex: 1 1 auto; }

    @media (max-width: 640px) {
      sl-select { max-width: none; }
    }
  `;

  constructor() {
    super();
    this.viewType = 'D';
    this.startHourOffset = 0;
    this.endHourOffset = 12;
    this.isDark = true;
    this.compact = false;
    this.flightCount = 0;
  }

  _getOffsetOptions() {
    // Curated list of relative hour offsets (from -12 to +24)
    return [-24, -12, -6, -4, -2, -1, 0, 1, 2, 4, 6, 12, 24];
  }

  _formatOffsetLabel(offset) {
    const now = new Date();
    const target = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const timeStr = target.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    let label = offset === 0 ? 'NOW' : (offset > 0 ? `+${offset}h` : `${offset}h`);
    return `${label} (${timeStr})`;
  }

  _emitRangeChange(type, value) {
    let start = this.startHourOffset;
    let end = this.endHourOffset;
    
    // value is now the offset directly from the dropdown
    const offset = parseFloat(value);
    
    if (type === 'start') start = offset;
    if (type === 'end') end = offset;
    
    this.dispatchEvent(new CustomEvent('range-changed', { detail: { start, end } }));
  }

  _emitViewChange(e, type) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('view-changed', { detail: type }));
  }

  _emitThemeToggle() {
    this.dispatchEvent(new CustomEvent('theme-toggle'));
  }

  render() {
    const isMobile = this.compact;
    const isDeparture = this.viewType === 'D';

    // Pre-calculate full options (value + label) each render to ensure
    // the time strings are fresh (especially during Refresh).
    const options = this._getOffsetOptions().map(off => ({
      value: off,
      label: this._formatOffsetLabel(off)
    }));

    return html`
      <div class="config-row">
        <flight-config-menu
            .isDeparture="${isDeparture}"
            .startHourOffset="${this.startHourOffset}"
            .endHourOffset="${this.endHourOffset}"
            .isDark="${this.isDark}"
            .flightCount="${this.flightCount}"
            .isRefreshing="${this.isRefreshing}"
            .options="${options}"
            @view-changed="${(e) => { e.stopPropagation(); this._emitViewChange(e, e.detail); }}"
            @range-changed="${(e) => { e.stopPropagation(); this._emitRangeChange(e.detail.type, e.detail.value || e.detail.offset); }}"
            @theme-toggle="${(e) => { e.stopPropagation(); this._emitThemeToggle(); }}">
          </flight-config-menu>
      </div>
    `;
  }
}

customElements.define('flight-config', FlightConfig);