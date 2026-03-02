const App = window.App || {};

App.Questions = (function() {
  function getAllTopics() {
    return [
      App.QuestionsBasics,
      App.QuestionsOOP,
      App.QuestionsAdvanced,
      App.QuestionsDotnet
    ].filter(Boolean);
  }

  function getTopic(topicId) {
    return getAllTopics().find(function(t) { return t.topic === topicId; });
  }

  function getTopicIds() {
    return getAllTopics().map(function(t) { return t.topic; });
  }

  function getLevels(topicId) {
    var topic = getTopic(topicId);
    return topic ? topic.levels : [];
  }

  function getLevel(topicId, levelId) {
    var levels = getLevels(topicId);
    return levels.find(function(l) { return l.id === levelId; });
  }

  function getQuestions(topicId, levelId) {
    var level = getLevel(topicId, levelId);
    return level ? level.questions : [];
  }

  function getLevelsByMode(topicId, mode) {
    var levels = getLevels(topicId);
    return levels.filter(function(l) {
      return l.mode === mode;
    });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }
    return a;
  }

  function getShuffledQuestions(topicId, levelId) {
    return shuffle(getQuestions(topicId, levelId));
  }

  function getTotalQuestionCount() {
    var count = 0;
    getAllTopics().forEach(function(topic) {
      topic.levels.forEach(function(level) {
        count += level.questions.length;
      });
    });
    return count;
  }

  return {
    getAllTopics: getAllTopics,
    getTopic: getTopic,
    getTopicIds: getTopicIds,
    getLevels: getLevels,
    getLevel: getLevel,
    getQuestions: getQuestions,
    getLevelsByMode: getLevelsByMode,
    getShuffledQuestions: getShuffledQuestions,
    shuffle: shuffle,
    getTotalQuestionCount: getTotalQuestionCount
  };
})();

window.App = App;
