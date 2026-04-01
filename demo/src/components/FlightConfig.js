import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import './FlightConfigMenu.js';

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

    .nav-links {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      background: rgba(255,255,255,0.08);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      min-width: 100px;
    }

    .nav-links a {
      flex: 1;
      min-width: 0;
      text-align: center;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      cursor: pointer;
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

  _offsetToTime(offset) {
    const now = new Date();
    const target = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const h = String(target.getHours()).padStart(2, '0');
    const m = String(target.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
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
          <div class="hidden-tools">
            <nav class="nav-links">
              <a @click="${(e) => this._emitViewChange(e, 'D')}" style="color:${isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">DEP</a>
              <div style="width:1px;height:12px;background:var(--fids-dim);opacity:0.3;"></div>
              <a @click="${(e) => this._emitViewChange(e, 'A')}" style="color:${!isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">ARR</a>
            </nav>
          
            <sl-input type="time" size="small" pill value="${this._offsetToTime(this.startHourOffset)}" @sl-change="${(e) => this._emitRangeChange('start', e.target.value)}" style="min-width:110px; max-width:130px;">
              <sl-icon name="clock" slot="prefix"></sl-icon>
            </sl-input>

            <sl-icon name="arrow-right" style="color:var(--fids-dim);font-size:0.8rem;"></sl-icon>

            <sl-input type="time" size="small" pill value="${this._offsetToTime(this.endHourOffset)}" @sl-change="${(e) => this._emitRangeChange('end', e.target.value)}" style="min-width:110px; max-width:130px;">
              <sl-icon name="clock-fill" slot="prefix"></sl-icon>
            </sl-input>
                
            <div class="space-filler"></div>
            <div style="text-align:right;color:var(--fids-dim);font-size:0.75rem;font-weight:700;">${this.flightCount} FLIGHTS</div>
            <sl-button @click="${() => this._emitThemeToggle()}" size="small" circle>
              <sl-icon name="${this.isDark ? 'sun' : 'moon'}"></sl-icon>
            </sl-button>
          </div>
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