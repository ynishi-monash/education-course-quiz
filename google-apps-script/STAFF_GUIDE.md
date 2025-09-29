# Staff Guide: Managing Quiz Questions in Google Sheets

This guide is designed for non-technical staff members who will be editing quiz questions using Google Sheets.

## Overview

You can now manage all quiz questions, answers, and feedback messages using a familiar Google Sheets interface. Changes you make will automatically appear in the live quiz application.

## Accessing the Quiz Management Spreadsheet

1. Open the shared Google Sheets document (link provided by your technical team)
2. You'll see 4 sheets at the bottom: **Meta**, **Questions**, **Options**, and **Outcomes**

## Understanding the Sheets

### 📊 Meta Sheet
**Purpose**: Controls the progress bar weights for each question
**What you see**: A list of question IDs and their weight values
**⚠️ Do not edit** unless specifically instructed - this affects the progress bar calculations

### ❓ Questions Sheet (Enhanced)
**Purpose**: The main question text and settings
**Columns you can edit**:
- **text**: The main question displayed to students
- **subtitle**: Optional additional text below the question
- **type**: Dropdown menu - choose "single" (one answer) or "multiple" (multiple answers)
- **ui**: Dropdown menu - choose "cards" (button style) or "chips" (compact style)

**🎯 New Features**:
- **Dropdown menus prevent typos** in type and ui columns
- **Option count column** shows how many answer choices each question has
- **Color coding** highlights questions missing answer options

### 🎯 Options Sheet (Simplified!)
**Purpose**: Answer choices, feedback messages, and question flow
**✨ New**: Option IDs are automatically generated - no more manual ID entry!

