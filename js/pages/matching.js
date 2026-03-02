var App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.Matching = (function() {
  let state = {};
  var PAIR_COLORS = [
    { border: '#00b894', bg: 'rgba(0,184,148,0.18)' },
    { border: '#6c5ce7', bg: 'rgba(108,92,231,0.18)' },
    { border: '#e17055', bg: 'rgba(225,112,85,0.18)' },
    { border: '#fdcb6e', bg: 'rgba(253,203,110,0.18)' },
    { border: '#0984e3', bg: 'rgba(9,132,227,0.18)' },
    { border: '#e84393', bg: 'rgba(232,67,147,0.18)' },
    { border: '#00cec9', bg: 'rgba(0,206,201,0.18)' },
    { border: '#fd79a8', bg: 'rgba(253,121,168,0.18)' }
  ];

  function initState(topicId, levelId) {
    const questions = App.Questions.getShuffledQuestions(topicId, levelId);
    state = {
      topicId: topicId,
      levelId: levelId,
      questions: questions,
      current: 0,
      totalScore: 0,
      totalCorrect: 0,
      maxCombo: 0,
      startTime: Date.now()
    };
  }

  function render(container, params) {
    const levelId = params.id;
    const topicId = params.extra;
    if (!topicId || !levelId) { App.Router.navigate('home'); return; }

    const level = App.Questions.getLevel(topicId, levelId);
    if (!level) { App.Router.navigate('home'); return; }

    initState(topicId, levelId);
    renderQuestion(container, level);
  }

  function renderQuestion(container, level) {
    const q = state.questions[state.current];
    if (!q || !q.pairs) { finishGame(container); return; }

    const total = state.questions.length;

    state.matched = 0;
    state.errors = 0;
    state.selectedLeft = null;
    state.selectedRight = null;
    state.matchedPairs = {};
    state.questionStart = Date.now();

    const leftItems = q.pairs.map(function(p, i) { return { text: p.left, idx: i }; });
    const rightItems = App.Questions.shuffle(q.pairs.map(function(p, i) { return { text: p.right, idx: i }; }));

    let leftHtml = '';
    leftItems.forEach(function(item) {
      leftHtml += '<div class="match-card" data-side="left" data-idx="' + item.idx + '">' +
        '<code>' + App.UI.escapeHtml(item.text) + '</code></div>';
    });

    let rightHtml = '';
    rightItems.forEach(function(item) {
      rightHtml += '<div class="match-card" data-side="right" data-idx="' + item.idx + '">' +
        App.UI.escapeHtml(item.text) + '</div>';
    });

    container.innerHTML =
      '<div class="game-header">' +
        '<button class="header-btn" onclick="App.Pages.Matching.confirmExit()">&#10005;</button>' +
        '<span class="header-title">' + App.UI.escapeHtml(level.title) + '</span>' +
        '<span style="font-size:0.9rem">' + (state.current + 1) + '/' + total + '</span>' +
      '</div>' +
      '<div class="game-header" style="border:none;padding-top:0">' +
        '<span id="match-count">已配對：0/' + q.pairs.length + '</span>' +
        '<span class="score-display">\u2B50 ' + state.totalScore + '</span>' +
        '<span id="error-count" class="text-dim">錯誤：0</span>' +
      '</div>' +

      '<div class="page" style="padding-bottom:16px"><div class="page-content">' +
        '<div style="font-size:0.95rem;margin-bottom:12px;color:var(--text-dim)">' + App.UI.escapeHtml(q.question) + '</div>' +
        '<div class="match-container" id="match-area">' +
          '<div class="match-column" id="left-col">' + leftHtml + '</div>' +
          '<div class="match-column" id="right-col">' + rightHtml + '</div>' +
        '</div>' +
        '<div id="match-feedback" style="margin-top:16px"></div>' +
      '</div></div>';

    const matchArea = document.getElementById('match-area');
    if (matchArea) {
      matchArea.addEventListener('click', function(e) {
        const card = e.target.closest('.match-card');
        if (!card || card.classList.contains('matched')) return;

        const side = card.dataset.side;
        const idx = parseInt(card.dataset.idx);

        if (side === 'left') {
          clearSelection('left');
          card.classList.add('selected');
          state.selectedLeft = idx;
        } else {
          clearSelection('right');
          card.classList.add('selected');
          state.selectedRight = idx;
        }

        if (state.selectedLeft !== null && state.selectedRight !== null) {
          checkMatch();
        }
      });
    }
  }

  function clearSelection(side) {
    const col = document.getElementById(side === 'left' ? 'left-col' : 'right-col');
    if (!col) return;
    col.querySelectorAll('.match-card').forEach(function(c) {
      c.classList.remove('selected', 'wrong');
    });
  }

  function checkMatch() {
    const q = state.questions[state.current];
    const isCorrect = state.selectedLeft === state.selectedRight;

    const leftCards = document.querySelectorAll('[data-side="left"]');
    const rightCards = document.querySelectorAll('[data-side="right"]');

    let leftCard = null, rightCard = null;
    leftCards.forEach(function(c) {
      if (parseInt(c.dataset.idx) === state.selectedLeft) leftCard = c;
    });
    rightCards.forEach(function(c) {
      if (parseInt(c.dataset.idx) === state.selectedRight) rightCard = c;
    });

    if (isCorrect) {
      var color = PAIR_COLORS[state.matched % PAIR_COLORS.length];
      if (leftCard) {
        leftCard.classList.remove('selected');
        leftCard.classList.add('matched');
        leftCard.style.borderColor = color.border;
        leftCard.style.background = color.bg;
        leftCard.style.opacity = '1';
      }
      if (rightCard) {
        rightCard.classList.remove('selected');
        rightCard.classList.add('matched');
        rightCard.style.borderColor = color.border;
        rightCard.style.background = color.bg;
        rightCard.style.opacity = '1';
      }
      state.matched++;
      state.matchedPairs[state.selectedLeft] = true;
      App.UI.vibrate(50);

      var countEl = document.getElementById('match-count');
      if (countEl) countEl.textContent = '已配對：' + state.matched + '/' + q.pairs.length;

      if (state.matched >= q.pairs.length) {
        setTimeout(function() { onQuestionComplete(); }, 500);
      }
    } else {
      if (leftCard) { leftCard.classList.remove('selected'); leftCard.classList.add('wrong'); }
      if (rightCard) { rightCard.classList.remove('selected'); rightCard.classList.add('wrong'); }
      state.errors++;
      App.UI.vibrate([100, 50, 100]);

      var errEl = document.getElementById('error-count');
      if (errEl) errEl.textContent = '錯誤：' + state.errors;

      setTimeout(function() {
        if (leftCard) leftCard.classList.remove('wrong');
        if (rightCard) rightCard.classList.remove('wrong');
      }, 500);
    }

    state.selectedLeft = null;
    state.selectedRight = null;
  }

  function onQuestionComplete() {
    const q = state.questions[state.current];
    const config = App.Store.getConfig();
    const elapsed = Math.round((Date.now() - state.questionStart) / 1000);

    let score = config.MATCH_BASE_SCORE;
    score -= state.errors * config.MATCH_ERROR_PENALTY;
    if (state.errors === 0) score += config.MATCH_PERFECT_BONUS;
    score = Math.max(0, score);

    state.totalScore += score;
    state.totalCorrect++;

    const area = document.getElementById('match-feedback');
    if (area) {
      area.innerHTML = '<div class="card" style="border:2px solid var(--success);text-align:center">' +
        '<span style="font-size:2rem">\u2705</span>' +
        '<div style="font-size:1.1rem;font-weight:700">配對完成！</div>' +
        '<div style="color:var(--accent)">+' + score + ' 分' + (state.errors === 0 ? ' (完美!)' : '') + '</div>' +
        '<div style="font-size:0.85rem;color:var(--text-dim);margin-top:4px">花費 ' + elapsed + ' 秒，錯誤 ' + state.errors + ' 次</div>' +
        (q.explanation ? '<div style="font-size:0.85rem;color:var(--text-dim);margin-top:8px">' + App.UI.escapeHtml(q.explanation) + '</div>' : '') +
        '<div style="margin-top:12px">' +
          '<button class="btn btn-primary" onclick="App.Pages.Matching.nextQuestion()">' +
            (state.current >= state.questions.length - 1 ? '\u{1F3C6} 查看結果' : '\u25B6 下一組') +
          '</button>' +
        '</div>' +
      '</div>';
    }
  }

  function nextQuestion() {
    const container = document.getElementById('app');
    const level = App.Questions.getLevel(state.topicId, state.levelId);

    if (state.current >= state.questions.length - 1) {
      finishGame(container);
      return;
    }

    state.current++;
    renderQuestion(container, level);
  }

  function finishGame(container) {
    const total = state.questions.length;
    const correctRate = total > 0 ? state.totalCorrect / total : 0;
    const stars = App.Store.getStars(correctRate);
    const elapsed = Math.round((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const result = {
      score: state.totalScore,
      correct: state.totalCorrect,
      total: total,
      stars: stars,
      bestStreak: state.maxCombo
    };

    const { expGained, isFirstClear } = App.Store.saveLevelResult('matching', state.topicId, state.levelId, result);
    const newAchievements = App.Achievements.checkAll();

    App.Router.navigate('result', {
      id: state.levelId,
      extra: state.topicId,
      result: result,
      expGained: expGained,
      isFirstClear: isFirstClear,
      time: minutes + ':' + (seconds < 10 ? '0' : '') + seconds,
      mode: 'matching',
      newAchievements: newAchievements
    });
  }

  function confirmExit() {
    App.UI.showModal(
      '\u{1F6D1} 確定離開？',
      '<div class="text-center text-dim">離開後此次進度不會被儲存</div>',
      [
        { text: '繼續挑戰', class: 'btn-primary', onClick: function() {} },
        { text: '離開', class: 'btn-ghost', onClick: function() { App.Router.navigate('home'); } }
      ]
    );
  }

  return {
    render: render,
    nextQuestion: nextQuestion,
    confirmExit: confirmExit
  };
})();

window.App = App;
