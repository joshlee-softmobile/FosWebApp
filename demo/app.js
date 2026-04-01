import './src/views/FlightView.js';

import './src/components/FlightTable.js';
import './src/components/FlightTableRow.js';
import './src/components/FlightAlert.js';
import './src/components/FlightConfig.js';
import './src/components/FlightConfigMenu.js';
import './src/components/FlightPagination.js';

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
  if (!window.location.hash) {
    window.location.hash = '#/departure';
  }

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<flight-view></flight-view>';
  }
});