**Columns you need to fill**:
- **questionId**: Dropdown menu - prevents typos by showing valid question IDs
- **label**: The text shown on answer buttons (includes emojis)
- **nextId**: Where to go next (question ID or outcome ID starting with "out_")
- **feedbackTitle**: Personalized title shown after selection (use {name} for student's name)  
- **feedbackMessage**: Encouraging message explaining the choice

**🎯 New Features**:
- **Color-coded rows** group options by question for easier editing
- **Question text helper** shows the full question text for context
- **Dropdown validation** prevents invalid question IDs
- **Error highlighting** shows options with broken navigation links

### 🎓 Outcomes Sheet (Enhanced!)
**Purpose**: Final results and complete course information
**Columns you can edit**:
- **title**: Outcome title shown to students
- **blurb**: Short description of the educational pathway
- **courseTitle**: Full official course name
- **campus**: Campus location (e.g., "Clayton", "Peninsula")
- **url**: Course information link
- **description**: Detailed markdown content (replaces template files!)

**✨ New Features**:
- **All course data in one place** - no need for separate course files
- **Markdown descriptions** - rich content using simple markdown syntax
- **No more template files** - all content managed in Google Sheets
- **Campus information** clearly displayed to students
- **Direct course links** for easy exploration

**📝 Markdown Formatting Guide**:
- `#### Header` creates section headings
- `**Bold text**` makes text bold
- `- List item` creates bullet points
- Leave blank lines between sections for proper spacing

**Example Description**:
```markdown
#### What you'll learn:
- **Teaching Methods**: How to engage students effectively
- **Curriculum Design**: Planning and evaluation
- **Classroom Management**: Creating positive learning environments

#### Career opportunities:
Teach in primary schools with opportunities for leadership roles.
```

### 📋 Overview Sheet (New!)
**Purpose**: Read-only view showing complete quiz flow
**What you see**: 
- Hierarchical view of questions → options → next steps
- Easy-to-read format for understanding quiz navigation
- Updated automatically when you make changes

**How to use**: Check this sheet after making changes to verify the quiz flow makes sense

## Common Editing Tasks

### ✏️ Editing Question Text

1. Go to the **Questions** sheet
2. Find the question you want to change
3. Click on the **text** column and edit directly
4. Changes appear immediately in the quiz

**Example**: 
- Change "Which age group makes you light up the most?" 
- To "Which age group excites you most about teaching?"

### 🔄 Updating Answer Options

1. Go to the **Options** sheet
2. Find the option you want to change (use Ctrl+F to search)
3. Edit the **label** column
4. Keep the emoji at the beginning - it's part of the visual design

**Example**:
- Change "🌱 Little ones (0–12)" 
- To "🌱 Young children (0–12)"

### 💬 Modifying Feedback Messages

Feedback appears after students select an answer to encourage and inform them.

1. Go to the **Options** sheet
2. Find the option you want to add/edit feedback for
3. Edit these columns:
   - **feedbackIcon**: Emoji that appears large (usually same as in label)
   - **feedbackTitle**: Personal title - always use {name} for the student's name
   - **feedbackMessage**: Informative, encouraging message

**Example Feedback**:
- **Title**: "Wonderful choice, {name}!"
- **Message**: "Early childhood education is incredibly rewarding! 85% of graduates report high job satisfaction."

### 🔗 Changing Question Flow

The **nextId** column controls where students go after selecting an answer.

**Question IDs** (go to another question):
- q_age_group
- q_primary_path  
- q_ps_hpe
- q_ps_inclusion
- q_secondary_area

**Outcome IDs** (end with a result - must start with "out_"):
- out_early_primary
- out_primary_double
- out_primary_single
- out_ps_hpe
- out_ps_inclusive
- out_ps_general
- out_sec_arts_lang_media
- out_sec_business_econ
- out_sec_music
- out_sec_science_tech
- out_sec_visual_arts
- out_sec_hpe

### 🆕 Adding New Answer Options (Now Much Easier!)

1. Go to the **Options** sheet
2. Find the last row for the question you want to add to
3. Insert a new row below it
4. Fill in columns (optionId now auto-generated!):
   - **questionId**: Same as the question you're adding to
   - **label**: Text with emoji for the button
   - **nextId**: Where this option leads
   - **Feedback columns**: Optional but recommended

**✨ No more optionId needed!** The system automatically creates IDs like "opt1", "opt2", "opt3" for each question.

## Best Practices

### ✅ Do's

- **Always test your changes** by taking the quiz after editing
- **Use encouraging, positive language** in feedback messages
- **Keep answer labels short and clear** (they appear on buttons)
- **Include relevant emojis** to make options visually appealing
- **Use {name} in feedback titles** to personalize messages
- **Save your work frequently** (Google Sheets auto-saves)

### ❌ Don'ts

- **Don't change question IDs** - this breaks the quiz flow (option IDs are auto-generated now!)
- **Don't leave nextId empty** for working options
- **Don't use commas in IDs** (use underscores instead)
- **Don't change the Meta sheet** without consulting technical team
- **Don't delete entire rows** unless you're sure they're unused

## Testing Your Changes

After making edits:

1. **Save the spreadsheet** (Ctrl+S or Cmd+S)
2. **Check the Overview sheet** to verify your changes look correct
3. **Look for error highlighting** - red backgrounds indicate problems that need fixing
4. **Open the quiz application** in a new browser tab
5. **Navigate to the question you changed**
6. **Verify your changes appear correctly**
7. **Test the complete path** to ensure navigation still works
8. **Check feedback messages** display as expected

### 🔍 Enhanced Error Detection

The enhanced system will:
- **Highlight invalid references** in red (like broken nextId links)
- **Show missing feedback** in yellow (optional but recommended)
- **Group related options** with color coding
- **Display helper text** to prevent common mistakes
- **Validate dropdown selections** to prevent typos

## Troubleshooting

### "My changes don't appear in the quiz"

- Wait a few seconds and refresh the quiz page
- Check you edited the correct sheet
- Ensure you saved the spreadsheet
- Clear your browser cache (Ctrl+F5)

### "The quiz gets stuck on a question"

- Check the **nextId** values in the Options sheet
- Make sure they reference valid question IDs or outcome IDs
- Verify there are no typos in the nextId column

### "Feedback doesn't show"

- Some questions don't have feedback (like simple yes/no questions)
- Check that feedback columns aren't empty
- Verify feedbackIcon, feedbackTitle, or feedbackMessage have content

### "A question option is missing"

- Check the Options sheet for the questionId
- Ensure the option row isn't hidden or filtered
- Verify all required columns have data

## Getting Help

If you encounter issues:

1. **Check this guide first** for common solutions
2. **Ask a colleague** to review your changes
3. **Contact the technical team** with:
   - What you were trying to do
   - What went wrong
   - Screenshot of the spreadsheet if helpful

## Examples of Good Edits

### Good Question Text:
- ✅ "What teaching subject area excites you most?"
- ❌ "What is your preferred academic discipline for pedagogical instruction?"

### Good Feedback Messages:
- ✅ "Music education combines passion with pedagogy! You'll inspire the next generation of musicians."
- ❌ "Music is good."

### Good Answer Labels:
- ✅ "🎶 Music & performing arts"
- ❌ "Music and performing arts education with focus on instrumental and vocal pedagogy"

## Quick Reference

### Personalization Placeholder
- Use `{name}` in feedback titles to insert the student's name
- Example: "Great choice, {name}!" becomes "Great choice, Sarah!"

### Common Emojis for Education
- 🌱 Early childhood
- 📚 Primary education  
- 🎒 General education
- 🎭 Arts & creativity
- 🔬 Science & technology
- 💼 Business & economics
- 🎶 Music
- 🎨 Visual arts
- 🏃 Health & PE
- 💖 Inclusion & support

Remember: You're helping students find their perfect teaching pathway. Keep content encouraging, informative, and exciting!