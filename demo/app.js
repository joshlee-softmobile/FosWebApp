import './src/views/FlightView.js';

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
