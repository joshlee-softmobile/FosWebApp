import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FlightPagination extends LitElement {
  static properties = {
    currentPage: { type: Number },
    pageCount: { type: Number }
  };

  constructor() {
    super();
    this.currentPage = 1;
    this.pageCount = 1;
  }

  _emitPage(page) {
    const normalized = Math.min(Math.max(1, page), Math.max(1, this.pageCount));
    this.dispatchEvent(new CustomEvent('page-changed', {
      detail: { page: normalized },
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
      </div>
    `;
  }

  static styles = css`
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
      .pagination-bar input[type="range"] { max-width: 120px; }
    }
  `;
}

customElements.define('flight-pagination', FlightPagination);
