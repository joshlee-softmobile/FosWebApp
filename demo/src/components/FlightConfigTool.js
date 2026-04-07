import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightConfigTool extends LitElement {
  static properties = {
    isDeparture: { type: Boolean },
    startHourOffset: { type: Number },
    endHourOffset: { type: Number },
    isDark: { type: Boolean },
    flightCount: { type: Number }
  };

  static styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      width: auto;
      flex-grow: 1;
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

    sl-input {
      min-width: 110px;
      max-width: 130px;
    }

    .space-filler { flex: 1 1 auto; }

    .count-label {
      text-align: right;
      color: var(--fids-dim);
      font-size: 0.75rem;
      font-weight: 700;
    }
  `;

  _offsetToTime(offset) {
    const now = new Date();
    const target = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const h = String(target.getHours()).padStart(2, '0');
    const m = String(target.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  render() {
    return html`
      <nav class="nav-links">
        <a @click="${() => this.dispatchEvent(new CustomEvent('view-changed', { detail: 'D' }))}" 
           style="color:${this.isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">DEP</a>
        <div style="width:1px;height:12px;background:var(--fids-dim);opacity:0.3;"></div>
        <a @click="${() => this.dispatchEvent(new CustomEvent('view-changed', { detail: 'A' }))}" 
           style="color:${!this.isDeparture ? 'var(--fids-accent)' : 'var(--fids-dim)'}">ARR</a>
      </nav>

      <sl-input type="time" size="small" pill 
        value="${this._offsetToTime(this.startHourOffset)}" 
        @sl-change="${(e) => this.dispatchEvent(new CustomEvent('range-changed', { detail: { type: 'start', value: e.target.value } }))}">
        <sl-icon name="clock" slot="prefix"></sl-icon>
      </sl-input>

      <sl-icon name="arrow-right" style="color:var(--fids-dim);font-size:0.8rem;"></sl-icon>

      <sl-input type="time" size="small" pill 
        value="${this._offsetToTime(this.endHourOffset)}" 
        @sl-change="${(e) => this.dispatchEvent(new CustomEvent('range-changed', { detail: { type: 'end', value: e.target.value } }))}">
        <sl-icon name="clock-fill" slot="prefix"></sl-icon>
      </sl-input>
          
      <div class="space-filler"></div>
      
      <div class="count-label">${this.flightCount} FLIGHTS</div>
      
      <sl-button @click="${() => this.dispatchEvent(new CustomEvent('theme-toggle'))}" size="small" circle>
        <sl-icon name="${this.isDark ? 'sun' : 'moon'}"></sl-icon>
      </sl-button>
    `;
  }
}
customElements.define('flight-config-tool', FlightConfigTool);