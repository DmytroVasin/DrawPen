console.log('[DRAWPEN]: About Page loading...');

const version = window.electronAPI.getVersion();

version.then(v => {
    document.getElementById('version').innerText = `Version ${v}`;
});
