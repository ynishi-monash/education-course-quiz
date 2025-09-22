# POC Build Brief — “Career Crush”-style Quiz (Client-side Demo)

This brief defines **content, behaviour and quality bars** for a playful, single-page quiz that matches users to an education pathway, using casual, emoji-friendly copy.

## 1) Objectives & constraints

- **Goal:** Users answer a tiny branching quiz and land on a clear outcome card with a course pathway and short blurb.
- **Scope:** Client-side only. No back-end, no analytics, no email capture.
- **Tone:** Casual, upbeat, AU English.
- **Privacy:** No data sent anywhere. Session can be kept in memory or browser storage if needed.

## 2) Data you can assume

- **Questions JSON:** `questions.json` (provided).
- **Programs JSON:** create a small file the UI can read, with these IDs and fields:

```json
[
  {
    "id": "prog_ecpe",
    "title": "Bachelor of Early Childhood & Primary Education",
    "campus": "Peninsula",
    "url": "#",
    "notes": "Play-based learning; birth–12."
  },
  {
    "id": "prog_primary_double",
    "title": "Bachelor of Education (Primary) + Double Degree",
    "campus": "Clayton (some units Caulfield)",
    "url": "#",
    "notes": "Combine with Arts/Business/Fine Art/Music/Science."
  },
  {
    "id": "prog_primary_single",
    "title": "Bachelor of Primary Education",
    "campus": "Peninsula",
    "url": "#",
    "notes": "Teach F–6 across all curriculum areas."
  },
  {
    "id": "prog_ps_hpe",
    "title": "Primary & Secondary Health and Physical Education",
    "campus": "Peninsula",
    "url": "#",
    "notes": "Wellbeing, movement, coaching."
  },
  {
    "id": "prog_ps_inclusive",
    "title": "Primary & Secondary Inclusive & Special Education",
    "campus": "Clayton",
    "url": "#",
    "notes": "Support diverse learners; inclusion focus."
  },
  {
    "id": "prog_ps_general",
    "title": "Primary & Secondary Education",
    "campus": "Clayton",
    "url": "#",
    "notes": "Teach across stages; specialise at secondary."
  },
  {
    "id": "prog_sec_arts",
    "title": "Secondary Ed (Hons) + Arts",
    "campus": "Clayton",
    "url": "#",
    "notes": "Pick two from languages, humanities, media, psychology, drama."
  },
  {
    "id": "prog_sec_business",
    "title": "Secondary Ed (Hons) + Business",
    "campus": "Clayton (Business at Caulfield)",
    "url": "#",
    "notes": "Accounting, business mgmt, economics, legal."
  },
  {
    "id": "prog_sec_music",
    "title": "Secondary Ed (Hons) + Music",
    "campus": "Clayton",
    "url": "#",
    "notes": "Music specialisation."
  },
  {
    "id": "prog_sec_science",
    "title": "Secondary Ed (Hons) + Science",
    "campus": "Clayton",
    "url": "#",
    "notes": "Maths, bio, chem, physics, psych, digital tech."
  },
  {
    "id": "prog_sec_fineart",
    "title": "Secondary Ed (Hons) + Fine Art",
    "campus": "Clayton (Fine Art at Caulfield)",
    "url": "#",
    "notes": "Visual arts teaching."
  },
  {
    "id": "prog_sec_hpe",
    "title": "Secondary Health & Physical Education",
    "campus": "Peninsula",
    "url": "#",
    "notes": "Specialist HPE; can add a third area."
  }
]
```

3. Expected behaviours
   • Render each question according to type and ui.
   • Enforce selection before continuing; allow going back.
   • Show a thin progress indicator (0–100%).
   • On outcome nodes, render a result card:
   • Outcome title + 1–2 line blurb.
   • Pull programId → programme details from Programs JSON.
   • Button: “Explore course” (dead link # in demo).
   • “Start over” action resets the quiz.

4. Visual style (high level)
   • Bright gradients (orange ↔ pink), soft rounded cards, pill buttons.
   • Emojis on options for warmth and scannability.
   • Subtle animations for transitions and result reveal.
   • Mobile-first layout; tap targets ≥44px.

5. Accessibility (must-haves)
   • Keyboard operable; visible focus rings.
   • Semantic elements and ARIA where needed.
   • Respect prefers-reduced-motion.
   • Labels on interactive controls.

6. Copy style
   • Friendly, concise, AU spelling (“organise”, “enrolment”, “programme” optional).
   • Keep explanations short; the demo is about feel, not comprehensiveness.

7. Acceptance criteria
   • All branches in questions.demo.json resolve to a valid outcome and programme card.
   • No network calls except loading local JSON/assets.
   • Works on recent Chrome/Safari/Firefox (mobile + desktop).
   • Refresh during quiz does not break the flow (resume or restart is OK).
