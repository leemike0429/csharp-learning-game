const App = window.App || {};

App.Pages = App.Pages || {};

App.Pages.Home = (function() {
  function render(container) {
    const stats = App.Store.getStats();
    const settings = App.Store.getSettings();
    const expNeeded = App.Store.expToNextLevel(stats.level);
    const expPct = Math.round(stats.exp / expNeeded * 100);
    const totalQ = App.Questions.getTotalQuestionCount();
    const accuracy = stats.totalAnswered > 0 ? Math.round(stats.totalCorrect / stats.totalAnswered * 100) : 0;

    const topics = App.Questions.getAllTopics();
    const topicIds = App.Questions.getTopicIds();

    let modeCards = '';
    const modes = [
      { mode: 'quiz', icon: '\u{1F4DD}', name: '選擇題闖關', desc: '一關一關挑戰，征服 C#' },
      { mode: 'fillBlank', icon: '\u270F\uFE0F', name: '填空題挑戰', desc: '填入缺少的 C# 語法' },
      { mode: 'matching', icon: '\u{1F0CF}', name: '配對遊戲', desc: '概念與說明快速配對' }
    ];

    modes.forEach(function(m) {
      let totalLevels = 0;
      let completedLevels = 0;
      topicIds.forEach(function(tid) {
        const levels = App.Questions.getLevelsByMode(tid, m.mode);
        totalLevels += levels.length;
        const progress = App.Store.getTopicProgress(m.mode, tid);
        levels.forEach(function(l) {
          if (progress[l.id] && progress[l.id].completed) completedLevels++;
        });
      });
      const pct = totalLevels > 0 ? Math.round(completedLevels / totalLevels * 100) : 0;
      modeCards += '<div class="card card-clickable mb-md" onclick=\'App.Router.navigate("topic-select", {id:"' + m.mode + '"})\'>' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<span style="font-size:2rem">' + m.icon + '</span>' +
          '<div style="flex:1">' +
            '<div style="font-weight:700;font-size:1.1rem">' + m.name + '</div>' +
            '<div class="text-dim" style="font-size:0.85rem">' + m.desc + '</div>' +
            '<div style="margin-top:6px;display:flex;align-items:center;gap:8px">' +
              '<span class="text-muted" style="font-size:0.8rem">' + completedLevels + '/' + totalLevels + ' 關</span>' +
              '<div style="flex:1">' + App.UI.renderProgressBar(completedLevels, totalLevels) + '</div>' +
            '</div>' +
          '</div>' +
          '<span style="color:var(--text-muted);font-size:1.2rem">&#8250;</span>' +
        '</div>' +
      '</div>';
    });

    container.innerHTML =
      App.UI.renderHeader('C# 學習遊戲', false, '<button class="header-btn" onclick=\'App.Router.navigate("profile")\'>&#9881;&#65039;</button>') +
      '<div class="page animate-page-enter"><div class="page-content">' +
        // Player Info Card
        '<div class="card mb-md">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
            '<span style="font-size:2.5rem">\u{1F3AE}</span>' +
            '<div style="flex:1">' +
              '<div style="font-size:1.2rem;font-weight:700">Lv.' + stats.level + ' ' + App.Store.getProfile().nickname + '</div>' +
              '<div style="margin-top:4px">' +
                '<div class="xp-bar"><div class="xp-bar-fill" style="width:' + expPct + '%"></div></div>' +
                '<div class="text-dim" style="font-size:0.75rem;margin-top:2px">' + stats.exp + ' / ' + expNeeded + ' EXP</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          (stats.dailyStreak > 0 ? '<div style="text-align:center;color:var(--warning);font-size:0.85rem">\u{1F525} 連續 ' + stats.dailyStreak + ' 天學習</div>' : '') +
        '</div>' +

        // Stats
        '<div class="stats-row mb-lg">' +
          '<div class="stat-box"><div class="stat-value">' + stats.totalCorrect + '</div><div class="stat-label">答對題數</div></div>' +
          '<div class="stat-box"><div class="stat-value">' + accuracy + '%</div><div class="stat-label">正確率</div></div>' +
          '<div class="stat-box"><div class="stat-value">' + stats.bestStreak + '</div><div class="stat-label">最佳連續</div></div>' +
        '</div>' +

        // Game Mode Cards
        '<div style="font-size:1.1rem;font-weight:700;margin-bottom:12px">\u{1F3AE} 選擇遊戲模式</div>' +
        modeCards +

        // Total Questions
        '<div class="text-center text-muted" style="font-size:0.8rem;margin-top:16px">題庫共 ' + totalQ + ' 題</div>' +
      '</div></div>' +
      App.UI.renderBottomNav('home');
  }

  return { render: render };
})();

window.App = App;
