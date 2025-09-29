/**
 * Education Course Quiz - Google Sheets to JSON Converter
 * 
 * This Google Apps Script converts data from Google Sheets into the JSON format
 * required by the quiz application. Deploy as a web app to serve JSON data.
 * 
 * Enhanced version with data validation and error checking.
 */

// Configuration - Update these with your actual Google Sheets IDs
const SHEETS_CONFIG = {
  // Replace with your Google Sheets ID
  SPREADSHEET_ID: 'YOUR_GOOGLE_SHEETS_ID_HERE',
  
  // Sheet names (you can customize these)
  SHEETS: {
    QUESTIONS: 'Questions',
    OPTIONS: 'Options', 
    OUTCOMES: 'Outcomes',
    META: 'Meta',
    VALIDATION: 'Validation'  // Optional validation sheet
  }
};

/**
 * Main function called when web app is accessed
 * Returns JSON data for the quiz application
 * 
 * Supports query parameter 'sheetId' to specify which Google Sheets to use
 * Usage: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheetId=YOUR_SHEET_ID
 */
function doGet(e) {
  try {
    // Get sheet ID from query parameter, fallback to default
    const sheetId = e.parameter.sheetId || SHEETS_CONFIG.SPREADSHEET_ID;
    
    if (!sheetId || sheetId === 'YOUR_GOOGLE_SHEETS_ID_HERE') {
      return ContentService
        .createTextOutput(JSON.stringify({
          error: 'Missing sheet ID',
          message: 'Please provide a sheetId parameter in the URL',
          usage: 'Add ?sheetId=YOUR_GOOGLE_SHEETS_ID to the URL',
          example: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheetId=1abc123def456...'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const jsonData = generateQuizJSON(sheetId);
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error generating JSON:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        error: 'Failed to generate quiz data',
        message: error.toString(),
        sheetId: e.parameter.sheetId || 'default'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Generate the complete quiz JSON structure
 * @param {string} sheetId - Optional Google Sheets ID to use instead of default
 */
function generateQuizJSON(sheetId) {
  const spreadsheetId = sheetId || SHEETS_CONFIG.SPREADSHEET_ID;
  const ss = SpreadsheetApp.openById(spreadsheetId);
  
  // Validate data integrity first
  const validationErrors = validateDataIntegrity(ss);
  if (validationErrors.length > 0) {
    console.warn('Data validation warnings:', validationErrors);
    // Continue anyway but log warnings
  }
  
  // Get data from all sheets
  const metaData = getMetaData(ss);
  const questionsData = getQuestionsData(ss);
  const optionsData = getOptionsData(ss);
  const outcomesData = getOutcomesData(ss);
  
  // Build questions with embedded options
  const questions = buildQuestions(questionsData, optionsData);
  
  // Calculate longest path for progress tracking
  const maxSteps = calculateLongestPath(questions);
  
  // Extract course data 
  const courses = [];
  const programs = []; // Keep for backward compatibility
  outcomesData.forEach(outcome => {
    if (outcome.course) {
      courses.push(outcome.course);
      programs.push(outcome.course); // Duplicate for backward compatibility
    }
  });

  return {
    meta: {
      ...metaData,
      maxSteps: maxSteps
    },
    questions: questions,
    outcomes: outcomesData,
    courses: courses,
    programs: programs // Keep for backward compatibility
  };
}

/**
 * Get meta configuration data
 */
function getMetaData(ss) {
  const sheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.META);
  
  const meta = {
    schema: "v1",
    title: "Find your course crush"
  };
  
  // Meta sheet is optional now
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    
    // Process progress weights (skip header row) - Optional for backward compatibility
    const progressWeights = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) { // questionId and weight
        progressWeights[row[0]] = parseFloat(row[1]);
      }
    }
    
    // Only include progressWeights if they exist (for backward compatibility)
    if (Object.keys(progressWeights).length > 0) {
      meta.progressWeights = progressWeights;
    }
  }
  
  return meta;
}

/**
 * Get questions data from the Questions sheet
 */
function getQuestionsData(ss) {
  const sheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.QUESTIONS);
  if (!sheet) {
    throw new Error(`Sheet "${SHEETS_CONFIG.SHEETS.QUESTIONS}" not found`);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const questions = [];
  
  // Expected columns: id, type, ui, text, subtitle
  const colMap = {
    id: headers.indexOf('id'),
    type: headers.indexOf('type'),
    ui: headers.indexOf('ui'),
    text: headers.indexOf('text'),
    subtitle: headers.indexOf('subtitle')
  };
  
  // Validate required columns exist
  if (colMap.id === -1 || colMap.text === -1) {
    throw new Error('Questions sheet missing required columns: id, text');
  }
  
  // Process each question (skip header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colMap.id]) continue; // Skip empty rows
    
    const question = {
      id: row[colMap.id],
      type: row[colMap.type] || 'single',
      ui: row[colMap.ui] || 'cards',
      text: row[colMap.text]
    };
    
    // Add subtitle if present
    if (row[colMap.subtitle]) {
      question.subtitle = row[colMap.subtitle];
    }
    
    questions.push(question);
  }
  
  return questions;
}

/**
 * Get options data from the Options sheet
 */
function getOptionsData(ss) {
  const sheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.OPTIONS);
  if (!sheet) {
    throw new Error(`Sheet "${SHEETS_CONFIG.SHEETS.OPTIONS}" not found`);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Expected columns: questionId, label, nextId, feedbackIcon, feedbackTitle, feedbackMessage
  // Note: optionId is now auto-generated, no longer required in spreadsheet
  const colMap = {
    questionId: headers.indexOf('questionId'),
    optionId: headers.indexOf('optionId'), // Optional - for backward compatibility
    label: headers.indexOf('label'),
    nextId: headers.indexOf('nextId'),
    feedbackIcon: headers.indexOf('feedbackIcon'),
    feedbackTitle: headers.indexOf('feedbackTitle'),
    feedbackMessage: headers.indexOf('feedbackMessage')
  };
  
  // Validate required columns (optionId no longer required)
  if (colMap.questionId === -1 || colMap.label === -1) {
    throw new Error('Options sheet missing required columns: questionId, label');
  }
  
  const optionsByQuestion = {};
  
  // Process each option (skip header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colMap.questionId] || !row[colMap.label]) continue;
    
    const questionId = row[colMap.questionId];
    
    // Auto-generate option ID or use provided one for backward compatibility
    let optionId;
    if (colMap.optionId !== -1 && row[colMap.optionId]) {
      // Use provided optionId if column exists and has value
      optionId = row[colMap.optionId];
    } else {
      // Auto-generate optionId based on position within question
      if (!optionsByQuestion[questionId]) {
        optionsByQuestion[questionId] = { options: [], next: {} };
      }
      const optionIndex = optionsByQuestion[questionId].options.length;
      optionId = `opt${optionIndex + 1}`;
    }
    
    const option = {
      id: optionId,
      label: row[colMap.label]
    };
    
    // Add feedback if present
    if (row[colMap.feedbackIcon] || row[colMap.feedbackTitle] || row[colMap.feedbackMessage]) {
      option.feedback = {};
      
      if (row[colMap.feedbackIcon]) option.feedback.icon = row[colMap.feedbackIcon];
      if (row[colMap.feedbackTitle]) option.feedback.title = row[colMap.feedbackTitle];
      if (row[colMap.feedbackMessage]) option.feedback.message = row[colMap.feedbackMessage];
    }
    
    // Initialize question options array if needed
    if (!optionsByQuestion[questionId]) {
      optionsByQuestion[questionId] = {
        options: [],
        next: {}
      };
    }
    
    optionsByQuestion[questionId].options.push(option);
    
    // Add next mapping if present
    if (row[colMap.nextId]) {
      optionsByQuestion[questionId].next[optionId] = row[colMap.nextId];
    }
  }
  
  return optionsByQuestion;
}

