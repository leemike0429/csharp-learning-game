var App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.TopicSelect = (function() {
  function render(container, params) {
    const mode = params.id || 'quiz';
    App.Router._lastMode = mode;
    const modeNames = { quiz: '選擇題闖關', fillBlank: '填空題挑戰', matching: '配對遊戲' };
    const modeName = modeNames[mode] || '遊戲';
    const topics = App.Questions.getAllTopics();
    const topicIds = App.Questions.getTopicIds();

    let cardsHtml = '';
    topics.forEach(function(topic, idx) {
      const levels = App.Questions.getLevelsByMode(topic.topic, mode);
      const progress = App.Store.getTopicProgress(mode, topic.topic);
      const completedCount = levels.filter(function(l) { return progress[l.id] && progress[l.id].completed; }).length;
      const totalCount = levels.length;
      const unlocked = App.Store.isTopicUnlocked(topic.topic, topicIds);
      const totalStars = levels.reduce(function(sum, l) { return sum + ((progress[l.id] && progress[l.id].stars) || 0); }, 0);
      const maxStars = totalCount * 3;

      if (!unlocked) {
        cardsHtml += '<div class="card mb-md" style="opacity:0.4">' +
          '<div style="display:flex;align-items:center;gap:12px">' +
            '<span style="font-size:2rem">\u{1F512}</span>' +
            '<div style="flex:1">' +
              '<div style="font-weight:700">' + topic.topicName + '</div>' +
              '<div class="text-dim" style="font-size:0.85rem">需完成前一主題 60% 關卡才能解鎖</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      } else {
        const pct = totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0;
        const btnText = completedCount === 0 ? '開始挑戰' : (completedCount >= totalCount ? '再次挑戰' : '繼續挑戰');
        cardsHtml += '<div class="card card-clickable mb-md" onclick=\'App.Router.navigate("level-select", {id:"' + topic.topic + '", extra:"' + mode + '"})\'>' +
          '<div style="display:flex;align-items:center;gap:12px">' +
            '<span style="font-size:2rem">' + topic.icon + '</span>' +
            '<div style="flex:1">' +
              '<div style="font-weight:700;font-size:1.1rem">' + topic.topicName + '</div>' +
              '<div class="text-dim" style="font-size:0.85rem;margin-top:2px">' +
                '\u2B50 ' + totalStars + '/' + maxStars + '  \u00B7  ' + completedCount + '/' + totalCount + ' 關已完成' +
              '</div>' +
              '<div style="margin-top:6px">' + App.UI.renderProgressBar(completedCount, totalCount, completedCount >= totalCount ? 'success' : '') + '</div>' +
            '</div>' +
            '<span style="color:var(--text-muted);font-size:1.2rem">&#8250;</span>' +
          '</div>' +
        '</div>';
      }
    });

    container.innerHTML =
      App.UI.renderHeader(modeName, true) +
      '<div class="page animate-page-enter"><div class="page-content">' +
        cardsHtml +
        (topics.length === 0 ? '<div class="text-center text-muted mt-lg">尚無題庫資料</div>' : '') +
      '</div></div>' +
      App.UI.renderBottomNav('topic-select');
  }

  return { render: render };
})();

window.App = App;
