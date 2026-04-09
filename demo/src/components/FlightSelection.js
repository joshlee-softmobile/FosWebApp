import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightSelection extends LitElement {
  static properties = {
    viewType: { type: String },
    startHourOffset: { type: Number },
    endHourOffset: { type: Number },
    isDark: { type: Boolean },
    compact: { type: Boolean },
    collapsed: { type: Boolean },
    flightCount: { type: Number },
    isRefreshing: { type: Boolean },
    open: { type: Boolean, state: true }
  };

  static styles = css`
    :host { display: block; position: relative; z-index: 25; }
    .config-row {
      position: sticky;
      top: 60px;
      z-index: 25;
      display: flex;
      gap: 0.75rem;
      align-items: center;
      background: var(--fids-surface);
      border-bottom: 1px solid rgba(0,0,0,0.1);
      padding: 0.5rem;
      flex-wrap: wrap;
      backdrop-filter: blur(6px);
      width: 100%;
      box-sizing: border-box;
    }
    
    .menu-header { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; width: 100%; }
    .space-filler { flex: 1 1 auto; }
    .hamburger { 
      display: flex; 
      background: transparent; 
      border: 1px solid var(--fids-dim); 
      color: var(--fids-text); 
      width: 30px; 
      height: 30px; 
      border-radius: 8px; 
      flex-shrink: 0; 
      justify-content: center; 
      align-items: center; 
      padding: 0; 
      cursor: pointer; 
    }
    .hamburger sl-icon {
      font-size: 1.25rem;
      display: block;
    }
    .theme-toggle::part(base) {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .theme-toggle sl-icon {
      display: block;
    }
    .label { font-weight: 700; font-size: 1.1rem; margin-left: 0.75rem; color: var(--fids-accent); }
    
    .menu-panel { 
      position: absolute;
      top: 100%; 
      left: 0; 
      z-index: 30; 
      margin-top: 0.5rem;
      width: 100%; 
      max-width: 440px; 
      background: color-mix(in srgb, var(--fids-surface), transparent 10%);
      backdrop-filter: blur(16px);
      display: flex; 
      flex-direction: column; 
      align-items: stretch; 
      gap: 0.75rem; 
      padding: 0.75rem; 
      border: 1px solid var(--fids-separator); 
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.4); 
      border-radius: 12px;
      box-sizing: border-box;
    }
    
    .sub-row { 
      display: flex; 
      flex-wrap: nowrap; 
      gap: 0.5rem; 
      align-items: center; 
      width: 100%; 
    }
    .sub-row sl-select { 
      flex: 1 1 50%; 
      min-width: 0; 
    }

    @media (max-width: 520px) {
      .menu-panel { 
        width: calc(100% - 1rem); 
        left: 0.5rem; 
        right: 0.5rem; 
        gap: 0.5rem; 
        padding: 0.5rem; 
      }
    }
    
    .nav-links {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      justify-content: center;
      background: var(--fids-surface-2);
      padding: 0.35rem 0.5rem;
      border-radius: 6px;
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
  `;

  constructor() {
    super();
    this.viewType = 'D';
    this.startHourOffset = 0;
    this.endHourOffset = 12;
    this.isDark = true;
    this.compact = false;
    this.flightCount = 0;
    this.open = false;

    this._handleClickOutside = this._handleClickOutside.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._handleClickOutside);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleClickOutside);
  }

  _handleClickOutside(e) {
    if (this.open && !this.contains(e.target) && !e.composedPath().includes(this)) {
      this.open = false;
    }
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

  _emitViewChange(type) {
    this.dispatchEvent(new CustomEvent('view-changed', { detail: type }));
    this.open = false;
  }

  _emitThemeToggle() {
    this.dispatchEvent(new CustomEvent('theme-toggle'));
  }

  _toggleOpen() {
    this.open = !this.open;
  }

  render() {
    const isDeparture = this.viewType === 'D';

    // Pre-calculate full options (value + label) each render to ensure
    // the time strings are fresh (especially during Refresh).
    const options = this._getOffsetOptions().map(off => ({
      value: off,
      label: this._formatOffsetLabel(off)
    }));

    return html`
      <div class="config-row">
        <div class="menu-header">
          <button class="hamburger" @click="${() => this._toggleOpen()}">
            <sl-icon name="list"></sl-icon>
          </button>
          <div class="label">${isDeparture ? 'DEPARTURE' : 'ARRIVAL'}</div>

          <div class="space-filler"></div>

          <div style="text-align:right;color:var(--fids-dim);font-size:0.75rem;font-weight:700;">
            ${this.flightCount} FLIGHTS
          </div>

          <sl-button class="theme-toggle" @click="${() => this._emitThemeToggle()}" size="small" circle>
            <sl-icon name="${this.isDark ? 'sun' : 'moon'}"></sl-icon>
          </sl-button>
        </div>

        ${this.open ? html`
          <div class="menu-panel">
            <nav class="nav-links">
              <a @click="${() => this._emitViewChange('D')}" style="color:${isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">DEP</a>
              <div style="width:1px;height:12px;background:var(--fids-dim);opacity:0.3;"></div>
              <a @click="${() => this._emitViewChange('A')}" style="color:${!isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">ARR</a>
            </nav>

            <div class="sub-row">
              <sl-select size="small" pill value="${this.startHourOffset}" @sl-change="${(e) => this._emitRangeChange('start', e.target.value)}" style="flex:1;">
                <sl-icon name="clock" slot="prefix" style="color:var(--fids-accent)"></sl-icon>
                ${options.map(opt => html`
                  <sl-option .value="${opt.value}">${opt.label}</sl-option>
                `)}
              </sl-select>
              <sl-select size="small" pill value="${this.endHourOffset}" @sl-change="${(e) => this._emitRangeChange('end', e.target.value)}" style="flex:1;">
                <sl-icon name="clock-fill" slot="prefix" style="color:var(--fids-accent)"></sl-icon>
                ${options.map(opt => html`
                  <sl-option .value="${opt.value}">${opt.label}</sl-option>
                `)}
              </sl-select>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('flight-selection', FlightSelection);