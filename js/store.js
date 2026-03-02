var App = window.App || {};

App.Store = (function() {
  const STORAGE_KEY = 'csharp-game-state';

  const DEFAULT_STATE = {
    profile: {
      nickname: '學習者',
      createdAt: null,
      lastPlayedAt: null
    },
    stats: {
      totalScore: 0,
      level: 1,
      exp: 0,
      streak: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      dailyStreak: 0,
      lastLoginDate: null
    },
    progress: {
      quiz: {},
      fillBlank: {},
      matching: {}
    },
    achievements: {},
    settings: {
      soundEnabled: true,
      vibrationEnabled: true,
      theme: 'dark'
    }
  };

  const GAME_CONFIG = {
    MAX_LIVES: 3,
    BASE_SCORE: 100,
    COMBO_BONUS: 20,
    HINT_PENALTY: 30,
    TIME_BONUS_THRESHOLD: 10,
    TIME_BONUS: 50,
    FILL_BASE_SCORE: 150,
    MATCH_BASE_SCORE: 500,
    MATCH_TIME_BONUS: 10,
    MATCH_ERROR_PENALTY: 20,
    MATCH_PERFECT_BONUS: 200,
    STAR_THRESHOLDS: { 1: 0.6, 2: 0.8, 3: 1.0 },
    EXP_PER_CORRECT: 10,
    EXP_LEVEL_COMPLETE: 50,
    EXP_THREE_STARS: 30,
    LEVEL_BASE_EXP: 100,
    LEVEL_EXP_INCREMENT: 50
  };

  let state = null;
  let listeners = [];
  let saveTimer = null;

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        state = JSON.parse(saved);
        // Merge with defaults for new fields
        state = deepMerge(DEFAULT_STATE, state);
      } catch (e) {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    } else {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      state.profile.createdAt = new Date().toISOString();
    }
    checkDailyLogin();
    save();
  }

  function deepMerge(defaults, obj) {
    const result = { ...defaults };
    for (const key of Object.keys(obj)) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && defaults[key]) {
        result[key] = deepMerge(defaults[key], obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 300);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function notify() {
    listeners.forEach(fn => fn(state));
  }

  function checkDailyLogin() {
    const today = new Date().toISOString().split('T')[0];
    const last = state.stats.lastLoginDate;
    if (last !== today) {
      if (last) {
        const lastDate = new Date(last);
        const todayDate = new Date(today);
        const diff = (todayDate - lastDate) / (1000 * 60 * 60 * 24);
        state.stats.dailyStreak = diff <= 1 ? state.stats.dailyStreak + 1 : 1;
      } else {
        state.stats.dailyStreak = 1;
      }
      state.stats.lastLoginDate = today;
      save();
    }
  }

  function expToNextLevel(level) {
    return GAME_CONFIG.LEVEL_BASE_EXP + (level - 1) * GAME_CONFIG.LEVEL_EXP_INCREMENT;
  }

  function addExp(amount) {
    state.stats.exp += amount;
    let needed = expToNextLevel(state.stats.level);
    while (state.stats.exp >= needed) {
      state.stats.exp -= needed;
      state.stats.level++;
      needed = expToNextLevel(state.stats.level);
    }
    save();
    notify();
    return state.stats.level;
  }

  function calculateQuizScore(isCorrect, combo, timeElapsed, usedHint) {
    if (!isCorrect) return 0;
    let score = GAME_CONFIG.BASE_SCORE;
    score += GAME_CONFIG.COMBO_BONUS * (combo - 1);
    if (timeElapsed <= GAME_CONFIG.TIME_BONUS_THRESHOLD) {
      score += GAME_CONFIG.TIME_BONUS;
    }
    if (usedHint) {
      score -= GAME_CONFIG.HINT_PENALTY;
    }
    return Math.max(0, score);
  }

  function getStars(correctRate) {
    if (correctRate >= GAME_CONFIG.STAR_THRESHOLDS[3]) return 3;
    if (correctRate >= GAME_CONFIG.STAR_THRESHOLDS[2]) return 2;
    if (correctRate >= GAME_CONFIG.STAR_THRESHOLDS[1]) return 1;
    return 0;
  }

  function saveLevelResult(mode, topic, levelId, result) {
    if (!state.progress[mode]) state.progress[mode] = {};
    if (!state.progress[mode][topic]) state.progress[mode][topic] = {};

    const existing = state.progress[mode][topic][levelId] || {};
    const isFirstClear = !existing.completed;

    state.progress[mode][topic][levelId] = {
      completed: true,
      bestScore: Math.max(existing.bestScore || 0, result.score),
      stars: Math.max(existing.stars || 0, result.stars),
      attempts: (existing.attempts || 0) + 1,
      lastAttempt: new Date().toISOString()
    };

    state.stats.totalCorrect += result.correct;
    state.stats.totalAnswered += result.total;
    state.stats.totalScore += result.score;
    if (result.bestStreak > state.stats.bestStreak) {
      state.stats.bestStreak = result.bestStreak;
    }
    state.profile.lastPlayedAt = new Date().toISOString();

    let expGained = result.correct * GAME_CONFIG.EXP_PER_CORRECT;
    if (isFirstClear) expGained += GAME_CONFIG.EXP_LEVEL_COMPLETE;
    if (result.stars === 3) expGained += GAME_CONFIG.EXP_THREE_STARS;

    addExp(expGained);
    save();
    notify();

    return { expGained, isFirstClear };
  }

  function getLevelProgress(mode, topic, levelId) {
    return (state.progress[mode] && state.progress[mode][topic] && state.progress[mode][topic][levelId]) || null;
  }

  function getTopicProgress(mode, topic) {
    return (state.progress[mode] && state.progress[mode][topic]) || {};
  }

  function isLevelUnlocked(mode, topic, levelIndex, levels) {
    if (levelIndex === 0) return true;
    const prevLevel = levels[levelIndex - 1];
    const prevProgress = getLevelProgress(mode, topic, prevLevel.id);
    return prevProgress && prevProgress.completed;
  }

  function isTopicUnlocked() {
    return true;
  }

  function unlockAchievement(id) {
    if (state.achievements[id]) return false;
    state.achievements[id] = { unlockedAt: new Date().toISOString() };
    save();
    notify();
    return true;
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    state.profile.createdAt = new Date().toISOString();
    save();
    notify();
  }

  return {
    init,
    getState: () => state,
    getStats: () => state.stats,
    getProfile: () => state.profile,
    getSettings: () => state.settings,
    getAchievements: () => state.achievements,
    getConfig: () => GAME_CONFIG,
    getLevelProgress,
    getTopicProgress,
    isLevelUnlocked,
    isTopicUnlocked,
    saveLevelResult,
    addExp,
    calculateQuizScore,
    getStars,
    expToNextLevel,
    unlockAchievement,
    updateSettings(updates) {
      Object.assign(state.settings, updates);
      save();
      notify();
    },
    onChange(fn) { listeners.push(fn); },
    offChange(fn) { listeners = listeners.filter(l => l !== fn); },
    resetAll,
    saveNow
  };
})();

window.App = App;
