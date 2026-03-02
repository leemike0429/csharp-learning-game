const App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.Result = (function() {
  function render(container, params) {
    const result = params.result;
    if (!result) { App.Router.navigate('home'); return; }

    const levelId = params.id;
    const topicId = params.extra;
    const mode = params.mode || 'quiz';
    const expGained = params.expGained || 0;
    const isFirstClear = params.isFirstClear || false;
    const time = params.time || '0:00';
    const newAchievements = params.newAchievements || [];
    const level = App.Questions.getLevel(topicId, levelId);
    const stats = App.Store.getStats();
    const expNeeded = App.Store.expToNextLevel(stats.level);
    const expPct = Math.round(stats.exp / expNeeded * 100);

    const passed = result.stars > 0;
    const title = passed ? '\u{1F389} 恭喜通關！' : '\u{1F4AA} 再接再厲！';
    const accuracy = result.total > 0 ? Math.round(result.correct / result.total * 100) : 0;

    let achievementsHtml = '';
    if (newAchievements.length > 0) {
      achievementsHtml = '<div class="mt-md">' +
        '<div style="font-size:0.9rem;font-weight:700;margin-bottom:8px">\u{1F3C6} 新成就解鎖！</div>';
      newAchievements.forEach(function(ach) {
        achievementsHtml += '<div class="card mb-sm" style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--primary)">' +
          '<span style="font-size:1.5rem">' + ach.icon + '</span>' +
          '<div><div style="font-weight:700">' + App.UI.escapeHtml(ach.name) + '</div>' +
          '<div class="text-dim" style="font-size:0.8rem">' + App.UI.escapeHtml(ach.desc) + '</div></div>' +
        '</div>';
      });
      achievementsHtml += '</div>';
    }

    const modeNames = { quiz: '選擇題', fillBlank: '填空題', matching: '配對' };

    // Find next level
    const topic = App.Questions.getTopic(topicId);
    let nextLevelId = null;
    if (topic && passed) {
      const modeLevels = App.Questions.getLevelsByMode(topicId, mode);
      for (var i = 0; i < modeLevels.length; i++) {
        if (modeLevels[i].id === levelId && i + 1 < modeLevels.length) {
          nextLevelId = modeLevels[i + 1].id;
          break;
        }
      }
    }

    const playPage = mode === 'quiz' ? 'quiz' : (mode === 'fillBlank' ? 'fill-blank' : 'matching');

    container.innerHTML =
      '<div class="page animate-page-enter" style="padding-bottom:32px"><div class="page-content text-center">' +
        '<div style="font-size:2.5rem;margin-top:24px">' + (passed ? '\u{1F389}' : '\u{1F4AA}') + '</div>' +
        '<div style="font-size:1.5rem;font-weight:700;margin:8px 0">' + title + '</div>' +
        (level ? '<div class="text-dim" style="margin-bottom:16px">' + App.UI.escapeHtml(level.title) + '</div>' : '') +

        // Stars
        '<div style="margin:16px 0">' +
          App.UI.renderStars(result.stars) +
        '</div>' +

        // Stats
        '<div class="card mb-md" style="text-align:left">' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">' +
            '<span class="text-dim">最終分數</span><span style="font-weight:700;color:var(--accent)">' + result.score.toLocaleString() + '</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">' +
            '<span class="text-dim">答對題數</span><span style="font-weight:700">' + result.correct + '/' + result.total + ' (' + accuracy + '%)</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">' +
            '<span class="text-dim">最長連續</span><span style="font-weight:700">' + result.bestStreak + ' 題</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0">' +
            '<span class="text-dim">花費時間</span><span style="font-weight:700">' + time + '</span>' +
          '</div>' +
        '</div>' +

        // EXP
        '<div class="card mb-md">' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px">' +
            '<span style="color:var(--accent);font-weight:700;font-size:1.2rem">+' + expGained + ' EXP</span>' +
            (isFirstClear ? '<span style="color:var(--warning);font-size:0.8rem">(首次通關加成!)</span>' : '') +
          '</div>' +
          '<div style="text-align:center;margin-bottom:4px;font-size:0.85rem">Lv.' + stats.level + '</div>' +
          '<div class="xp-bar"><div class="xp-bar-fill" style="width:' + expPct + '%"></div></div>' +
          '<div class="text-dim" style="font-size:0.75rem;text-align:center;margin-top:4px">' + stats.exp + ' / ' + expNeeded + '</div>' +
        '</div>' +

        achievementsHtml +

        // Buttons
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:20px">' +
          '<button class="btn btn-outline btn-block" onclick=\'App.Router.navigate("' + playPage + '", {id:"' + levelId + '", extra:"' + topicId + '"})\'>&#128260; 重新挑戰</button>' +
          (nextLevelId ?
            '<button class="btn btn-primary btn-block" onclick=\'App.Router.navigate("' + playPage + '", {id:"' + nextLevelId + '", extra:"' + topicId + '"})\'>&#9654; 下一關</button>' : '') +
          '<button class="btn btn-ghost btn-block" onclick=\'App.Router.navigate("home")\'>\u{1F3E0} 回首頁</button>' +
        '</div>' +
      '</div></div>';

    // Show achievement popups
    if (newAchievements.length > 0) {
      setTimeout(function() {
        App.UI.showAchievement(newAchievements[0].icon, newAchievements[0].name);
      }, 800);
    }
  }

  return { render: render };
})();

window.App = App;
