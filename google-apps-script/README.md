# Google Sheets Quiz Question Management

This Google Apps Script solution allows non-technical staff to manage quiz questions using Google Sheets and automatically generates the JSON data required by the quiz application.

## Setup Instructions

### 1. Create Google Sheets Template

Create a new Google Sheets document with the following sheets:

#### Sheet 1: "Meta" (Optional)
**Note**: This sheet is now optional. Progress is automatically calculated based on the longest possible path through your decision tree.

If you want to use custom progress weights, create this sheet:

| questionId | weight |
|------------|--------|
| q_age_group | 0.25 |
| q_primary_path | 0.25 |
| q_ps_hpe | 0.15 |
| q_ps_inclusion | 0.15 |
| q_secondary_area | 0.35 |

#### Sheet 2: "Questions"
Main question data.

| id | type | ui | text | subtitle |
|----|------|----|----- |----------|
| q_age_group | single | cards | Which age group makes you light up the most? | |
| q_primary_path | single | cards | Do you want to keep it simple, or mix it up? | Double degrees take 4 years too — same time, extra options. |

#### Sheet 3: "Options"  
Question options, navigation, and feedback.
**Note**: Option IDs are now auto-generated! No need to enter optionId column.

| questionId | label | nextId | feedbackIcon | feedbackTitle | feedbackMessage |
|------------|-------|--------|--------------|---------------|-----------------|
| q_age_group | 🌱 Little ones (0–12) | out_early_primary | 🌱 | Wonderful choice, {name}! | Early childhood education is incredibly rewarding! |
| q_age_group | 📚 Primary kids (5–12) | q_primary_path | 📚 | Great thinking, {name}! | 70% of students pursuing Bachelor of Teaching... |

#### Sheet 4: "Outcomes" (Enhanced with Course Data & Markdown Descriptions)
Quiz result outcomes with complete course information and rich markdown content.

| id | title | blurb | courseTitle | campus | url | description |
|----|-------|-------|-------------|--------|-----|-------------|
| out_early_primary | Early Childhood & Primary Education | Play-based learning, creativity and helping kids grow in every way. | Bachelor of Early Childhood & Primary Education | Peninsula | https://www.monash.edu/study/courses/find-a-course | #### What you'll learn:<br>- **Early Childhood:** How to help children grow...<br>#### Career opportunities:<br>Teach children from birth to age 12... |
| out_primary_double | Primary Education — Double Degree | Primary + a second passion. Same 4 years, bigger toolkit. | Bachelor of Education (Primary) + Double Degree | Clayton (some units Caulfield) | https://www.monash.edu/study/courses/find-a-course | #### What you'll learn:<br>- Complete two degrees at the same time...<br>#### Career opportunities:<br>Teach children aged 5–12... |

**New Features:**
- **Markdown descriptions** replace separate template HTML files
- **All content in one CSV** for easier management
- **Rich formatting** using simple markdown syntax
- **Simplified deployment** - no template files to manage

### 2. Deploy Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the contents of `Code.gs` into the script editor
4. Update the `SPREADSHEET_ID` constant with your Google Sheets ID
5. Save the project with a descriptive name

### 3. Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Set execute as: "Me"
4. Set access: "Anyone" (for public access) or "Anyone with the link"
5. Click "Deploy"
6. Copy the Web App URL

### 4. Update Quiz Application

In your quiz application, update the data loading to fetch from the Apps Script web app:

```javascript
// Add this as a fallback in your loadData() method
const APPS_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';

async loadData() {
  try {
    // Try loading from Apps Script first
    const response = await fetch(APPS_SCRIPT_URL);
    if (response.ok) {
      this.questionsData = await response.json();
      console.log('Loaded questions from Google Sheets');
    } else {
      throw new Error('Apps Script unavailable');
    }
  } catch (error) {
    console.log('Falling back to local questions.json');
    // Fallback to existing local file loading
    const response = await fetch('questions.json');
    this.questionsData = await response.json();
  }
  
  // Continue with existing loading logic...
}
```

## Usage Guide for Staff

### Adding New Questions

1. **Questions Sheet**: Add a new row with question details
2. **Options Sheet**: Add rows for each answer option
3. **Connect Navigation**: Set `nextId` to link questions together
4. **Add Feedback**: Include feedback messages for engaging responses

### Editing Existing Content

- **Question Text**: Edit directly in the Questions sheet
- **Answer Options**: Modify labels in the Options sheet
- **Feedback Messages**: Update feedback columns
- **Navigation Flow**: Change `nextId` values to modify quiz flow

### Adding New Outcomes

1. Add outcome in Outcomes sheet
2. Reference the outcome ID in Options sheet `nextId` column
3. Ensure corresponding program data exists

## Data Validation Tips

- **Question IDs**: Must be unique and match between Questions and Options sheets
- **Option IDs**: Must be unique within each question
- **Next IDs**: Must reference valid question IDs or outcome IDs (starting with "out_")
- **Feedback**: All feedback fields are optional
- **Name Placeholder**: Use `{name}` in feedback titles to personalize messages

## Testing Changes

1. Make changes in Google Sheets
2. Refresh the quiz application
3. Test the affected question paths
4. Verify feedback messages display correctly

## Troubleshooting

### Common Issues

- **"Sheet not found" error**: Check sheet names match the configuration
- **"Required columns missing"**: Ensure all mandatory columns exist with correct names
- **Navigation broken**: Verify `nextId` values reference valid questions/outcomes
- **JSON not updating**: Check Apps Script deployment is published correctly

### Getting Help

- Check the Apps Script execution logs for detailed error messages
- Use the `testGeneration()` function to debug JSON generation
- Verify Google Sheets permissions allow script access

## Security Notes

- Keep the Google Sheets link private if it contains sensitive information
- The web app URL can be shared publicly if needed
- Consider using authentication if quiz content should be restricted

## Backup and Version Control

- Google Sheets automatically maintains revision history
- Download backup copies of the spreadsheet regularly
- Test changes in a copy before updating the live version