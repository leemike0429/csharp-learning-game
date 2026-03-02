const App = window.App || {};

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

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function() {
        // SW registration failed, app still works
      });
    }
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
