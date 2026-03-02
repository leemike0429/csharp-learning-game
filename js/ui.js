const App = window.App || {};

App.UI = (function() {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const CS_KEYWORDS = [
    'abstract','as','base','bool','break','byte','case','catch','char','checked',
    'class','const','continue','decimal','default','delegate','do','double',
    'else','enum','event','explicit','extern','false','finally','fixed','float',
    'for','foreach','goto','if','implicit','in','int','interface','internal','is',
    'lock','long','namespace','new','null','object','operator','out','override',
    'params','private','protected','public','readonly','ref','return','sbyte',
    'sealed','short','sizeof','stackalloc','static','string','struct','switch',
    'this','throw','true','try','typeof','uint','ulong','unchecked','unsafe',
    'ushort','using','var','virtual','void','volatile','while',
    'async','await','dynamic','get','set','value','yield','where','select','from',
    'orderby','group','into','join','let','on','equals','ascending','descending',
    'partial','global','nameof','when','and','or','not','record','init','required'
  ];

  function highlightCSharp(code) {
    let html = escapeHtml(code);
    // Strings
    html = html.replace(/(&quot;[^&]*?&quot;|"[^"]*?")/g, '<span class="hl-string">$1</span>');
    // Comments
    html = html.replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>');
    // Blanks
    html = html.replace(/_____/g, '<span class="hl-blank">_____</span>');
    html = html.replace(/___/g, '<span class="hl-blank">___</span>');
    // Keywords
    const kwPattern = new RegExp('\\b(' + CS_KEYWORDS.join('|') + ')\\b', 'g');
    html = html.replace(kwPattern, '<span class="hl-keyword">$1</span>');
    // Numbers
    html = html.replace(/\b(\d+\.?\d*[fFdDmM]?)\b/g, '<span class="hl-number">$1</span>');
    return html;
  }

  function renderCodeBlock(code) {
    return '<pre class="code-block">' + highlightCSharp(code) + '</pre>';
  }

  function renderHeader(title, showBack, rightHtml) {
    return '<div class="header">' +
      (showBack ? '<button class="header-btn" onclick="history.back()">&#8592;</button>' : '<div style="width:40px"></div>') +
      '<span class="header-title">' + escapeHtml(title) + '</span>' +
      (rightHtml || '<div style="width:40px"></div>') +
    '</div>';
  }

  function renderBottomNav(activePage) {
    const items = [
      { page: 'home', icon: '\u{1F3E0}', label: '首頁' },
      { page: 'topic-select', icon: '\u{1F3AE}', label: '闖關', params: { id: 'quiz' } },
      { page: 'topic-select', icon: '\u{270F}\u{FE0F}', label: '填空', params: { id: 'fillBlank' } },
      { page: 'topic-select', icon: '\u{1F0CF}', label: '配對', params: { id: 'matching' } },
      { page: 'profile', icon: '\u{1F464}', label: '我的' }
    ];

    let html = '<nav class="bottom-nav">';
    items.forEach(function(item, i) {
      const isActive = (activePage === item.page && (!item.params || (i <= 1))) ||
                       (activePage === 'topic-select' && item.params && item.params.id === App.Router._lastMode);
      const activeClass = (activePage === item.page) ? ' active' : '';
      const params = item.params ? JSON.stringify(item.params) : '{}';
      html += '<button class="nav-item' + activeClass + '" onclick=\'App.Router.navigate("' + item.page + '", ' + params + ')\'>' +
        '<span class="nav-item-icon">' + item.icon + '</span>' +
        '<span>' + item.label + '</span>' +
      '</button>';
    });
    html += '</nav>';
    return html;
  }

  function renderLives(current, max) {
    let html = '<div class="lives">';
    for (let i = 0; i < max; i++) {
      html += '<span class="life' + (i >= current ? ' lost' : '') + '">\u2764\uFE0F</span>';
    }
    html += '</div>';
    return html;
  }

  function renderProgressBar(current, total, className) {
    const pct = total > 0 ? (current / total * 100) : 0;
    return '<div class="progress-bar">' +
      '<div class="progress-bar-fill' + (className ? ' ' + className : '') + '" style="width:' + pct + '%"></div>' +
    '</div>';
  }

  function renderStars(count, max) {
    max = max || 3;
    let html = '<div class="stars">';
    for (let i = 0; i < max; i++) {
      html += '<span class="star' + (i < count ? ' earned' : '') + '">' + (i < count ? '\u2B50' : '\u2606') + '</span>';
    }
    html += '</div>';
    return html;
  }

  function showToast(message, duration) {
    duration = duration || 2000;
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(function() {
      el.classList.add('hidden');
    }, duration);
  }

  function showAchievement(icon, name) {
    const el = document.getElementById('achievement-popup');
    if (!el) return;
    el.innerHTML = '<span class="achievement-icon">' + icon + '</span>' +
      '<div><div class="achievement-text">成就解鎖!</div><div class="achievement-name">' + escapeHtml(name) + '</div></div>';
    el.classList.remove('hidden');
    setTimeout(function() {
      el.classList.add('hidden');
    }, 3000);
  }

  function showModal(title, body, buttons) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    let btnHtml = '';
    buttons.forEach(function(btn, i) {
      btnHtml += '<button class="btn ' + (btn.class || 'btn-primary') + ' btn-block" data-idx="' + i + '">' + escapeHtml(btn.text) + '</button>';
    });
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-title">' + title + '</div>' +
      '<div class="mb-md">' + body + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' + btnHtml + '</div>' +
    '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-idx]');
      if (btn) {
        const idx = parseInt(btn.dataset.idx);
        overlay.remove();
        if (buttons[idx].onClick) buttons[idx].onClick();
      }
    });

    return overlay;
  }

  function vibrate(pattern) {
    if (App.Store.getSettings().vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  function getDifficultyBadge(difficulty) {
    if (difficulty <= 2) return '<span class="difficulty-badge difficulty-easy">簡單</span>';
    if (difficulty <= 3) return '<span class="difficulty-badge difficulty-medium">中等</span>';
    return '<span class="difficulty-badge difficulty-hard">困難</span>';
  }

  return {
    escapeHtml,
    highlightCSharp,
    renderCodeBlock,
    renderHeader,
    renderBottomNav,
    renderLives,
    renderProgressBar,
    renderStars,
    showToast,
    showAchievement,
    showModal,
    vibrate,
    getDifficultyBadge
  };
})();

window.App = App;
