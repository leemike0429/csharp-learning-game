var App = window.App || {};

(function() {
  function init() {
    // Init store
    App.Store.init();

    // Apply theme
    const theme = App.Store.getSettings().theme;
    if (theme) document.documentElement.setAttribute('data-theme', theme);

    // Register routes
    App.Router.register('home', App.Pages.Home.render);
    App.Router.register('topic-select', App.Pages.TopicSelect.render);
    App.Router.register('level-select', App.Pages.LevelSelect.render);
    App.Router.register('quiz', App.Pages.Quiz.render);
    App.Router.register('fill-blank', App.Pages.FillBlank.render);
    App.Router.register('matching', App.Pages.Matching.render);
    App.Router.register('result', App.Pages.Result.render);
    App.Router.register('profile', App.Pages.Profile.render);

    // Start router
    App.Router.init();

    // Register service worker & detect updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(function(reg) {
        // Check for updates periodically (every 30 minutes)
        setInterval(function() { reg.update(); }, 30 * 60 * 1000);

        reg.addEventListener('updatefound', function() {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function() {
            // New SW installed & waiting, and there's an existing controller (not first install)
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      }).catch(function() {
        // SW registration failed, app still works
      });

      // Also detect when new SW takes control
      var refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }

  function showUpdateBanner() {
    // Don't show if already visible
    if (document.getElementById('update-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:white;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:0.9rem;box-shadow:0 2px 12px rgba(0,0,0,0.3);max-width:500px;margin:0 auto;';
    banner.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:1.3rem">\u{1F389}</span>' +
        '<span>有新版本可用！</span>' +
      '</div>' +
      '<button id="update-btn" style="background:white;color:#6c5ce7;border:none;border-radius:20px;padding:6px 16px;font-weight:700;font-size:0.85rem;cursor:pointer;white-space:nowrap">立即更新</button>';
    document.body.appendChild(banner);

    document.getElementById('update-btn').addEventListener('click', function() {
      // Tell the waiting SW to skipWaiting (take over)
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(function(reg) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
      banner.innerHTML = '<div style="text-align:center;width:100%">\u{1F504} 正在更新...</div>';
    });
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
