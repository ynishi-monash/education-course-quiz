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
      const [questionsResponse, programsResponse] = await Promise.all([
        fetch('questions.json'),
        fetch('programs.json')
      ]);

      if (!questionsResponse.ok || !programsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      this.questionsData = await questionsResponse.json();
      this.programsData = await programsResponse.json();
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
      if (e.target.classList.contains('year-option')) {
        this.handleYearSelection(e.target.dataset.year);
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
    button.textContent = option.label;
    button.setAttribute('data-option-id', option.id);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.setAttribute('tabindex', index === 0 ? '0' : '-1');

    button.addEventListener('click', () => this.selectOption(option.id, button));
    button.addEventListener('keydown', (e) => this.handleOptionKeydown(e, option.id, button));

    return button;
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
    
    // Show feedback message only if there's a next question, not for final results
    setTimeout(() => {
      if (nextId.startsWith('out_')) {
        // Skip feedback for final results, proceed directly
        this.handleNext();
      } else {
        // Show feedback for intermediate questions
        this.showFeedback(this.currentQuestionId, optionId);
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
    programNotes.textContent = program.notes;
    
    exploreCourseBtn.href = program.url;
    exploreCourseBtn.setAttribute('aria-label', `Explore ${program.title}`);
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
    const messages = {
      'q_age_group': {
        'early_primary': {
          icon: '🌱',
          title: `Wonderful choice, ${this.userName}!`,
          message: 'Early childhood education is incredibly rewarding! 85% of early childhood graduates report high job satisfaction, working with children from birth to 12 years.'
        },
        'primary_only': {
          icon: '📚',
          title: `Great thinking, ${this.userName}!`,
          message: '70% of students pursuing Bachelor of Teaching in Primary Education enrol as double degree students for broader career opportunities!'
        },
        'primary_secondary': {
          icon: '🎒',
          title: `Excellent pick, ${this.userName}!`,
          message: 'Teaching across both primary and secondary levels opens up amazing career flexibility! You\'ll be qualified to teach students aged 5-18.'
        },
        'secondary_only': {
          icon: '🎤',
          title: `Smart choice, ${this.userName}!`,
          message: 'Secondary teaching is in high demand! 90% of secondary education graduates find employment within 6 months of graduating.'
        }
      },
      'q_primary_path': {
        'primary_double': {
          icon: '🔀',
          title: `Brilliant decision, ${this.userName}!`,
          message: 'Double degree students often find more diverse career opportunities! Same 4 years, double the expertise and career options.'
        },
        'primary_single': {
          icon: '🎯',
          title: `Perfect focus, ${this.userName}!`,
          message: 'Focused primary education degrees provide deep specialisation! You\'ll be teaching across all key learning areas from Foundation to Year 6.'
        }
      },
      'q_ps_hpe': {
        'yes_hpe': {
          icon: '💪',
          title: `Fantastic choice, ${this.userName}!`,
          message: 'Health & PE teachers are in huge demand! 95% of HPE graduates find employment, and you\'ll be promoting wellbeing across all year levels.'
        },
        'no_hpe': {
          icon: '📖',
          title: `Good thinking, ${this.userName}!`,
          message: 'There are so many other rewarding teaching specialisations! Let\'s find the perfect match for your interests and strengths.'
        }
      },
      'q_ps_inclusion': {
        'incl_focus': {
          icon: '💖',
          title: `Amazing choice, ${this.userName}!`,
          message: 'Inclusive education specialists are desperately needed! You\'ll be making a real difference supporting diverse learners and championing inclusion.'
        },
        'incl_not_focus': {
          icon: '🎓',
          title: `Great approach, ${this.userName}!`,
          message: 'General primary and secondary education offers incredible variety! You\'ll teach across different year levels and can specialise later.'
        }
      },
      'q_secondary_area': {
        'sec_arts_lang_media': {
          icon: '🎭',
          title: `Creative choice, ${this.userName}!`,
          message: 'Arts, languages and media teachers inspire creativity! You\'ll choose two teaching areas from languages, humanities, media, psychology and more.'
        },
        'sec_business_econ': {
          icon: '💼',
          title: `Smart thinking, ${this.userName}!`,
          message: 'Business and economics teachers are highly valued! You\'ll be preparing students for real-world financial literacy and career success.'
        },
        'sec_music': {
          icon: '🎶',
          title: `Harmonious choice, ${this.userName}!`,
          message: 'Music education combines passion with pedagogy! You\'ll be inspiring the next generation of musicians and music lovers.'
        },
        'sec_science_tech': {
          icon: '🔬',
          title: `Brilliant selection, ${this.userName}!`,
          message: 'STEM teachers are in huge demand! Choose from maths, biology, chemistry, physics, psychology or digital technologies.'
        },
        'sec_visual_arts': {
          icon: '🎨',
          title: `Artistic vision, ${this.userName}!`,
          message: 'Visual arts teachers nurture creativity! This double degree format gives you both artistic expertise and teaching skills.'
        },
        'sec_hpe': {
          icon: '🏃',
          title: `Active choice, ${this.userName}!`,
          message: 'Secondary HPE specialists are essential! You can even add a third teaching area like business or maths for extra versatility.'
        }
      }
    };

    const questionMessages = messages[questionId];
    if (questionMessages && questionMessages[optionId]) {
      return questionMessages[optionId];
    }

    return {
      icon: '✨',
      title: 'Great choice!',
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

  proceedToNext() {
    this.handleNext();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new QuizApp();
});