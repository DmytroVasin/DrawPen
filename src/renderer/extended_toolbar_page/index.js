console.log('[DRAWPEN]: Extended toolbar page loading...');

const toolbar = document.getElementById('toolbar');
const closeAppButton = toolbar.querySelector('.toolbar__close');
const switchToDrawButton = toolbar.querySelector('.toolbar__main-button button');

closeAppButton.addEventListener('click', () => {
  window.electronAPI.invokeCloseApp();
});

switchToDrawButton.addEventListener('click', () => {
  window.electronAPI.invokeDrawMode();
});
