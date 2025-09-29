# Enhanced Google Sheets Template Setup

This guide shows how to set up the enhanced two-sheet structure with data validation, formatting, and helper features.

**Note**: This guide covers manual setup options. If you prefer to use Google Sheets' built-in pivot tables and lookup functions for data relationships and validation, you can skip the manual setup steps and use those native features instead.

## Sheet Setup Instructions

### 1. Questions Sheet Enhancements

#### Column Structure:
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| id | type | ui | text | subtitle | option_count |

#### Data Validation:
- **Column B (type)**: Dropdown with values: `single, multiple`
- **Column C (ui)**: Dropdown with values: `cards, chips`
- **Column F (option_count)**: Formula: `=COUNTIF(Options.A:A,A2)` (counts options for this question)

#### Conditional Formatting:
- **Missing Options**: Highlight rows where option_count = 0 in red
- **Question IDs**: Alternate row colors for easier reading

### 2. Options Sheet Enhancements

#### Column Structure:
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| questionId | optionId | label | nextId | feedbackIcon | feedbackTitle | feedbackMessage | question_text |

#### Data Validation:
- **Column A (questionId)**: Dropdown referencing Questions.A:A
- **Column D (nextId)**: Dropdown with question IDs + outcome IDs
- **Column H (question_text)**: Formula: `=VLOOKUP(A2,Questions.A:D,4,FALSE)` (shows question for context)

#### Conditional Formatting:
- **Group by Question**: Alternate background colors for each questionId group
- **Invalid References**: Highlight nextId values that don't exist in red
- **Missing Feedback**: Highlight rows missing feedback in yellow (optional)

### 3. Overview Sheet (New)

#### Purpose:
Combined read-only view showing complete question flow

#### Structure:
Shows hierarchical view:
```
Question: Which age group makes you light up the most?
├── 🌱 Little ones (0–12) → out_early_primary
├── 📚 Primary kids (5–12) → q_primary_path  
├── 🎒 Kids & teens (5–18) → q_ps_hpe
└── 🎤 Teens (12–18) → q_secondary_area
```

### 4. Validation Sheet (New)

#### Purpose:
Shows data quality issues and warnings

#### Checks:
- Questions without options
- Options with invalid nextId references  
- Missing required fields
- Orphaned options (questionId doesn't exist)
- Circular navigation references

## Implementation Steps

### Step 1: Set Up Named Ranges
Create these named ranges for easier formula references:
- `QuestionIds`: Questions.A:A
- `QuestionData`: Questions.A:F
- `OptionData`: Options.A:H
- `ValidNextIds`: Combined list of question IDs and outcome IDs

### Step 2: Add Data Validation

#### Questions Sheet:
```
B2:B = List from range: single,multiple
C2:C = List from range: cards,chips  
F2:F = Formula: =COUNTIF(Options.A:A,A2)
```

#### Options Sheet:
```
A2:A = List from range: QuestionIds
D2:D = List from range: ValidNextIds
H2:H = Formula: =IFERROR(VLOOKUP(A2,Questions.A:D,4,FALSE),"")
```

### Step 3: Add Conditional Formatting

#### Questions Sheet:
- **Rule 1**: `=$F2=0` → Red background (questions without options)
- **Rule 2**: `=MOD(ROW(),2)=0` → Light gray background (alternating rows)

#### Options Sheet:
- **Rule 1**: `=COUNTIF($A$2:A2,A2)=1` → Light blue background (first option of each question)
- **Rule 2**: `=AND(E2="",F2="",G2="")` → Yellow background (missing feedback)
- **Rule 3**: `=ISERROR(MATCH(D2,ValidNextIds,0))` → Red background (invalid nextId)

### Step 4: Create Overview Sheet

Use formulas to create a readable hierarchy:
```
=IF(A2<>A1,"Question: "&VLOOKUP(A2,Questions.A:D,4,FALSE),"")
=REPT("  ",1)&"├── "&C2&" → "&D2
```

### Step 5: Create Validation Sheet

Add formulas to check data quality:
```
Questions without options:
=FILTER(Questions.A:A,Questions.F:F=0)

Invalid nextId references:
=FILTER(Options.D:D,ISERROR(MATCH(Options.D:D,ValidNextIds,0)))

Orphaned options:
=FILTER(Options.A:A,ISERROR(MATCH(Options.A:A,Questions.A:A,0)))
```

## Benefits of Enhanced Structure

### For Staff:
- **Dropdown menus prevent typos** in critical ID fields
- **Color coding shows relationships** between questions and options
- **Real-time validation** catches errors immediately
- **Helper columns provide context** without switching sheets
- **Overview sheet shows big picture** without editing complexity

### For Administrators:
- **Validation sheet catches issues** before they break the quiz
- **Named ranges make formulas maintainable**
- **Structured validation prevents data corruption**
- **Easy to add new validation rules** as needed

### For System Reliability:
- **Prevents most common data entry errors**
- **Maintains referential integrity** between sheets
- **Provides early warning** of structural issues
- **Makes debugging easier** with clear error highlighting

## Usage Workflow

### Adding New Questions:
1. Add question in Questions sheet (dropdowns ensure valid values)
2. Add options in Options sheet (dropdown prevents invalid questionId)
3. Check Overview sheet to verify flow
4. Review Validation sheet for any issues

### Editing Existing Content:
1. Use helper columns to identify related data
2. Color coding shows which options belong to which questions
3. Real-time validation prevents breaking references
4. Overview provides context for navigation changes

This enhanced structure maintains the simplicity of separate sheets while adding powerful features to prevent errors and improve usability.