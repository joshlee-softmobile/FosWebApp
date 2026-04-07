import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightConfig extends LitElement {
  static properties = {
    viewType: { type: String },
    startHourOffset: { type: Number },
    endHourOffset: { type: Number },
    isDark: { type: Boolean },
    compact: { type: Boolean },
    collapsed: { type: Boolean },
    flightCount: { type: Number }
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

  _timeToOffset(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

    let offset = (target.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (offset < -12) {
      offset += 24;
    } else if (offset > 12) {
      offset -= 24;
    }

    return Math.round(offset * 100) / 100;
  }

  _emitRangeChange(type, value) {
    let start = this.startHourOffset;
    let end = this.endHourOffset;
    if (type === 'start') start = this._timeToOffset(value);
    if (type === 'end') end = this._timeToOffset(value);
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

    return html`
      <div class="config-row">
        ${!isMobile ? html`
          <flight-config-tool
            .isDeparture="${isDeparture}"
            .startHourOffset="${this.startHourOffset}"
            .endHourOffset="${this.endHourOffset}"
            .isDark="${this.isDark}"
            .flightCount="${this.flightCount}"
            @view-changed="${(e) => this._emitViewChange(e, e.detail)}"
            @range-changed="${(e) => this._emitRangeChange(e.detail.type, e.detail.value)}"
            @theme-toggle="${() => this._emitThemeToggle()}">
          </flight-config-tool>
        ` : html`
          <flight-config-menu
            .isDeparture="${isDeparture}"
            .startHourOffset="${this.startHourOffset}"
            .endHourOffset="${this.endHourOffset}"
            .isDark="${this.isDark}"
            .flightCount="${this.flightCount}"
            @view-changed="${(e) => { e.stopPropagation(); this._emitViewChange(e, e.detail); }}"
            @range-changed="${(e) => { e.stopPropagation(); this._emitRangeChange(e.detail); }}"
            @theme-toggle="${(e) => { e.stopPropagation(); this._emitThemeToggle(); }}">
          </flight-config-menu>
        `}
      </div>
    `;
  }
}

customElements.define('flight-config', FlightConfig);