/**
 * Get outcomes data from the Outcomes sheet (with merged program data)
 */
function getOutcomesData(ss) {
  const sheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.OUTCOMES);
  if (!sheet) {
    throw new Error(`Sheet "${SHEETS_CONFIG.SHEETS.OUTCOMES}" not found`);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const outcomes = [];
  
  // Expected columns: id, title, blurb, courseTitle, campus, url, description
  const colMap = {
    id: headers.indexOf('id'),
    title: headers.indexOf('title'),
    blurb: headers.indexOf('blurb'),
    courseTitle: headers.indexOf('courseTitle'),
    campus: headers.indexOf('campus'),
    url: headers.indexOf('url'),
    description: headers.indexOf('description')
  };
  
  // Validate required columns
  if (colMap.id === -1 || colMap.title === -1) {
    throw new Error('Outcomes sheet missing required columns: id, title');
  }
  
  // Process each outcome (skip header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colMap.id]) continue;
    
    const outcome = {
      id: row[colMap.id],
      title: row[colMap.title],
      blurb: row[colMap.blurb] || ''
    };
    
    // Add description if available
    if (colMap.description !== -1 && row[colMap.description]) {
      outcome.description = row[colMap.description];
    }
    
    // Add course data if columns exist
    if (colMap.courseTitle !== -1 && row[colMap.courseTitle]) {
      outcome.course = {
        id: row[colMap.id], // Use outcome ID as course ID
        title: row[colMap.courseTitle],
        campus: row[colMap.campus] || '',
        url: row[colMap.url] || ''
      };
    }
    
    outcomes.push(outcome);
  }
  
  return outcomes;
}

