const App = window.App || {};

App.Router = (function() {
  const routes = {};
  let currentPage = null;
  let currentParams = {};

  function register(name, renderFn) {
    routes[name] = renderFn;
  }

  function navigate(page, params) {
    params = params || {};
    const hash = '#' + page + (params.id ? '/' + params.id : '');
    if (window.location.hash === hash) {
      render(page, params);
    } else {
      currentParams = params;
      window.location.hash = hash;
    }
  }

  function render(page, params) {
    currentPage = page;
    const renderFn = routes[page];
    if (renderFn) {
      const app = document.getElementById('app');
      app.innerHTML = '';
      renderFn(app, params);
    }
  }

  function handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const page = parts[0];
    const params = currentParams.id ? currentParams : { id: parts[1] || null, extra: parts[2] || null };
    currentParams = {};
    render(page, params);
  }

  function init() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function getCurrentPage() {
    return currentPage;
  }

  return { register, navigate, init, getCurrentPage };
})();

window.App = App;
