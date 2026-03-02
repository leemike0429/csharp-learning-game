var App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.Profile = (function() {
  function render(container) {
    const stats = App.Store.getStats();
    const profile = App.Store.getProfile();
    const settings = App.Store.getSettings();
    const achievements = App.Store.getAchievements();
    const expNeeded = App.Store.expToNextLevel(stats.level);
    const expPct = Math.round(stats.exp / expNeeded * 100);
    const accuracy = stats.totalAnswered > 0 ? Math.round(stats.totalCorrect / stats.totalAnswered * 100) : 0;

    const unlockedCount = Object.keys(achievements).length;
    const totalAchievements = App.Achievements.LIST.length;

    let achievementsHtml = '';
    App.Achievements.LIST.forEach(function(ach) {
      const unlocked = !!achievements[ach.id];
      achievementsHtml += '<div class="card mb-sm" style="display:flex;align-items:center;gap:12px;padding:12px;' +
        (!unlocked ? 'opacity:0.4' : '') + '">' +
        '<span style="font-size:1.5rem">' + (unlocked ? ach.icon : '\u{1F512}') + '</span>' +
        '<div style="flex:1">' +
          '<div style="font-weight:600;font-size:0.9rem">' + App.UI.escapeHtml(ach.name) + '</div>' +
          '<div class="text-dim" style="font-size:0.8rem">' + App.UI.escapeHtml(ach.desc) + '</div>' +
        '</div>' +
        (unlocked ? '<span style="color:var(--success)">\u2713</span>' : '') +
      '</div>';
    });

    container.innerHTML =
      App.UI.renderHeader('我的學習檔案', true) +
      '<div class="page animate-page-enter"><div class="page-content">' +
        // Profile Card
        '<div class="card mb-md text-center">' +
          '<div style="font-size:3rem">\u{1F9D1}\u200D\u{1F4BB}</div>' +
          '<div style="font-size:1.3rem;font-weight:700;margin:8px 0">' + App.UI.escapeHtml(profile.nickname) + '</div>' +
          '<div style="color:var(--accent);font-weight:700">Lv.' + stats.level + '</div>' +
          '<div style="margin:8px auto;max-width:200px">' +
            '<div class="xp-bar"><div class="xp-bar-fill" style="width:' + expPct + '%"></div></div>' +
            '<div class="text-dim" style="font-size:0.75rem;margin-top:2px">' + stats.exp + ' / ' + expNeeded + ' EXP</div>' +
          '</div>' +
          (stats.dailyStreak > 0 ? '<div style="color:var(--warning)">\u{1F525} 連續 ' + stats.dailyStreak + ' 天</div>' : '') +
        '</div>' +

        // Stats
        '<div style="font-size:1.1rem;font-weight:700;margin-bottom:8px">\u{1F4CA} 學習統計</div>' +
        '<div class="stats-row mb-lg">' +
          '<div class="stat-box"><div class="stat-value">' + stats.totalAnswered + '</div><div class="stat-label">總答題</div></div>' +
          '<div class="stat-box"><div class="stat-value">' + accuracy + '%</div><div class="stat-label">正確率</div></div>' +
          '<div class="stat-box"><div class="stat-value">' + stats.totalScore.toLocaleString() + '</div><div class="stat-label">總分</div></div>' +
        '</div>' +

        // Achievements
        '<div style="font-size:1.1rem;font-weight:700;margin-bottom:8px">\u{1F3C6} 成就 (' + unlockedCount + '/' + totalAchievements + ')</div>' +
        achievementsHtml +

        // Settings
        '<div style="font-size:1.1rem;font-weight:700;margin:16px 0 8px">\u2699\uFE0F 設定</div>' +
        '<div class="card mb-md">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">' +
            '<span>\u{1F50A} 音效</span>' +
            '<button class="btn btn-sm ' + (settings.soundEnabled ? 'btn-primary' : 'btn-outline') + '" onclick="App.Pages.Profile.toggleSound()">' +
              (settings.soundEnabled ? '開' : '關') +
            '</button>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">' +
            '<span>\u{1F4F3} 震動</span>' +
            '<button class="btn btn-sm ' + (settings.vibrationEnabled ? 'btn-primary' : 'btn-outline') + '" onclick="App.Pages.Profile.toggleVibration()">' +
              (settings.vibrationEnabled ? '開' : '關') +
            '</button>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">' +
            '<span>\u{1F319} 主題</span>' +
            '<button class="btn btn-sm btn-outline" onclick="App.Pages.Profile.toggleTheme()">' +
              (settings.theme === 'dark' ? '深色' : '淺色') +
            '</button>' +
          '</div>' +
        '</div>' +

        // Reset
        '<button class="btn btn-danger btn-block btn-sm" onclick="App.Pages.Profile.confirmReset()">\u{1F5D1}\uFE0F 重置所有進度</button>' +
        '<div style="height:32px"></div>' +
      '</div></div>' +
      App.UI.renderBottomNav('profile');
  }

  function toggleSound() {
    const s = App.Store.getSettings();
    App.Store.updateSettings({ soundEnabled: !s.soundEnabled });
    render(document.getElementById('app'));
  }

  function toggleVibration() {
    const s = App.Store.getSettings();
    App.Store.updateSettings({ vibrationEnabled: !s.vibrationEnabled });
    render(document.getElementById('app'));
  }

  function toggleTheme() {
    const s = App.Store.getSettings();
    const newTheme = s.theme === 'dark' ? 'light' : 'dark';
    App.Store.updateSettings({ theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
    render(document.getElementById('app'));
  }

  function confirmReset() {
    App.UI.showModal(
      '\u26A0\uFE0F 確定重置？',
      '<div class="text-center text-dim">這將會清除所有遊戲進度、成就和設定，<br>此操作無法復原！</div>',
      [
        { text: '取消', class: 'btn-outline', onClick: function() {} },
        { text: '確定重置', class: 'btn-danger', onClick: function() {
          App.Store.resetAll();
          App.UI.showToast('已重置所有進度');
          App.Router.navigate('home');
        }}
      ]
    );
  }

  return {
    render: render,
    toggleSound: toggleSound,
    toggleVibration: toggleVibration,
    toggleTheme: toggleTheme,
    confirmReset: confirmReset
  };
})();

window.App = App;
