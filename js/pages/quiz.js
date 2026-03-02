var App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.Quiz = (function() {
  let state = {};

  function initState(topicId, levelId) {
    const questions = App.Questions.getShuffledQuestions(topicId, levelId);
    const config = App.Store.getConfig();
    state = {
      topicId: topicId,
      levelId: levelId,
      questions: questions,
      current: 0,
      lives: config.MAX_LIVES,
      maxLives: config.MAX_LIVES,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correct: 0,
      hintsUsed: 0,
      hintsLeft: 2,
      answered: false,
      questionStartTime: Date.now(),
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

    const total = state.questions.length;
    const pct = Math.round((state.current / total) * 100);

    // Shuffle options but track correct answer
    const optionIndices = [];
    for (var i = 0; i < q.options.length; i++) optionIndices.push(i);
    const shuffled = App.Questions.shuffle(optionIndices);
    state._shuffledIndices = shuffled;

    let optionsHtml = '';
    const labels = ['A', 'B', 'C', 'D'];
    shuffled.forEach(function(origIdx, displayIdx) {
      optionsHtml += '<button class="option-btn" data-idx="' + origIdx + '" id="opt-' + displayIdx + '">' +
        '<span class="option-label">' + labels[displayIdx] + '</span>' +
        '<span>' + App.UI.escapeHtml(q.options[origIdx]) + '</span>' +
      '</button>';
    });

    container.innerHTML =
      // Game Header
      '<div class="game-header">' +
        '<button class="header-btn" onclick="App.Pages.Quiz.confirmExit()">&#10005;</button>' +
        '<span class="header-title">' + App.UI.escapeHtml(level ? level.title : '') + '</span>' +
        '<span style="font-size:0.9rem">' + (state.current + 1) + '/' + total + '</span>' +
      '</div>' +
      '<div style="padding:0 16px 4px">' + App.UI.renderProgressBar(state.current, total) + '</div>' +
      '<div class="game-header" style="border:none;padding-top:0">' +
        App.UI.renderLives(state.lives, state.maxLives) +
        '<span class="score-display">\u2B50 ' + state.score + '</span>' +
        (state.combo > 1 ? '<span class="combo">\u{1F525}x' + state.combo + '</span>' : '<span></span>') +
      '</div>' +

      // Question Area
      '<div class="page" style="padding-bottom:16px"><div class="page-content">' +
        '<div style="font-size:1.05rem;line-height:1.6;margin-bottom:16px">' + App.UI.escapeHtml(q.question) + '</div>' +
        (q.code ? App.UI.renderCodeBlock(q.code) + '<div style="height:16px"></div>' : '') +
        '<div style="display:flex;flex-direction:column;gap:10px" id="options-container">' +
          optionsHtml +
        '</div>' +
        '<div style="text-align:center;margin-top:16px">' +
          (state.hintsLeft > 0 && !state.answered ?
            '<button class="btn btn-ghost btn-sm" onclick="App.Pages.Quiz.useHint()">\u{1F4A1} 提示 (剩餘 ' + state.hintsLeft + ' 次)</button>' : '') +
        '</div>' +
        '<div id="feedback-area" style="margin-top:16px"></div>' +
      '</div></div>';

    state.answered = false;
    state.questionStartTime = Date.now();

    // Bind click events
    const optContainer = document.getElementById('options-container');
    if (optContainer) {
      optContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('.option-btn');
        if (btn && !state.answered) {
          handleAnswer(parseInt(btn.dataset.idx), container, level);
        }
      });
    }
  }

  function handleAnswer(selectedIdx, container, level) {
    if (state.answered) return;
    state.answered = true;

    const q = state.questions[state.current];
    const isCorrect = selectedIdx === q.answer;
    const elapsed = (Date.now() - state.questionStartTime) / 1000;

    // Highlight buttons
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(function(btn) {
      btn.style.pointerEvents = 'none';
      const idx = parseInt(btn.dataset.idx);
      if (idx === q.answer) btn.classList.add('correct');
      if (idx === selectedIdx && !isCorrect) btn.classList.add('wrong');
    });

    if (isCorrect) {
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      state.correct++;
      const points = App.Store.calculateQuizScore(true, state.combo, elapsed, state.hintsUsed > 0);
      state.score += points;
      App.UI.vibrate(50);
      showFeedback(true, q, points, container, level);
    } else {
      state.combo = 0;
      state.lives--;
      App.UI.vibrate([100, 50, 100]);
      showFeedback(false, q, 0, container, level);
    }
  }

  function showFeedback(isCorrect, question, points, container, level) {
    const area = document.getElementById('feedback-area');
    if (!area) return;

    const icon = isCorrect ? '\u2705' : '\u274C';
    const title = isCorrect ? '答對了！' : '答錯了';
    const pointsText = isCorrect ? '+' + points + ' 分' : '';

    area.innerHTML = '<div class="card" style="border:2px solid ' + (isCorrect ? 'var(--success)' : 'var(--error)') + '">' +
      '<div style="text-align:center;margin-bottom:8px">' +
        '<span style="font-size:2rem">' + icon + '</span>' +
        '<div style="font-size:1.2rem;font-weight:700">' + title + '</div>' +
        (pointsText ? '<div style="color:var(--accent)">' + pointsText + '</div>' : '') +
        (!isCorrect ? '<div style="color:var(--error);font-size:0.9rem">\u2764\uFE0F -1</div>' : '') +
      '</div>' +
      '<div style="font-size:0.9rem;color:var(--text-dim);line-height:1.5">' +
        App.UI.escapeHtml(question.explanation) +
      '</div>' +
      '<div style="text-align:center;margin-top:12px">' +
        '<button class="btn btn-primary" onclick="App.Pages.Quiz.nextQuestion()">' +
          (state.lives <= 0 ? '\u{1F3E0} 查看結果' :
           state.current >= state.questions.length - 1 ? '\u{1F3C6} 查看結果' : '\u25B6 下一題') +
        '</button>' +
      '</div>' +
    '</div>';

    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function nextQuestion() {
    const container = document.getElementById('app');
    const level = App.Questions.getLevel(state.topicId, state.levelId);

    if (state.lives <= 0 || state.current >= state.questions.length - 1) {
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

    const { expGained, isFirstClear } = App.Store.saveLevelResult('quiz', state.topicId, state.levelId, result);

    // Check achievements
    const newAchievements = App.Achievements.checkAll();

    App.Router.navigate('result', {
      id: state.levelId,
      extra: state.topicId,
      result: result,
      expGained: expGained,
      isFirstClear: isFirstClear,
      time: minutes + ':' + (seconds < 10 ? '0' : '') + seconds,
      mode: 'quiz',
      newAchievements: newAchievements
    });
  }

  function useHint() {
    if (state.hintsLeft <= 0 || state.answered) return;
    state.hintsLeft--;
    state.hintsUsed++;

    const q = state.questions[state.current];
    // Remove one wrong option
    const wrongIndices = state._shuffledIndices.filter(function(idx) { return idx !== q.answer; });
    if (wrongIndices.length > 0) {
      const removeIdx = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      const btns = document.querySelectorAll('.option-btn');
      btns.forEach(function(btn) {
        if (parseInt(btn.dataset.idx) === removeIdx) {
          btn.style.opacity = '0.2';
          btn.style.pointerEvents = 'none';
        }
      });
    }

    // Update hint button
    const hintBtns = document.querySelectorAll('.btn-ghost');
    hintBtns.forEach(function(btn) {
      if (state.hintsLeft <= 0) {
        btn.classList.add('hidden');
      } else {
        btn.innerHTML = '\u{1F4A1} 提示 (剩餘 ' + state.hintsLeft + ' 次)';
      }
    });

    App.UI.showToast('已消除一個錯誤選項');
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
    useHint: useHint,
    confirmExit: confirmExit
  };
})();

window.App = App;
