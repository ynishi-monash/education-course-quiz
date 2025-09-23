class QuizApp {
  constructor() {
    this.questionsData = null;
    this.programsData = null;
    this.configData = null;
    this.currentQuestionId = null;
    this.selectedAnswer = null;
    this.history = [];
    this.progressWeights = {};
    this.feedbackTimeout = null;
    this.userName = '';
    this.userYear = '';
    
    this.init();
  }

  async init() {
    try {
      await this.loadData();
      this.bindEvents();
      this.showWelcome();
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
      this.showError('Failed to load quiz data. Please refresh the page.');
    }
  }

  async loadData() {
    try {
      const [questionsResponse, programsResponse, configResponse] = await Promise.all([
        fetch('questions.json'),
        fetch('programs.json'),
        fetch('config.json')
      ]);

      if (!questionsResponse.ok || !programsResponse.ok || !configResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      this.questionsData = await questionsResponse.json();
      this.programsData = await programsResponse.json();
      this.configData = await configResponse.json();
      this.progressWeights = this.questionsData.meta.progressWeights;
    } catch (error) {
      throw new Error('Data loading failed: ' + error.message);
    }
  }

  bindEvents() {
    const backBtn = document.getElementById('backBtn');
    const startOverBtn = document.getElementById('startOverBtn');
    const feedbackContinueBtn = document.getElementById('feedbackContinueBtn');
    const nameForm = document.getElementById('nameForm');
    const parentContinueBtn = document.getElementById('parentContinueBtn');

    backBtn.addEventListener('click', () => this.handleBack());
    startOverBtn.addEventListener('click', () => this.showWelcome());
    feedbackContinueBtn.addEventListener('click', () => {
      this.hideFeedback();
      this.proceedToNext();
    });
    
    nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNameSubmit();
    });

    parentContinueBtn.addEventListener('click', () => {
      this.startQuiz();
    });

    // Year selection event listeners
    document.addEventListener('click', (e) => {
      const yearOption = e.target.closest('.year-option');
      if (yearOption) {
        this.handleYearSelection(yearOption.dataset.year);
      }
    });
    
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      const resultCard = document.getElementById('resultCard');
      const feedbackOverlay = document.getElementById('feedbackOverlay');
      
      if (feedbackOverlay.classList.contains('visible')) {
        this.hideFeedback();
        this.proceedToNext();
      } else if (!resultCard.classList.contains('hidden')) {
        this.startQuiz();
      }
    }
  }

  showWelcome() {
    const welcomeCard = document.getElementById('welcomeCard');
    const questionCard = document.getElementById('questionCard');
    const resultCard = document.getElementById('resultCard');
    const nameInput = document.getElementById('nameInput');
    
    welcomeCard.classList.remove('hidden');
    questionCard.classList.add('hidden');
    resultCard.classList.add('hidden');
    
    this.updateProgress(0);
    nameInput.focus();
  }

  handleNameSubmit() {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    
    if (name) {
      this.userName = name;
      this.showYearSelection();
    }
  }

  showYearSelection() {
    const welcomeCard = document.getElementById('welcomeCard');
    const yearCard = document.getElementById('yearCard');
    const yearTitle = document.getElementById('yearTitle');
    
    welcomeCard.classList.add('hidden');
    yearCard.classList.remove('hidden');
    
    yearTitle.textContent = `Thanks, ${this.userName}! 📚`;
    
    // Focus first year option
    const firstYearOption = document.querySelector('.year-option');
    if (firstYearOption) {
      firstYearOption.focus();
    }
  }

  handleYearSelection(year) {
    this.userYear = year;
    
    if (year === 'parent') {
      this.showParentMessage();
    } else {
      this.startQuiz();
    }
  }

  showParentMessage() {
    const yearCard = document.getElementById('yearCard');
    const parentMessageCard = document.getElementById('parentMessageCard');
    
    yearCard.classList.add('hidden');
    parentMessageCard.classList.remove('hidden');
    
    const parentContinueBtn = document.getElementById('parentContinueBtn');
    parentContinueBtn.focus();
  }

  startQuiz() {
    this.currentQuestionId = 'q_age_group';
    this.selectedAnswer = null;
    this.history = [];
    this.updateProgress(0);
    this.showQuestion();
  }

  showQuestion() {
    const question = this.questionsData.questions.find(q => q.id === this.currentQuestionId);
    
    if (!question) {
      this.showError('Question not found');
      return;
    }

    const welcomeCard = document.getElementById('welcomeCard');
    const yearCard = document.getElementById('yearCard');
    const parentMessageCard = document.getElementById('parentMessageCard');
    const questionCard = document.getElementById('questionCard');
    const resultCard = document.getElementById('resultCard');
    
    welcomeCard.classList.add('hidden');
    yearCard.classList.add('hidden');
    parentMessageCard.classList.add('hidden');
    questionCard.classList.remove('hidden');
    resultCard.classList.add('hidden');

    this.renderQuestion(question);
    this.updateBackButton();
    this.selectedAnswer = null;
  }

  renderQuestion(question) {
    const questionText = document.getElementById('questionText');
    const questionSubtitle = document.getElementById('questionSubtitle');
    const optionsContainer = document.getElementById('optionsContainer');

    questionText.textContent = question.text;
    questionSubtitle.textContent = question.subtitle || '';
    questionSubtitle.style.display = question.subtitle ? 'block' : 'none';

    optionsContainer.innerHTML = '';
    optionsContainer.className = `options-container options-${question.ui}`;

    question.options.forEach((option, index) => {
      const optionElement = this.createOptionElement(option, question.ui, index);
      optionsContainer.appendChild(optionElement);
    });
  }

  createOptionElement(option, uiType, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `option ${uiType}`;
    button.setAttribute('data-option-id', option.id);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.setAttribute('tabindex', index === 0 ? '0' : '-1');

    // Extract emoji/icon and text from label
    const labelText = option.label;
    const emojiMatch = labelText.match(/^([^\w\s]+)\s*(.+)$/);
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'option-icon';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'option-text';
    
    if (emojiMatch) {
      // Map emojis to Font Awesome icons
      const emoji = emojiMatch[1].trim();
      const fontAwesomeIcon = this.mapEmojiToFontAwesome(emoji);
      iconSpan.innerHTML = fontAwesomeIcon;
      textSpan.textContent = emojiMatch[2].trim();
    } else {
      // No emoji, use a default icon
      iconSpan.innerHTML = '<i class="fas fa-star"></i>';
      textSpan.textContent = labelText;
    }
    
    button.appendChild(iconSpan);
    button.appendChild(textSpan);

    button.addEventListener('click', () => this.selectOption(option.id, button));
    button.addEventListener('keydown', (e) => this.handleOptionKeydown(e, option.id, button));

    return button;
  }

  mapEmojiToFontAwesome(emoji) {
    const emojiMap = {
      '🌱': '<i class="fas fa-seedling"></i>',
      '📚': '<i class="fas fa-book"></i>',
      '🎒': '<i class="fas fa-shopping-bag"></i>',
      '🎤': '<i class="fas fa-microphone"></i>',
      '🔀': '<i class="fas fa-exchange-alt"></i>',
      '🎯': '<i class="fas fa-bullseye"></i>',
      '💪': '<i class="fas fa-dumbbell"></i>',
      '🙅‍♀️': '<i class="fas fa-times-circle"></i>',
      '💖': '<i class="fas fa-heart"></i>',
      '🤷': '<i class="fas fa-question-circle"></i>',
      '🎭': '<i class="fas fa-theater-masks"></i>',
      '💼': '<i class="fas fa-briefcase"></i>',
      '🎶': '<i class="fas fa-music"></i>',
      '🔬': '<i class="fas fa-microscope"></i>',
      '🎨': '<i class="fas fa-palette"></i>',
      '🏃': '<i class="fas fa-running"></i>',
      '📖': '<i class="fas fa-book-open"></i>',
      '🎓': '<i class="fas fa-graduation-cap"></i>',
      '🏫': '<i class="fas fa-school"></i>',
      '👨‍👩‍👧‍👦': '<i class="fas fa-users"></i>'
    };
    
    return emojiMap[emoji] || '<i class="fas fa-star"></i>';
  }

  handleOptionKeydown(e, optionId, button) {
    const options = Array.from(document.querySelectorAll('.option'));
    const currentIndex = options.indexOf(button);

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        this.focusOption(options[prevIndex]);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        this.focusOption(options[nextIndex]);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.selectOption(optionId, button);
        break;
    }
  }

  focusOption(option) {
    document.querySelectorAll('.option').forEach(opt => {
      opt.setAttribute('tabindex', '-1');
    });
    option.setAttribute('tabindex', '0');
    option.focus();
  }

  selectOption(optionId, button) {
    document.querySelectorAll('.option').forEach(opt => {
      opt.classList.remove('selected');
      opt.setAttribute('aria-checked', 'false');
    });

    button.classList.add('selected');
    button.setAttribute('aria-checked', 'true');
    this.selectedAnswer = optionId;
    
    // Check if this leads to a result or next question
    const currentQuestion = this.questionsData.questions.find(q => q.id === this.currentQuestionId);
    const nextId = currentQuestion.next[optionId];
    
    // Show feedback message only if enabled and there's a next question
    setTimeout(() => {
      if (nextId.startsWith('out_')) {
        // Skip feedback for final results, proceed directly
        this.handleNext();
      } else {
        // Check if feedback is enabled for this question
        if (this.shouldShowFeedback(this.currentQuestionId)) {
          this.showFeedback(this.currentQuestionId, optionId);
        } else {
          // Skip feedback and proceed directly
          this.handleNext();
        }
      }
    }, 300);
  }

  updateBackButton() {
    const backBtn = document.getElementById('backBtn');
    backBtn.style.display = this.history.length > 0 ? 'block' : 'none';
  }

  handleNext() {
    if (!this.selectedAnswer) return;

    const currentQuestion = this.questionsData.questions.find(q => q.id === this.currentQuestionId);
    const nextId = currentQuestion.next[this.selectedAnswer];

    this.history.push({
      questionId: this.currentQuestionId,
      selectedAnswer: this.selectedAnswer
    });

    this.updateProgress(this.calculateProgress());

    if (nextId.startsWith('out_')) {
      this.showResult(nextId);
    } else {
      this.currentQuestionId = nextId;
      this.selectedAnswer = null;
      this.showQuestion();
    }
  }

  handleBack() {
    if (this.history.length === 0) return;

    // Hide feedback if it's showing
    this.hideFeedback();

    const previous = this.history.pop();
    this.currentQuestionId = previous.questionId;
    this.selectedAnswer = previous.selectedAnswer;
    
    this.updateProgress(this.calculateProgress());
    this.showQuestion();

    setTimeout(() => {
      const selectedOption = document.querySelector(`[data-option-id="${this.selectedAnswer}"]`);
      if (selectedOption) {
        selectedOption.classList.add('selected');
        selectedOption.setAttribute('aria-checked', 'true');
      }
    }, 100);
  }

  calculateProgress() {
    if (this.history.length === 0) return 0;

    let totalWeight = 0;
    this.history.forEach(item => {
      const weight = this.progressWeights[item.questionId] || 0;
      totalWeight += weight;
    });

    return Math.min(totalWeight * 100, 100);
  }

  updateProgress(percentage) {
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.querySelector('.progress-container');
    
    progressBar.style.width = `${percentage}%`;
    progressContainer.setAttribute('aria-valuenow', percentage);
  }

  showResult(outcomeId) {
    const outcome = this.questionsData.outcomes.find(o => o.id === outcomeId);
    const program = this.programsData.find(p => p.id === outcome.programId);

    if (!outcome || !program) {
      this.showError('Result not found');
      return;
    }

    this.updateProgress(100);

    const questionCard = document.getElementById('questionCard');
    const resultCard = document.getElementById('resultCard');
    
    questionCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

    this.renderResult(outcome, program);
    
    document.getElementById('resultTitle').focus();
  }

  renderResult(outcome, program) {
    const resultTitle = document.getElementById('resultTitle');
    const resultBlurb = document.getElementById('resultBlurb');
    const programTitle = document.getElementById('programTitle');
    const programCampus = document.getElementById('programCampus');
    const programNotes = document.getElementById('programNotes');
    const exploreCourseBtn = document.getElementById('exploreCourseBtn');

    resultTitle.textContent = `Perfect match, ${this.userName}! 🎉`;
    resultBlurb.textContent = `${outcome.blurb} This could be your ideal pathway to a rewarding teaching career!`;
    programTitle.textContent = program.title;
    programCampus.textContent = program.campus;
    
    // Only show notes if they exist and are not empty
    if (program.notes && program.notes.trim() !== '') {
      programNotes.textContent = program.notes;
      programNotes.style.display = 'block';
    } else {
      programNotes.style.display = 'none';
    }
    
    exploreCourseBtn.href = program.url;
    exploreCourseBtn.setAttribute('aria-label', `Explore ${program.title}`);
    
    // Load custom content for this outcome
    this.loadCustomContent(outcome.id);
  }

  async loadCustomContent(outcomeId) {
    const customContentElement = document.getElementById('customContent');
    
    try {
      const response = await fetch(`templates/${outcomeId}.html`);
      
      if (response.ok) {
        const htmlContent = await response.text();
        customContentElement.innerHTML = htmlContent;
        customContentElement.classList.remove('hidden');
      } else {
        // Template file doesn't exist, hide the container
        customContentElement.classList.add('hidden');
        customContentElement.innerHTML = '';
      }
    } catch (error) {
      // Network error or file doesn't exist, hide the container
      customContentElement.classList.add('hidden');
      customContentElement.innerHTML = '';
    }
  }

  showError(message) {
    const questionCard = document.getElementById('questionCard');
    const resultCard = document.getElementById('resultCard');
    
    questionCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

    document.getElementById('resultTitle').textContent = 'Oops!';
    document.getElementById('resultBlurb').textContent = message;
    document.getElementById('programDetails').style.display = 'none';
    document.getElementById('exploreCourseBtn').style.display = 'none';
  }

  getFeedbackMessage(questionId, optionId) {
    // Get the question data
    const question = this.questionsData.questions.find(q => q.id === questionId);
    if (!question || !question.feedback || !question.feedback.messages) {
      return this.getDefaultFeedbackMessage();
    }

    // Get the specific message for this option
    const messageData = question.feedback.messages[optionId];
    if (messageData) {
      return {
        icon: messageData.icon || '✨',
        title: messageData.title?.replace('{name}', this.userName) || `Great choice, ${this.userName}!`,
        message: messageData.message || 'You\'re on the right track!'
      };
    }

    return this.getDefaultFeedbackMessage();
  }

  getDefaultFeedbackMessage() {
    return {
      icon: '✨',
      title: `Great choice, ${this.userName}!`,
      message: 'You\'re on the right track to finding your perfect teaching pathway!'
    };
  }

  showFeedback(questionId, optionId) {
    const feedback = this.getFeedbackMessage(questionId, optionId);
    const feedbackOverlay = document.getElementById('feedbackOverlay');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackTitle = document.getElementById('feedbackTitle');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const feedbackContinueBtn = document.getElementById('feedbackContinueBtn');

    feedbackIcon.textContent = feedback.icon;
    feedbackTitle.textContent = feedback.title;
    feedbackMessage.textContent = feedback.message;
    
    feedbackOverlay.classList.remove('hidden');
    setTimeout(() => {
      feedbackOverlay.classList.add('visible');
      feedbackContinueBtn.focus();
    }, 50);
  }

  hideFeedback() {
    const feedbackOverlay = document.getElementById('feedbackOverlay');
    
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
      this.feedbackTimeout = null;
    }
    
    feedbackOverlay.classList.remove('visible');
    setTimeout(() => {
      feedbackOverlay.classList.add('hidden');
    }, 400);
  }

  shouldShowFeedback(questionId) {
    // Check if feedback system is globally enabled
    if (!this.configData || !this.configData.feedback.enabled) {
      return false;
    }

    // Get the specific question data
    const question = this.questionsData.questions.find(q => q.id === questionId);
    if (!question) {
      return this.configData.feedback.defaultEnabled;
    }

    // Check if question has feedback configuration
    if (question.feedback && question.feedback.hasOwnProperty('enabled')) {
      return question.feedback.enabled;
    }

    // Fall back to default setting
    return this.configData.feedback.defaultEnabled;
  }

  proceedToNext() {
    this.handleNext();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new QuizApp();
});