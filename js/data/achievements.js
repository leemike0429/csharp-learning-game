var App = window.App || {};

App.Achievements = (function() {
  const LIST = [
    { id: 'first-correct', name: '初試啼聲', icon: '\u{1F3AF}', desc: '答對第一道題目' },
    { id: 'first-clear', name: '闖關新手', icon: '\u2B50', desc: '完成第一個關卡' },
    { id: 'streak-5', name: '小試身手', icon: '\u{1F525}', desc: '連續答對 5 題' },
    { id: 'streak-10', name: '勢如破竹', icon: '\u{1F4A5}', desc: '連續答對 10 題' },
    { id: 'streak-25', name: '不可阻擋', icon: '\u26A1', desc: '連續答對 25 題' },
    { id: 'basics-master', name: '基礎達人', icon: '\u{1F4DA}', desc: '完成所有基礎語法關卡' },
    { id: 'oop-master', name: 'OOP 大師', icon: '\u{1F3D7}\u{FE0F}', desc: '完成所有物件導向關卡' },
    { id: 'advanced-master', name: '進階高手', icon: '\u{1F680}', desc: '完成所有進階主題關卡' },
    { id: 'perfect-level', name: '完美通關', icon: '\u{1F48E}', desc: '任一關卡取得三顆星' },
    { id: 'all-modes', name: '全方位玩家', icon: '\u{1F3AE}', desc: '三種遊戲模式各完成至少一次' },
    { id: 'daily-7', name: '持之以恆', icon: '\u{1F4C5}', desc: '連續 7 天登入學習' },
    { id: 'total-100', name: '百題斬', icon: '\u{1F3C6}', desc: '累計答對 100 題' },
    { id: 'total-500', name: '五百強', icon: '\u{1F451}', desc: '累計答對 500 題' },
    { id: 'total-1000', name: '千題霸主', icon: '\u{1F947}', desc: '累計答對 1000 題' },
    { id: 'speed-demon', name: '神速解題', icon: '\u23F1\u{FE0F}', desc: '在 5 秒內答對一題' }
  ];

  function checkAll() {
    const stats = App.Store.getStats();
    const achievements = App.Store.getAchievements();
    const newlyUnlocked = [];

    function check(id, condition) {
      if (!achievements[id] && condition) {
        if (App.Store.unlockAchievement(id)) {
          const ach = LIST.find(function(a) { return a.id === id; });
          if (ach) newlyUnlocked.push(ach);
        }
      }
    }

    check('first-correct', stats.totalCorrect >= 1);
    check('total-100', stats.totalCorrect >= 100);
    check('total-500', stats.totalCorrect >= 500);
    check('total-1000', stats.totalCorrect >= 1000);
    check('streak-5', stats.bestStreak >= 5);
    check('streak-10', stats.bestStreak >= 10);
    check('streak-25', stats.bestStreak >= 25);
    check('daily-7', stats.dailyStreak >= 7);

    // Check level completions
    var progress = App.Store.getState().progress;
    var hasAnyClear = false;
    var hasQuiz = false, hasFill = false, hasMatch = false;

    ['quiz', 'fillBlank', 'matching'].forEach(function(mode) {
      if (progress[mode]) {
        Object.keys(progress[mode]).forEach(function(topic) {
          Object.values(progress[mode][topic]).forEach(function(p) {
            if (p.completed) {
              hasAnyClear = true;
              if (mode === 'quiz') hasQuiz = true;
              if (mode === 'fillBlank') hasFill = true;
              if (mode === 'matching') hasMatch = true;
              if (p.stars >= 3) check('perfect-level', true);
            }
          });
        });
      }
    });

    check('first-clear', hasAnyClear);
    check('all-modes', hasQuiz && hasFill && hasMatch);

    return newlyUnlocked;
  }

  return { LIST: LIST, checkAll: checkAll };
})();

window.App = App;
