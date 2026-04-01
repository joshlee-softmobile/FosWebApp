import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightAlert extends LitElement {
  static properties = {
    message: { type: String },
    variant: { type: String },
    open: { type: Boolean }
  };

  static styles = css`
    :host { display: block; }
    .alert { display: none; padding: 0.75rem 1rem; margin: 0.5rem 0; border-radius: 4px; font-size: 0.85rem; }
    .alert.open { display: block; }
    .danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .info { background: #eff6ff; color: #1d4ed8; border: 1px solid #93c5fd; }
  `;

  constructor() {
    super();
    this.message = '';
    this.variant = 'info';
    this.open = false;
  }

  render() {
    return html`
      <div class="alert ${this.open ? 'open' : ''} ${this.variant}">
        ${this.message}
      </div>
    `;
  }
}

customElements.define('flight-alert', FlightAlert);