/**
 * Combine questions with their options and next mappings
 */
function buildQuestions(questionsData, optionsData) {
  const questions = [];
  
  questionsData.forEach(question => {
    const questionOptions = optionsData[question.id];
    
    if (!questionOptions) {
      console.warn(`No options found for question: ${question.id}`);
      return;
    }
    
    // Add options and next mapping to question
    question.options = questionOptions.options;
    question.next = questionOptions.next;
    
    questions.push(question);
  });
  
  return questions;
}

/**
 * Test function - run this to test the JSON generation
 * @param {string} sheetId - Optional Google Sheets ID to test with
 * (For development use only)
 */
function testGeneration(sheetId) {
  try {
    const result = generateQuizJSON(sheetId);
    console.log('Generated JSON:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

/**
 * Validate data integrity across sheets
 * Returns array of warning messages
 */
function validateDataIntegrity(ss) {
  const warnings = [];
  
  try {
    const questionsSheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.QUESTIONS);
    const optionsSheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.OPTIONS);
    const outcomesSheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.OUTCOMES);
    
    if (!questionsSheet || !optionsSheet || !outcomesSheet) {
      warnings.push('Missing required sheets');
      return warnings;
    }
    
    // Get data
    const questionsData = questionsSheet.getDataRange().getValues();
    const optionsData = optionsSheet.getDataRange().getValues();
    const outcomesData = outcomesSheet.getDataRange().getValues();
    
    // Extract question IDs (skip header)
    const questionIds = questionsData.slice(1).map(row => row[0]).filter(id => id);
    
    // Extract outcome IDs (skip header)  
    const outcomeIds = outcomesData.slice(1).map(row => row[0]).filter(id => id);
    
    // Extract option data (skip header)
    // Note: optionId might be auto-generated, so we get it from the processed data
    const optionsHeaders = optionsSheet.getDataRange().getValues()[0];
    const optionsColMap = {
      questionId: optionsHeaders.indexOf('questionId'),
      nextId: optionsHeaders.indexOf('nextId')
    };
    
    const options = optionsData.slice(1).map(row => ({
      questionId: row[optionsColMap.questionId],
      nextId: row[optionsColMap.nextId]
    })).filter(opt => opt.questionId && opt.nextId);
    
    // Check for questions without options
    questionIds.forEach(qId => {
      const hasOptions = options.some(opt => opt.questionId === qId);
      if (!hasOptions) {
        warnings.push(`Question "${qId}" has no options`);
      }
    });
    
    // Check for orphaned options
    options.forEach(opt => {
      if (!questionIds.includes(opt.questionId)) {
        warnings.push(`Option references non-existent question "${opt.questionId}"`);
      }
    });
    
    // Check for invalid nextId references
    const allValidIds = [...questionIds, ...outcomeIds];
    options.forEach(opt => {
      if (opt.nextId && !allValidIds.includes(opt.nextId)) {
        warnings.push(`Option in question "${opt.questionId}" has invalid nextId "${opt.nextId}"`);
      }
    });
    
    // Check for duplicate question IDs
    const duplicateQuestionIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
    if (duplicateQuestionIds.length > 0) {
      warnings.push(`Duplicate question IDs: ${duplicateQuestionIds.join(', ')}`);
    }
    
    // Note: Skip duplicate option ID check since they're now auto-generated and guaranteed unique
    
  } catch (error) {
    warnings.push(`Validation error: ${error.toString()}`);
  }
  
  return warnings;
}

/**
 * Create setup helper functions for Google Sheets
 */
function setupDataValidation() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get sheets
    const questionsSheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.QUESTIONS);
    const optionsSheet = ss.getSheetByName(SHEETS_CONFIG.SHEETS.OPTIONS);
    
    if (!questionsSheet || !optionsSheet) {
      throw new Error('Questions and Options sheets must exist');
    }
    
    // Setup Questions sheet validation
    setupQuestionsValidation(questionsSheet);
    
    // Setup Options sheet validation  
    setupOptionsValidation(optionsSheet, questionsSheet);
    
    console.log('Data validation setup complete');
    
  } catch (error) {
    console.error('Failed to setup data validation:', error);
    throw error;
  }
}

/**
 * Setup validation for Questions sheet
 */
function setupQuestionsValidation(questionsSheet) {
  // Type column validation (column B)
  const typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['single', 'multiple'], true)
    .setAllowInvalid(false)
    .setHelpText('Select question type: single or multiple choice')
    .build();
  questionsSheet.getRange('B2:B').setDataValidation(typeRule);
  
  // UI column validation (column C)
  const uiRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['cards', 'chips'], true)
    .setAllowInvalid(false) 
    .setHelpText('Select UI style: cards or chips')
    .build();
  questionsSheet.getRange('C2:C').setDataValidation(uiRule);
}

