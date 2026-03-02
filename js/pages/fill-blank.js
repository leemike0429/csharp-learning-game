var App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.FillBlank = (function() {
  let state = {};

  function initState(topicId, levelId) {
    const questions = App.Questions.getShuffledQuestions(topicId, levelId);
    state = {
      topicId: topicId,
      levelId: levelId,
      questions: questions,
      current: 0,
      score: 0,
      correct: 0,
      combo: 0,
      maxCombo: 0,
      attempts: 0,
      maxAttempts: 3,
      hintsUsed: 0,
      hintsLeft: 2,
      answered: false,
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
    if (!q) { finishGame(container); return; }

    state.answered = false;
    state.attempts = 0;

    const total = state.questions.length;

    container.innerHTML =
      '<div class="game-header">' +
        '<button class="header-btn" onclick="App.Pages.FillBlank.confirmExit()">&#10005;</button>' +
        '<span class="header-title">' + App.UI.escapeHtml(level.title) + '</span>' +
        '<span style="font-size:0.9rem">' + (state.current + 1) + '/' + total + '</span>' +
      '</div>' +
      '<div style="padding:0 16px 4px">' + App.UI.renderProgressBar(state.current, total) + '</div>' +
      '<div class="game-header" style="border:none;padding-top:0">' +
        '<span class="score-display">\u2B50 ' + state.score + '</span>' +
        (state.combo > 1 ? '<span class="combo">\u{1F525}x' + state.combo + '</span>' : '<span></span>') +
        '<span class="text-dim" style="font-size:0.85rem">嘗試 ' + state.attempts + '/' + state.maxAttempts + '</span>' +
      '</div>' +

      '<div class="page" style="padding-bottom:16px"><div class="page-content">' +
        '<div style="font-size:1.05rem;line-height:1.6;margin-bottom:16px">' + App.UI.escapeHtml(q.question) + '</div>' +
        (q.code ? App.UI.renderCodeBlock(q.code) + '<div style="height:16px"></div>' : '') +
        '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<input type="text" id="fill-input" class="fill-input" placeholder="請輸入答案..." autocomplete="off" autocapitalize="off" spellcheck="false">' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-ghost btn-sm" style="flex:1" id="hint-btn" onclick="App.Pages.FillBlank.useHint()">\u{1F4A1} 提示 (' + state.hintsLeft + ')</button>' +
            '<button class="btn btn-primary" style="flex:2" id="submit-btn" onclick="App.Pages.FillBlank.submitAnswer()">\u2705 確認送出</button>' +
          '</div>' +
        '</div>' +
        '<div id="feedback-area" style="margin-top:16px"></div>' +
      '</div></div>';

    const input = document.getElementById('fill-input');
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') App.Pages.FillBlank.submitAnswer();
      });
      setTimeout(function() { input.focus(); }, 300);
    }
  }

  function submitAnswer() {
    if (state.answered) return;
    const input = document.getElementById('fill-input');
    if (!input) return;

    const userAnswer = input.value.trim();
    if (!userAnswer) {
      App.UI.showToast('請輸入答案');
      return;
    }

    const q = state.questions[state.current];
    const blanks = q.blanks || [];
    const isCorrect = blanks.some(function(ans) {
      return userAnswer.toLowerCase().replace(/\s+/g, ' ') === ans.toLowerCase().replace(/\s+/g, ' ');
    });

    state.attempts++;

    if (isCorrect) {
      state.answered = true;
      state.correct++;
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;

      let points = 150;
      if (state.attempts > 1) points = 75;
      if (state.hintsUsed > 0) points = Math.max(50, points - 50);
      state.score += points;

      input.classList.add('correct');
      input.disabled = true;
      App.UI.vibrate(50);
      showFeedback(true, q, points);
    } else {
      state.combo = 0;
      input.classList.add('wrong');
      App.UI.vibrate([100, 50, 100]);

      if (state.attempts >= state.maxAttempts) {
        state.answered = true;
        input.disabled = true;
        showFeedback(false, q, 0);
      } else {
        setTimeout(function() {
          input.classList.remove('wrong');
          input.value = '';
          input.focus();
          // Update attempts display
          var attemptsEl = document.querySelector('.text-dim[style*="font-size:0.85rem"]');
          if (attemptsEl) attemptsEl.textContent = '嘗試 ' + state.attempts + '/' + state.maxAttempts;
        }, 500);
        App.UI.showToast('答案不正確，再試一次！（剩餘 ' + (state.maxAttempts - state.attempts) + ' 次）');
      }
    }
  }

  function showFeedback(isCorrect, question, points) {
    const area = document.getElementById('feedback-area');
    if (!area) return;

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.classList.add('hidden');
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) hintBtn.classList.add('hidden');

    const icon = isCorrect ? '\u2705' : '\u274C';
    const title = isCorrect ? '答對了！' : '答錯了';
    const correctAnswer = question.blanks ? question.blanks[0] : '';

    area.innerHTML = '<div class="card" style="border:2px solid ' + (isCorrect ? 'var(--success)' : 'var(--error)') + '">' +
      '<div style="text-align:center;margin-bottom:8px">' +
        '<span style="font-size:2rem">' + icon + '</span>' +
        '<div style="font-size:1.2rem;font-weight:700">' + title + '</div>' +
        (isCorrect ? '<div style="color:var(--accent)">+' + points + ' 分</div>' : '') +
        (!isCorrect ? '<div style="margin-top:8px">正確答案：<strong style="color:var(--success)">' + App.UI.escapeHtml(correctAnswer) + '</strong></div>' : '') +
      '</div>' +
      '<div style="font-size:0.9rem;color:var(--text-dim);line-height:1.5">' +
        App.UI.escapeHtml(question.explanation) +
      '</div>' +
      '<div style="text-align:center;margin-top:12px">' +
        '<button class="btn btn-primary" onclick="App.Pages.FillBlank.nextQuestion()">' +
          (state.current >= state.questions.length - 1 ? '\u{1F3C6} 查看結果' : '\u25B6 下一題') +
        '</button>' +
      '</div>' +
    '</div>';

    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function nextQuestion() {
    const container = document.getElementById('app');
    const level = App.Questions.getLevel(state.topicId, state.levelId);

    if (state.current >= state.questions.length - 1) {
      finishGame(container);
      return;
    }

    state.current++;
    state.hintsUsed = 0;
    renderQuestion(container, level);
  }

  function finishGame(container) {
    const total = state.questions.length;
    const correctRate = total > 0 ? state.correct / total : 0;
    const stars = App.Store.getStars(correctRate);
    const elapsed = Math.round((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const result = {
      score: state.score,
      correct: state.correct,
      total: total,
      stars: stars,
      bestStreak: state.maxCombo
    };

    const { expGained, isFirstClear } = App.Store.saveLevelResult('fillBlank', state.topicId, state.levelId, result);
    const newAchievements = App.Achievements.checkAll();

    App.Router.navigate('result', {
      id: state.levelId,
      extra: state.topicId,
      result: result,
      expGained: expGained,
      isFirstClear: isFirstClear,
      time: minutes + ':' + (seconds < 10 ? '0' : '') + seconds,
      mode: 'fillBlank',
      newAchievements: newAchievements
    });
  }

  function useHint() {
    if (state.hintsLeft <= 0 || state.answered) return;
    state.hintsLeft--;
    state.hintsUsed++;

    const q = state.questions[state.current];
    const hint = q.hint || (q.blanks && q.blanks[0] ? '首字母：' + q.blanks[0][0] : '');
    App.UI.showToast(hint);

    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
      if (state.hintsLeft <= 0) {
        hintBtn.classList.add('hidden');
      } else {
        hintBtn.innerHTML = '\u{1F4A1} 提示 (' + state.hintsLeft + ')';
      }
    }
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
    submitAnswer: submitAnswer,
    nextQuestion: nextQuestion,
    useHint: useHint,
    confirmExit: confirmExit
  };
})();

window.App = App;
