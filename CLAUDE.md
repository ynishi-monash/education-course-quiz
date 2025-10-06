# Education Course Quiz - Memory Bank

## Project Overview
Interactive quiz application to help students find suitable education courses at Monash University. Built with vanilla HTML, CSS, and JavaScript.

## Key Architecture Decisions

### Design System
- **Primary Brand Color**: `--monash-blue: #016DAE` (official Monash University blue)
- **Accent Color**: `--golden-yellow: #FFBA00` (changed from pink per user request)
- **Typography**: System fonts with clear hierarchy
- **Icons**: Font Awesome 6.4.0 for consistency and scalability

### Layout & Responsive Design
- **Content Width**: 900px max-width (increased from 600px for better screen utilization)
- **Grid System**: 
  - Mobile: 2 columns for answer options
  - Desktop: 4 columns for answer options
  - Auto-fit grid with centering when fewer than max columns
- **Button Style**: Icon-over-text layout changed to inline (icon + text side-by-side)

### Data Structure
- **Google Sheets**: Primary data source via Apps Script (questions, options, outcomes, metadata)
- **Templates**: `templates/{outcome-id}.html` - Custom HTML content per result

## File Structure
```
/
├── index.html              # Main application
├── style.css              # All styling
├── script.js              # Quiz logic and interactions
├── templates/             # Custom result templates
│   ├── out_early_primary.html
│   ├── out_primary_double.html
│   ├── out_primary_single.html
│   ├── out_ps_hpe.html
│   ├── out_ps_inclusive.html
│   ├── out_ps_general.html
│   ├── out_sec_arts_lang_media.html
│   ├── out_sec_business_econ.html
│   ├── out_sec_music.html
│   ├── out_sec_science_tech.html
│   ├── out_sec_visual_arts.html
│   └── out_sec_hpe.html
├── google-apps-script/    # Google Sheets integration
│   ├── Code.gs           # Apps Script API
│   ├── questions.csv     # Source data for import
│   ├── options.csv       # Source data for import
│   └── outcomes.csv      # Source data for import
└── CLAUDE.md             # This memory bank
```

## Key Features Implemented

### Personalization
- Name collection at start
- School year selection (Year 10/11/12/Neither/Parent-Guardian)
- Special parent/guardian guidance flow
- Name interpolation throughout experience

### Quiz Flow
- Decision tree navigation based on question responses
- Configurable feedback messages per question
- Auto-advance on option selection (no "Next" buttons)
- Full-screen interstitial feedback with continue button
- Back button functionality with history

### Result System
- Custom HTML templates loaded per outcome
- Combined program info and template content in single box
- Optional program notes (hidden if empty)
- Primary CTA ("Explore course") integrated in program box
- Secondary action ("Start over") separate and subtle

### Icon System
- Font Awesome integration replacing all emojis
- Emoji-to-FontAwesome mapping in `mapEmojiToFontAwesome()`
- Consistent Monash blue for answer option icons
- Inline button layout (icon + text horizontal)

## Important Implementation Details

### CSS Grid Behavior
```css
/* Centers options when fewer than max columns */
grid-template-columns: repeat(auto-fit, minmax(200px, 200px));
justify-content: center;
```

### Template Loading
- Async fetch of `templates/{outcomeId}.html`
- Graceful degradation if template missing
- No error to user if template fails to load

### Feedback System
- Per-question enable/disable via `question.feedback.enabled`
- Custom messages in `question.feedback.messages`
- Name placeholder support with `{name}` replacement
- Fallback to default messages if specific message missing

### Button Styling Pattern
```html
<button class="btn btn-primary btn-large">
  <span class="btn-icon"><i class="fas fa-icon-name"></i></span>
  <span class="btn-text">Button Text</span>
</button>
```

## Program Outcomes
12 total outcomes mapping to education programs:
- **Primary/Early Childhood**: `out_early_primary`, `out_primary_double`, `out_primary_single`
- **Primary & Secondary**: `out_ps_hpe`, `out_ps_inclusive`, `out_ps_general`  
- **Secondary Specializations**: `out_sec_arts_lang_media`, `out_sec_business_econ`, `out_sec_music`, `out_sec_science_tech`, `out_sec_visual_arts`, `out_sec_hpe`

## Campus Locations
- **Clayton Campus**: Main campus for most secondary programs
- **Peninsula Campus**: Primary education and HPE programs
- **Caulfield Campus**: Some business and fine art units

## Development Notes

### Testing Commands
- No specific test framework implemented
- Manual testing across different screen sizes required
- Test all outcome paths to verify templates load correctly

### Browser Support
- Modern browsers supporting ES6+ (async/await, fetch API)
- Font Awesome CDN dependency
- CSS Grid and Flexbox required

### Performance Considerations
- All assets loaded upfront except templates
- Templates loaded on-demand per result
- Small file sizes for fast loading
- Font Awesome CDN for icon delivery

## Common Maintenance Tasks

### Adding New Programs
1. Add outcome to `questions.json` outcomes array
2. Add program data to `programs.json`
3. Create template file `templates/{outcome-id}.html`
4. Update question flow to point to new outcome

### Updating Templates
- Edit relevant HTML file in `templates/` directory
- No other changes needed (auto-loaded)
- Keep format consistent: degree info, what you'll learn, career opportunities

### Styling Updates
- All styles in single `style.css` file
- CSS custom properties in `:root` for theming
- Mobile-first responsive approach

## Known Limitations
- No persistent state (refresh loses progress)
- No analytics or tracking implemented
- Single language support (English)
- No accessibility audit completed (basic ARIA implemented)

## Future Enhancement Ideas
- Progress saving to localStorage
- Multi-language support
- Analytics integration
- Enhanced accessibility features
- Print-friendly result pages
- Social sharing capabilities