/**
 * Setup validation for Options sheet
 */
function setupOptionsValidation(optionsSheet, questionsSheet) {
  // Get question IDs for validation
  const questionIds = questionsSheet.getRange('A2:A').getValues()
    .filter(row => row[0])
    .map(row => row[0]);
  
  if (questionIds.length > 0) {
    // Question ID validation (column A)
    const questionIdRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(questionIds, true)
      .setAllowInvalid(false)
      .setHelpText('Select a valid question ID from the Questions sheet')
      .build();
    optionsSheet.getRange('A2:A').setDataValidation(questionIdRule);
  }
}

/**
 * Create overview sheet with formatted question flow
 */
function createOverviewSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Delete existing overview sheet if it exists
    const existingSheet = ss.getSheetByName('Overview');
    if (existingSheet) {
      ss.deleteSheet(existingSheet);
    }
    
    // Create new overview sheet
    const overviewSheet = ss.insertSheet('Overview');
    
    // Set headers
    overviewSheet.getRange('A1').setValue('Quiz Flow Overview');
    overviewSheet.getRange('A1').setFontSize(14).setFontWeight('bold');
    
    // Generate overview content
    const questionsData = getQuestionsData(ss);
    const optionsData = getOptionsData(ss);
    
    let currentRow = 3;
    
    questionsData.forEach(question => {
      // Question header
      overviewSheet.getRange(currentRow, 1).setValue(`Q: ${question.text}`);
      overviewSheet.getRange(currentRow, 1).setFontWeight('bold').setBackground('#e8f0fe');
      currentRow++;
      
      // Options
      const questionOptions = optionsData[question.id];
      if (questionOptions && questionOptions.options) {
        questionOptions.options.forEach(option => {
          const nextId = questionOptions.next[option.id] || 'undefined';
          overviewSheet.getRange(currentRow, 1).setValue(`  → ${option.label}`);
          overviewSheet.getRange(currentRow, 2).setValue(`→ ${nextId}`);
          currentRow++;
        });
      }
      
      currentRow++; // Empty row between questions
    });
    
    // Auto-resize columns
    overviewSheet.autoResizeColumns(1, 2);
    
    console.log('Overview sheet created successfully');
    
  } catch (error) {
    console.error('Failed to create overview sheet:', error);
    throw error;
  }
}

/**
 * Helper function to get current spreadsheet ID
 * (Useful when setting up the script)
 */
function getCurrentSpreadsheetId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  console.log('Current Spreadsheet ID:', ss.getId());
  return ss.getId();
}

/**
 * Calculate the longest possible path through the decision tree
 * @param {Array} questions - Array of question objects with next mappings
 * @returns {number} Maximum number of questions a user could answer
 */
function calculateLongestPath(questions) {
  if (!questions || questions.length === 0) {
    return 0;
  }
  
  // Find starting question (first question in the array)
  const startQuestionId = questions[0].id;
  
  /**
   * Recursive function to find maximum depth from a given question
   * @param {string} questionId - Current question ID
   * @param {Set} visited - Set of visited questions to prevent cycles
   * @returns {number} Maximum depth from this question
   */
  function findMaxDepth(questionId, visited = new Set()) {
    // Prevent infinite loops
    if (visited.has(questionId)) {
      return 0;
    }
    
    // If this is an outcome (starts with 'out_'), we've reached the end
    if (questionId.startsWith('out_')) {
      return 0;
    }
    
    // Find the question object
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.next) {
      return 0;
    }
    
    // Mark this question as visited
    visited.add(questionId);
    
    // Find the maximum depth among all possible next questions
    let maxDepth = 0;
    Object.values(question.next).forEach(nextId => {
      const depth = 1 + findMaxDepth(nextId, new Set(visited));
      maxDepth = Math.max(maxDepth, depth);
    });
    
    return maxDepth;
  }
  
  const longestPath = findMaxDepth(startQuestionId);
  console.log(`Calculated longest path: ${longestPath} questions`);
  return longestPath;
}

/**
 * Run data validation and return results
 */
function runValidation() {
  try {
    const ss = SpreadsheetApp.openById(SHEETS_CONFIG.SPREADSHEET_ID);
    const warnings = validateDataIntegrity(ss);
    
    if (warnings.length === 0) {
      console.log('✅ All data validation checks passed');
    } else {
      console.log('⚠️ Data validation warnings:');
      warnings.forEach(warning => console.log('  - ' + warning));
    }
    
    return warnings;
    
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}