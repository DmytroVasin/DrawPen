console.log('[DRAWPEN]: About Page loading...');

const version = window.electron.getVersion();

version.then(v => {
    document.getElementById('version').innerText = `Version ${v}`;
});
