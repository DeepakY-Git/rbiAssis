# 🏦 RBI Assistant Exam Preparation Portal

A comprehensive, browser-based exam preparation app for the **RBI Assistant examination**, built for candidates with limited preparation time (daily 6–8 PM study slot, ~1 month window).

## ✨ Features

### 📚 Previous Year Questions (PYQs) — Subject-wise
All PYQs are organized by subject and topic:
- 🧩 **Reasoning Ability** — Syllogism, Blood Relations, Coding-Decoding, Seating Arrangement, Direction Sense, Number Series, Inequalities, Puzzles, Input-Output
- 🔢 **Numerical Ability** — Number System, Percentage, Profit & Loss, SI/CI, Time & Work, Speed & Distance, DI, Ratio, Mensuration, Average
- 📝 **English Language** — Reading Comprehension, Cloze Test, Error Detection, Fill in Blanks, Para Jumbles, Vocabulary
- 🌐 **General Awareness** — RBI & Banking, Indian Economy, Current Affairs, Govt Schemes, International Organizations
- 💻 **Computer Knowledge** — Basics, MS Office, Internet & Networking, Security, Banking Technology

### 🎯 Mock Tests
- **Quick Subject Tests** — 20 questions per subject with 20-minute timer
- **Prelims Mock** — 100 questions in 60 minutes (simulating actual exam)
- **Mains Mock** — 200 questions in 135 minutes (all 5 subjects)
- **PYQ Marathon** — Year-wise question sets (2021, 2022, 2023)

### 📅 4-Week Study Schedule
Optimized daily plan for 6:00–8:00 PM slot with:
- **Week 1**: Foundation – Concept Building
- **Week 2**: Deep Dive – Advanced Topics
- **Week 3**: Mains Preparation
- **Week 4**: Final Revision & Full Mocks

### 📖 Concept Notes
Key formulas, shortcuts, tips, and tricks for every subject.

### 📊 Progress Tracking
Your answers and scores are saved in browser localStorage.

## 🚀 Getting Started

Simply open `index.html` in any modern web browser. No installation, no server needed!

```bash
# Option 1: Open directly
open index.html

# Option 2: Serve locally (recommended)
python3 -m http.server 8080
# Then visit http://localhost:8080
```

## 📋 RBI Assistant Exam Pattern

### Preliminary Examination (60 min, 100 marks)
| Section | Questions | Marks | Time |
|---|---|---|---|
| English Language | 30 | 30 | 20 min |
| Numerical Ability | 35 | 35 | 20 min |
| Reasoning Ability | 35 | 35 | 20 min |

### Mains Examination (135 min, 200 marks)
| Section | Questions | Marks | Time |
|---|---|---|---|
| Reasoning | 40 | 40 | 30 min |
| English Language | 40 | 40 | 30 min |
| Numerical Ability | 40 | 40 | 30 min |
| General Awareness | 40 | 40 | 25 min |
| Computer Knowledge | 40 | 40 | 20 min |

## 📁 Project Structure

```
rbiAssis/
├── index.html              # Main application (single page)
├── css/
│   └── style.css           # All styles
├── js/
│   └── app.js              # Application logic
└── data/
    ├── study-plan.json     # 4-week schedule + exam pattern
    └── pyqs/
        ├── reasoning.json          # Reasoning PYQs by topic
        ├── quantitative.json       # Numerical Ability PYQs
        ├── english.json            # English Language PYQs
        ├── general-awareness.json  # GA PYQs
        └── computer-knowledge.json # Computer Knowledge PYQs
```

## 🎯 Study Strategy

- **Daily slot**: 6:00 PM – 8:00 PM (2 hours max)
- **Week 1–2**: Concept building + topic-wise practice
- **Week 3**: Full section tests (Mains pattern)
- **Week 4**: Full mock tests + final revision
- **PYQs first**: Understand the pattern before diving into concepts

Good luck with your RBI Assistant examination! 🏦✨
