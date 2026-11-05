console.log('[DRAWPEN]: Extended toolbar page loading...');

const toolbar = document.getElementById('toolbar');
const closeAppButton = toolbar.querySelector('.toolbar__close');
const switchToDrawButtons = toolbar.querySelectorAll('.toolbar__main-button button, .toolbar__slider');

closeAppButton.addEventListener('click', () => {
  window.electronAPI.invokeCloseApp();
});

switchToDrawButtons.forEach(button => {
  button.addEventListener('click', () => {
    window.electronAPI.invokeDrawMode();
  });
});

const setDirection = (isReversed) => toolbar.classList.toggle('toolbar--reversed', isReversed);
window.electronAPI.onToolbarDirection(setDirection);

window.electronAPI.getConfiguration().then((config) => {
  toolbar.classList.add(`toolbar--${config.tool_bar_orientation}`);
  setDirection(config.isReversed);
});
