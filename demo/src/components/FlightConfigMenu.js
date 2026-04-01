import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class FlightConfigMenu extends LitElement {
  static properties = {
    isDeparture: { type: Boolean },
    startHourOffset: { type: Number },
    endHourOffset: { type: Number },
    isDark: { type: Boolean },
    flightCount: { type: Number },
    open: { type: Boolean }
  };

  static styles = css`
    :host { position: relative; display: block; width: 100%; flex-grow: 1; }
    .menu-header { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; width: 100%; }
    .space-filler { flex: 1 1 auto; }
    .hamburger { display: inline-flex; background: transparent; border: 1px solid var(--fids-dim); color: var(--fids-text); width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; justify-content: center; align-items: center; padding: 0; line-height: 1; font-size: 1.12rem; cursor: pointer; }
    .label { font-weight: 700; font-size: 1.1rem; margin-left: 0.75rem; color: var(--fids-accent); }
    .menu-panel { 
      position: absolute; top: 100%; left: 0; right: 0; z-index: 25; margin-top: 0.3rem;
      background: rgba(30, 33, 40, 0.9); /* darker translucent overlay for depth */
      backdrop-filter: blur(8px); /* adds glassy depth effect */
      display: flex; flex-direction: column; align-items: stretch; gap: 0.75rem; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.35); border-radius: 8px;
    }
    .sub-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; width: 100%; }
    .sub-row sl-input { flex: 1 1 calc(50% - 0.5rem); min-width: 160px; }

    @media (max-width: 520px) {
      .sub-row sl-input { flex: 1 1 100%; min-width: 0; }
    }
    
    .nav-links {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      justify-content: center;
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
  `;

  constructor() {
    super();
    this.visible = false;
    this.isDeparture = true;
    this.startHourOffset = 0;
    this.endHourOffset = 12;
    this.isDark = true;
    this.flightCount = 0;
    this.open = false;
  }

  _toggleOpen() {
    this.open = !this.open;
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

  _emitViewChange(type) {
    this.dispatchEvent(new CustomEvent('view-changed', { detail: type, bubbles: true, composed: true }));
  }

  _emitRangeChange(type, value) {
    const start = type === 'start' ? this._timeToOffset(value) : this.startHourOffset;
    const end = type === 'end' ? this._timeToOffset(value) : this.endHourOffset;
    this.dispatchEvent(new CustomEvent('range-changed', { detail: { start, end }, bubbles: true, composed: true }));
  }

  _emitThemeToggle() {
    this.dispatchEvent(new CustomEvent('theme-toggle', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="menu-header">
        <button class="hamburger" @click="${() => this._toggleOpen()}">☰</button>
        <div class="label">${this.isDeparture ? 'DEPARTURE' : 'ARRIVAL'}</div>

        <div class="space-filler"></div>

        <div style="text-align:right;color:var(--fids-dim);font-size:0.75rem;font-weight:700;">
          ${this.flightCount} FLIGHTS
        </div>

        <sl-button @click="${() => this._emitThemeToggle()}" size="small" circle>
          <sl-icon name="${this.isDark ? 'sun' : 'moon'}"></sl-icon>
        </sl-button>
      </div>

      ${this.open ? html`
        <div class="menu-panel">
          <nav class="nav-links">
            <a @click="${() => this._emitViewChange('D')}" style="color:${this.isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">DEP</a>
            <div style="width:1px;height:12px;background:var(--fids-dim);opacity:0.3;"></div>
            <a @click="${() => this._emitViewChange('A')}" style="color:${!this.isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">ARR</a>
          </nav>

          <div class="sub-row">
            <sl-input type="time" size="small" pill value="${this._offsetToTime(this.startHourOffset)}" @sl-change="${(e) => this._emitRangeChange('start', e.target.value)}" style="flex:1;">
              <sl-icon name="clock" slot="prefix"></sl-icon>
            </sl-input>
            <sl-input type="time" size="small" pill value="${this._offsetToTime(this.endHourOffset)}" @sl-change="${(e) => this._emitRangeChange('end', e.target.value)}" style="flex:1;">
              <sl-icon name="clock-fill" slot="prefix"></sl-icon>
            </sl-input>
          </div>
        </div>
      ` : html``}
    `;
  }
}

customElements.define('flight-config-menu', FlightConfigMenu);