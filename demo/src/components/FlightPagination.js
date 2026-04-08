import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightPagination extends LitElement {
  static properties = {
    currentPage: { type: Number },
    pageCount: { type: Number },
    isAutoFlipEnabled: { type: Boolean }
  };

  constructor() {
    super();
    this.currentPage = 1;
    this.pageCount = 1;
    this.isAutoFlipEnabled = true;
  }

  _emitPage(page) {
    const normalized = Math.min(Math.max(1, page), Math.max(1, this.pageCount));
    this.dispatchEvent(new CustomEvent('page-changed', {
      detail: { page: normalized },
      bubbles: true,
      composed: true
    }));
  }

  _toggleAutoFlip() {
    this.dispatchEvent(new CustomEvent('autoflip-toggle', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const pageCount = Math.max(1, this.pageCount);
    return html`
      <div class="pagination-bar" role="navigation" aria-label="flight page navigation">
        <button @click="${() => this._emitPage(1)}" ?disabled="${this.currentPage <= 1}">⏮</button>
        <button @click="${() => this._emitPage(this.currentPage - 1)}" ?disabled="${this.currentPage <= 1}">◀</button>

        <span>Page ${this.currentPage} / ${pageCount}</span>

        <input type="range"
          min="1"
          max="${pageCount}"
          .value="${String(this.currentPage)}"
          @input="${(e) => this._emitPage(Number(e.target.value))}"
          aria-label="Select flight page"
        />

        <button @click="${() => this._emitPage(this.currentPage + 1)}" ?disabled="${this.currentPage >= pageCount}">▶</button>
        <button @click="${() => this._emitPage(pageCount)}" ?disabled="${this.currentPage >= pageCount}">⏭</button>

        <div class="divider"></div>

        <button @click="${this._toggleAutoFlip}" class="autoflip-btn ${this.isAutoFlipEnabled ? 'active' : ''}" title="${this.isAutoFlipEnabled ? 'Pause Auto-flip' : 'Start Auto-flip'}">
          ${this.isAutoFlipEnabled ? html`⏸ <small>PAUSE</small>` : html`▶ <small>AUTO</small>`}
        </button>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      flex: 0 0 auto;
      width: 100%;
      box-sizing: border-box;
      z-index: 20;
    }

    .pagination-bar {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem;
      border-top: 1px solid rgba(0,0,0,0.08);
      color: var(--fids-dim);
      font-size: 0.75rem;
      flex-wrap: nowrap;
      justify-content: center;
      overflow-x: auto;
      background: var(--fids-surface-2);
      min-height: 44px;
    }

    .pagination-bar button {
      border: none;
      background: transparent;
      color: inherit;
      padding: 0.25rem 0.45rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 700;
    }

    .pagination-bar button.active,
    .pagination-bar button:hover {
      background: rgba(255,255,255,0.15);
      color: var(--fids-accent);
    }

    .pagination-bar span {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-weight: 700;
      min-width: 90px;
      justify-content: center;
    }

    .pagination-bar input[type="range"] {
      flex-grow: 1;
      margin: 0 0.5rem;
      max-width: 240px;
      background: linear-gradient(90deg, var(--fids-accent), var(--fids-accent));
      cursor: pointer;
    }

    .divider {
      width: 1px;
      height: 20px;
      background: var(--fids-separator);
      margin: 0 0.25rem;
    }

    .autoflip-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.6rem !important;
      border: 1px solid transparent !important;
      transition: all 0.3s ease;
      white-space: nowrap;
      opacity: 0.5;
      filter: grayscale(0.8);
      color: var(--fids-dim) !important;
    }

    .autoflip-btn:hover {
      opacity: 1;
      filter: grayscale(0);
      color: var(--fids-text) !important;
      border-color: var(--fids-separator) !important;
      background: rgba(255, 255, 255, 0.05) !important;
    }

    .autoflip-btn small {
      font-size: 0.6rem;
      letter-spacing: 0.5px;
    }

    .autoflip-btn.active {
      opacity: 0.7;
      filter: grayscale(0.2);
      color: var(--fids-accent) !important;
      border-color: rgba(255, 204, 0, 0.2) !important;
    }

    .autoflip-btn.active:hover {
      opacity: 1;
      filter: grayscale(0);
      border-color: var(--fids-accent) !important;
      background: rgba(255, 204, 0, 0.1) !important;
    }

    .pagination-bar button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .pagination-bar {
        font-size: 0.68rem;
        gap: 0.3rem;
        padding: 0.35rem;
      }
      .pagination-bar span { display: none; }
      .pagination-bar input[type="range"] { max-width: 100px; }
      .autoflip-btn small { display: none; }
      .autoflip-btn { padding: 0.25rem 0.4rem !important; }
      .divider { margin: 0 0.1rem; }
    }
  `;
}

customElements.define('flight-pagination', FlightPagination);
