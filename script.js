class QuizApp {
  constructor() {
    this.questionsData = null;
    this.programsData = null;
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
      // Show loading screen initially
      this.showLoading();

      await this.loadData();
      this.bindEvents();

      // Hide loading screen and show welcome
      this.hideLoading();
      this.showWelcome();
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
      this.hideLoading();
      this.showError('Failed to load quiz data. Please refresh the page.');
    }
  }

  async loadData() {
    // Your Apps Script web app URL (with optional sheet ID parameter)
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzPNuEzi1g1lavlGzI1Dwg4Hi0_Cazp2Nb5zl5PHG9E1mWyVd3GmU_6SoOzm8bthTL/exec?sheetId=19nX57wbI86cRdTOHcDs3fEeSJKMJjw9uyCh_3TCOp4E'; // Replace with your actual URL
    // const APPS_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE?sheetId=YOUR_SHEET_ID'; // With specific sheet

    try {
      console.log('Loading data from Google Sheets...');
      const questionsResponse = await fetch(APPS_SCRIPT_URL);

      if (!questionsResponse.ok) {
        throw new Error(`Failed to fetch from Google Sheets: HTTP ${questionsResponse.status}`);
      }

      const questionsData = await questionsResponse.json();

      if (questionsData.error) {
        throw new Error(questionsData.message);
      }

      this.questionsData = questionsData;

      // Use maxSteps for progress calculation
      this.maxSteps = this.questionsData.meta.maxSteps;
      this.progressWeights = this.questionsData.meta.progressWeights;

      console.log('✅ Successfully loaded data from Google Sheets');
      console.log('Questions data structure:', this.questionsData);
      console.log('Available questions:', this.questionsData.questions);

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
      this.startQuiz();
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
    // Use the first question from the loaded data
    this.currentQuestionId = this.questionsData.questions[0].id;
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

  showQuestionWithTransition() {
    const questionContent = document.getElementById('questionContent');

    // Start exit animation
    questionContent.classList.add('transitioning-out');

    // After exit animation, update content and animate in
    setTimeout(() => {
      this.showQuestion();
      questionContent.classList.remove('transitioning-out');
      questionContent.classList.add('transitioning-in');

      // Add entrance animations to options
      const options = document.querySelectorAll('.option');
      options.forEach(option => {
        option.classList.add('animating-in');
      });

      // Remove animation classes after animation completes
      setTimeout(() => {
        questionContent.classList.remove('transitioning-in');
        options.forEach(option => {
          option.classList.remove('animating-in');
        });
      }, 500);

    }, 300);
  }

  renderQuestion(question) {
    const questionText = document.getElementById('questionText');
    const questionSubtitle = document.getElementById('questionSubtitle');
    const optionsContainer = document.getElementById('optionsContainer');

    questionText.textContent = question.text;
    questionSubtitle.textContent = question.subtitle || '';
    questionSubtitle.style.display = question.subtitle ? 'block' : 'none';

    optionsContainer.innerHTML = '';
    const optionCount = question.options.length;
    optionsContainer.className = `options-container options-${question.ui} options-count-${optionCount}`;

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

    // Add option badge with letter (A, B, C, etc.)
    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'option-badge';
    badgeSpan.textContent = String.fromCharCode(65 + index); // A=65, B=66, etc.
    button.appendChild(badgeSpan);

    // Create container for text content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'option-content';

    // Extract text from label (remove emoji/icon if present)
    const labelText = option.label;
    const emojiMatch = labelText.match(/^([^\w\s]+)\s*(.+)$/);

    const textSpan = document.createElement('span');
    textSpan.className = 'option-text';

    // Use text without emoji if match found, otherwise use full label
    if (emojiMatch) {
      textSpan.innerHTML = this.parseSimpleMarkdown(emojiMatch[2].trim());
    } else {
      textSpan.innerHTML = this.parseSimpleMarkdown(labelText);
    }

    contentContainer.appendChild(textSpan);

    // Add description if present
    if (option.description) {
      const descSpan = document.createElement('span');
      descSpan.className = 'option-description';
      descSpan.innerHTML = this.parseSimpleMarkdown(option.description);
      contentContainer.appendChild(descSpan);
    }

    button.appendChild(contentContainer);

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
    console.log('selectOption called with:', optionId, button);

    document.querySelectorAll('.option').forEach(opt => {
      opt.classList.remove('selected');
      opt.setAttribute('aria-checked', 'false');
    });

    button.classList.add('selected');
    button.setAttribute('aria-checked', 'true');
    this.selectedAnswer = optionId;

    // Check if this leads to a result or next question
    const currentQuestion = this.questionsData.questions.find(q => q.id === this.currentQuestionId);
    console.log('Current question:', currentQuestion);

    if (!currentQuestion) {
      console.error('Current question not found:', this.currentQuestionId);
      return;
    }

    if (!currentQuestion.next) {
      console.error('No next mapping found for question:', currentQuestion);
      return;
    }

    const nextId = currentQuestion.next[optionId];
    console.log('Next ID:', nextId);

    if (!nextId) {
      console.error('No next ID found for option:', optionId, 'in question:', currentQuestion.id);
      return;
    }

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

    if (!currentQuestion) {
      console.error('Current question not found in handleNext:', this.currentQuestionId);
      this.showError('Navigation error: Current question not found');
      return;
    }

    const nextId = currentQuestion.next[this.selectedAnswer];
    console.log('handleNext - nextId:', nextId);

    if (!nextId) {
      console.error('No next ID found for selected answer:', this.selectedAnswer);
      this.showError('Navigation error: No next step defined for this option');
      return;
    }

    this.history.push({
      questionId: this.currentQuestionId,
      selectedAnswer: this.selectedAnswer
    });

    this.updateProgress(this.calculateProgress());

    if (nextId.startsWith('out_')) {
      this.showResult(nextId);
    } else {
      // Verify the next question exists before navigating
      const nextQuestion = this.questionsData.questions.find(q => q.id === nextId);
      if (!nextQuestion) {
        console.error('Next question not found:', nextId);
        this.showError(`Question "${nextId}" not found in data`);
        return;
      }

      this.currentQuestionId = nextId;
      this.selectedAnswer = null;
      this.showQuestionWithTransition();
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
    this.showQuestionWithTransition();

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

    // Use new maxSteps calculation if available
    if (this.maxSteps && this.maxSteps > 0) {
      const currentStep = this.history.length;
      return Math.min((currentStep / this.maxSteps) * 100, 100);
    }

    // Fallback to old progressWeights method for backward compatibility
    if (this.progressWeights) {
      let totalWeight = 0;
      this.history.forEach(item => {
        const weight = this.progressWeights[item.questionId] || 0;
        totalWeight += weight;
      });
      return Math.min(totalWeight * 100, 100);
    }

    // Final fallback: simple step counting (not ideal for decision trees)
    const totalQuestions = this.questionsData.questions.length;
    return Math.min((this.history.length / totalQuestions) * 100, 100);
  }

  updateProgress(percentage) {
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.querySelector('.progress-container');

    progressBar.style.width = `${percentage}%`;
    progressContainer.setAttribute('aria-valuenow', percentage);
  }

  showResult(outcomeId) {
    const outcome = this.questionsData.outcomes.find(o => o.id === outcomeId);

    if (!outcome || !outcome.course) {
      this.showError('Result not found');
      return;
    }

    this.updateProgress(100);

    const questionCard = document.getElementById('questionCard');
    const resultCard = document.getElementById('resultCard');

    questionCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

    this.renderResult(outcome);

    document.getElementById('resultTitle').focus();
  }

  renderResult(outcome) {
    const resultTitle = document.getElementById('resultTitle');
    const resultBlurb = document.getElementById('resultBlurb');
    const courseTitle = document.getElementById('courseTitle');
    const courseCampus = document.getElementById('courseCampus');
    const exploreCourseBtn = document.getElementById('exploreCourseBtn');

    resultTitle.textContent = `${outcome.title} 🎉`;
    resultBlurb.textContent = `${outcome.blurb} This could be your ideal pathway to a rewarding teaching career!`;
    courseTitle.textContent = outcome.course.title;
    courseCampus.textContent = outcome.course.campus;

    exploreCourseBtn.href = outcome.course.url;
    exploreCourseBtn.target = '_blank';
    exploreCourseBtn.rel = 'noopener noreferrer';
    exploreCourseBtn.setAttribute('aria-label', `Explore ${outcome.course.title}`);

    // Load custom content for this outcome
    this.loadCustomContent(outcome);
  }

  loadCustomContent(outcome) {
    const customContentElement = document.getElementById('customContent');

    if (outcome.description && outcome.description.trim() !== '') {
      // Convert markdown to HTML
      const htmlContent = this.parseMarkdown(outcome.description);
      customContentElement.innerHTML = htmlContent;
      customContentElement.classList.remove('hidden');
    } else {
      // No description available, hide the container
      customContentElement.classList.add('hidden');
      customContentElement.innerHTML = '';
    }
  }

  parseMarkdown(markdown) {
    // Simple markdown parser for basic formatting
    let html = markdown;

    // Convert headers (#### to h4)
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');

    // Convert bold text (**text** to <strong>text</strong>)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert bullet points (- text to <li>text</li>)
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> elements in <ul>
    html = html.replace(/(<li>.*<\/li>)/s, (match) => {
      // Split into lines and wrap consecutive li elements
      const lines = match.split('\n');
      let result = '';
      let inList = false;

      for (let line of lines) {
        if (line.trim().startsWith('<li>')) {
          if (!inList) {
            result += '<ul>\n';
            inList = true;
          }
          result += line + '\n';
        } else {
          if (inList) {
            result += '</ul>\n';
            inList = false;
          }
          result += line + '\n';
        }
      }

      if (inList) {
        result += '</ul>\n';
      }

      return result;
    });

    // Convert line breaks to paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/^(?!<[uh])/gm, '<p>');
    html = html.replace(/(?!<\/[uh]>)$/gm, '</p>');

    // Clean up extra paragraphs around headers and lists
    html = html.replace(/<p><h4>/g, '<h4>');
    html = html.replace(/<\/h4><\/p>/g, '</h4>');
    html = html.replace(/<p><ul>/g, '<ul>');
    html = html.replace(/<\/ul><\/p>/g, '</ul>');
    html = html.replace(/<p><\/p>/g, '');

    return html;
  }

  parseSimpleMarkdown(text) {
    // Simple markdown parser for option labels (inline formatting only)
    let html = text;

    // Convert bold text (**text** to <strong>text</strong>)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert italic text (*text* to <em>text</em>)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Convert code text (`text` to <code>text</code>)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    return html;
  }

  showError(message) {
    const questionCard = document.getElementById('questionCard');
    const resultCard = document.getElementById('resultCard');

    questionCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

    document.getElementById('resultTitle').textContent = 'Oops!';
    document.getElementById('resultBlurb').textContent = message;
    document.getElementById('courseDetails').style.display = 'none';
    document.getElementById('exploreCourseBtn').style.display = 'none';
  }

  showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const app = document.querySelector('.app');

    loadingOverlay.classList.remove('hidden');
    app.style.display = 'none'; // Hide main app during loading
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const app = document.querySelector('.app');

    loadingOverlay.classList.add('hidden');
    app.style.display = 'flex'; // Show main app after loading
  }

  getFeedbackMessage(questionId, optionId) {
    // Get the question data
    const question = this.questionsData.questions.find(q => q.id === questionId);
    if (!question || !question.options) {
      return this.getDefaultFeedbackMessage();
    }

    // Find the specific option
    const option = question.options.find(opt => opt.id === optionId);
    if (option && option.feedback) {
      return {
        icon: option.feedback.icon || '✨',
        title: option.feedback.title?.replace('{name}', this.userName) || `Great choice, ${this.userName}!`,
        message: option.feedback.message || 'You\'re on the right track!'
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
    // Get the specific question data
    const question = this.questionsData.questions.find(q => q.id === questionId);
    if (!question || !question.options) {
      return false;
    }

    // Check if any option has feedback data
    return question.options.some(option => option.feedback);
  }

  proceedToNext() {
    this.handleNext();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new QuizApp();
});
