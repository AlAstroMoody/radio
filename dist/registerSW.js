if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('/radio/sw.js', { scope: '/radio/' })})}