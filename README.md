# FinanceFlow AI 🚀

AI-Powered Budget Management & Statement Analyzer.

## Features
- **AI Statement Analysis**: Upload PDF credit card statements and let Gemini-3-Flash categorize your spending automatically.
- **Salary Slip (Bordro) Parsing**: Specialized extraction of income data from official salary slips.
- **Custom AI Personalities**: Switch between "Bro", "Accountant", and "Minimalist" coaching styles.
- **Local-First Architecture**: Your transactions are stored securely in your browser's local storage.
- **Progressive Web App (PWA)**: Installable on Android and iOS with offline support.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Jetpack Compose-inspired UI.
- **AI**: Google Gemini API (@google/genai).
- **Charts**: Recharts for financial visualization.
- **Storage**: Browser LocalStorage with indexed DB fallback via Service Workers.

## Setup
1. Ensure `process.env.API_KEY` is set with your Google Gemini API Key.
2. Deploy to Vercel or Netlify.
3. Open on your mobile device and "Add to Home Screen" for the full native experience.

## Development
```bash
# Conceptually (as this is an es6 module app)
# Just serve the root directory.
```

---
*Created by the Native Architect Prompt.*
