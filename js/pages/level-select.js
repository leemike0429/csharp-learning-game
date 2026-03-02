const App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.LevelSelect = (function() {
  function render(container, params) {
    const topicId = params.id;
    const mode = params.extra || 'quiz';
    const topic = App.Questions.getTopic(topicId);
    if (!topic) { App.Router.navigate('home'); return; }

    const levels = App.Questions.getLevelsByMode(topicId, mode);
    const allLevels = topic.levels;

    let gridHtml = '';
    levels.forEach(function(level, idx) {
      const progress = App.Store.getLevelProgress(mode, topicId, level.id);
      const unlocked = App.Store.isLevelUnlocked(mode, topicId, idx, levels);
      const stars = progress ? progress.stars : 0;
      const completed = progress && progress.completed;

      let nodeClass = 'level-node';
      if (!unlocked) nodeClass += ' locked';
      else if (completed) nodeClass += ' completed';
      else nodeClass += ' current';

      const starsHtml = '<div class="level-stars">' +
        (stars >= 1 ? '\u2B50' : '\u2606') +
        (stars >= 2 ? '\u2B50' : '\u2606') +
        (stars >= 3 ? '\u2B50' : '\u2606') +
      '</div>';

      const playPage = mode === 'quiz' ? 'quiz' : (mode === 'fillBlank' ? 'fill-blank' : 'matching');

      gridHtml += '<div class="' + nodeClass + '"' +
        (unlocked ? ' onclick=\'App.Router.navigate("' + playPage + '", {id:"' + level.id + '", extra:"' + topicId + '"})\'' : '') + '>' +
        (unlocked ?
          '<div class="level-num">' + (idx + 1) + '</div>' +
          starsHtml +
          '<div class="level-title">' + App.UI.escapeHtml(level.title) + '</div>'
          :
          '<div class="level-num">\u{1F512}</div>' +
          '<div class="level-title">' + App.UI.escapeHtml(level.title) + '</div>'
        ) +
      '</div>';
    });

    const modeNames = { quiz: '選擇題', fillBlank: '填空題', matching: '配對' };

    container.innerHTML =
      App.UI.renderHeader(topic.topicName + ' - ' + (modeNames[mode] || ''), true) +
      '<div class="page animate-page-enter">' +
        '<div class="level-grid">' + gridHtml + '</div>' +
        (levels.length === 0 ? '<div class="text-center text-muted mt-lg">此主題暫無' + (modeNames[mode] || '') + '關卡</div>' : '') +
      '</div>' +
      App.UI.renderBottomNav('topic-select');
  }

  return { render: render };
})();

window.App = App;
