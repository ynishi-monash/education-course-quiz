# Google Apps Script Deployment Guide

This guide walks you through setting up the Google Sheets + Apps Script solution for managing quiz questions.

## Step 1: Create Google Sheets Template

### Option A: Manual Setup (Recommended for understanding)

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "Education Quiz Questions"
4. Create 4 sheets with the following names:
   - Meta
   - Questions  
   - Options
   - Outcomes

### Option B: Import from CSV Files (Faster)

1. Create a new Google Sheets document
2. For each sheet, use "File" → "Import" and upload the corresponding CSV:
   - Import `questions.csv` to "Questions" sheet  
   - Import `simplified-options.csv` to "Options" sheet (no optionId column needed!)
   - Import `outcomes-merged.csv` to "Outcomes" sheet (includes all program data!)
   - *(Skip meta.csv - progress is now calculated automatically)*
3. **Add your own enhancements**:
   - Create pivot tables for data analysis
   - Add lookup formulas for data validation
   - Use Google Sheets' built-in features for relationships

## Step 2: Setup Google Apps Script

1. Open [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Delete the default `myFunction()` code
4. Copy and paste the entire contents of `Code.gs` into the script editor
5. Rename the project to "Quiz Questions API"

### Configure the Script

1. Find this line in the code:
   ```javascript
   SPREADSHEET_ID: 'YOUR_GOOGLE_SHEETS_ID_HERE',
   ```

2. **Sheet ID Configuration**: You have two options:

   **Option A: Use URL Parameters Only (Recommended)**
   - Leave `SPREADSHEET_ID: 'YOUR_GOOGLE_SHEETS_ID_HERE'` as-is
   - Always provide sheet ID via URL: `?sheetId=YOUR_GOOGLE_SHEETS_ID`
   - More flexible for multiple sheets

   **Option B: Set Default Sheet ID**
   - Replace `YOUR_GOOGLE_SHEETS_ID_HERE` with your Google Sheets ID
   - Copy ID from URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Allows usage without URL parameters

3. Save the script (Ctrl+S or Cmd+S)

## Step 3: Test the Script

1. In the Apps Script editor, select the `testGeneration` function from the dropdown
2. Click the "Run" button (▶️)
3. Grant permissions when prompted:
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to Quiz Questions API (unsafe)"
   - Click "Allow"

4. Check the execution log for any errors
5. If successful, you'll see the generated JSON in the logs

## Step 4: Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Click the gear icon ⚙️ next to "Select type"
3. Choose "Web app"
4. Configure deployment settings:
   - **Description**: "Quiz Questions JSON API"
   - **Execute as**: "Me (your email)"
   - **Who has access**: "Anyone" (for public access)
5. Click "Deploy"
6. **Important**: Copy the "Web app URL" - you'll need this for your quiz app

### URL Parameters Support

The web app now supports dynamic sheet selection via URL parameters:

- **Default usage**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
- **With sheet ID**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheetId=YOUR_GOOGLE_SHEETS_ID`

This allows you to:
- Use different Google Sheets for different quiz versions
- Switch between development and production sheets  
- Support multiple quiz configurations with one script

### Security Note
If you want to restrict access, choose "Anyone with the link" instead of "Anyone". The quiz app will still work, but the URL won't be publicly discoverable.

## Step 5: Update Quiz Application

1. Open your quiz application's `script.js` file
2. Find the `loadData()` method (around line 28)
3. Replace the method with this updated version:

```javascript
async loadData() {
  // Your Apps Script web app URL (with optional sheet ID parameter)
  const APPS_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE'; // Replace with your actual URL
  // const APPS_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE?sheetId=YOUR_SHEET_ID'; // With specific sheet
  
  try {
    // Try loading from Google Sheets first
    console.log('Loading questions from Google Sheets...');
    const response = await fetch(APPS_SCRIPT_URL);
    
    if (response.ok) {
      const questionsData = await response.json();
      
      if (questionsData.error) {
        throw new Error(questionsData.message);
      }
      
      this.questionsData = questionsData;
      console.log('✅ Successfully loaded questions from Google Sheets');
      
      // Load other data files (programs now included in questionsData)
      const configResponse = await fetch('config.json');

      if (!configResponse.ok) {
        throw new Error('Failed to fetch config data');
      }

      this.programsData = questionsData.programs || []; // Programs included in sheets data
      this.configData = await configResponse.json();
      this.progressWeights = this.questionsData.meta.progressWeights;
      
      return; // Success - exit here
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
    
  } catch (error) {
    console.warn('Failed to load from Google Sheets:', error.message);
    console.log('Falling back to local questions.json...');
    
    // Fallback to local files
    const [questionsResponse, programsResponse, configResponse] = await Promise.all([
      fetch('questions.json'),
      fetch('programs.json'),
      fetch('config.json')
    ]);

    if (!questionsResponse.ok || !programsResponse.ok || !configResponse.ok) {
      throw new Error('Failed to fetch local data files');
    }

    this.questionsData = await questionsResponse.json();
    this.programsData = await programsResponse.json();
    this.configData = await configResponse.json();
    this.progressWeights = this.questionsData.meta.progressWeights;
    
    console.log('✅ Loaded from local files as fallback');
  }
}
```

4. Replace `YOUR_WEB_APP_URL_HERE` with the actual web app URL from Step 4
   - **If using URL parameters**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheetId=YOUR_SHEET_ID`
   - **If using default sheet**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
5. Test your quiz application - it should now load questions from Google Sheets!

## Step 6: Test the Complete System

1. Make a small change in your Google Sheets (e.g., edit a question text)
2. Refresh your quiz application
3. Verify the change appears in the quiz
4. Test that the quiz still works correctly with navigation and feedback

## Managing Content (For Staff)

### Making Changes

1. **Edit Questions**: Modify text in the Questions sheet
2. **Update Options**: Change labels or feedback in the Options sheet  
3. **Modify Flow**: Update the "nextId" column to change question routing
4. **Add Content**: Insert new rows with the required data

### Important Notes

- Changes are live immediately (no deployment needed)
- Always test changes by taking the quiz after editing
- Use the same format for IDs (no spaces, use underscores)
- Feedback messages support `{name}` placeholder for personalization

## Troubleshooting

### Common Issues

1. **"Failed to load from Google Sheets" error**
   - Check that the spreadsheet ID is correct in the Apps Script
   - Verify the web app is deployed and URL is correct
   - Ensure sheets have the exact names: Meta, Questions, Options, Outcomes

2. **"Permission denied" errors**
   - Re-run the Apps Script authorization process
   - Check that the web app access is set to "Anyone" or "Anyone with the link"

3. **Questions not updating**
   - Make sure you're editing the correct Google Sheets
   - Check browser cache - try hard refresh (Ctrl+F5)
   - Verify the Apps Script deployment is using the latest code

4. **Invalid JSON errors**
   - Check for missing required columns in your sheets
   - Ensure question IDs match between Questions and Options sheets
   - Verify that all "nextId" values reference valid questions or outcomes

### Getting Help

- Check the Apps Script execution logs: Script Editor → "Executions"
- Use browser developer tools to see network errors
- Test the web app URL directly in your browser to see the JSON output

## Maintenance

### Updating the Script

If you need to modify the Apps Script code:

1. Make changes in the script editor
2. Save the changes
3. Create a new deployment (Deploy → New deployment)
4. Update your quiz app with the new web app URL

### Backup

- Google Sheets automatically saves revision history
- Download backup copies: File → Download → Excel (.xlsx)
- Keep a copy of your Apps Script code

## Security Best Practices

- Don't share the Google Sheets edit link publicly
- The web app URL can be public (it only serves data)
- Regularly review who has access to your Google Sheets
- Consider using "Anyone with the link" instead of "Anyone" for the web app if you want some privacy