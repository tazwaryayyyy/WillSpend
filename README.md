# WillSpend

Most financial tools show you what you have. WillSpend shows you what you threw away by doing nothing.

It runs a compound simulation across every passive financial decision you've made — the salary you never negotiated, the savings account you never switched, the investments you kept putting off — and puts an exact dollar amount on the damage. Then an AI advisor tells you what that number actually means in real-world terms, and what you can do about it this week.

---

## Features

**Inaction Simulator** — calculates compounded losses across salary gaps, idle savings, missed investments, 401k match leaks (US), SIP delays (India), forgotten subscriptions, and unrefinanced debt.

**AI Advisor** — powered by LLaMA 3.3 70B via Groq. Generates a plain-English damage summary, a location-aware regret story ("that $40k was a down payment in Austin"), and a concrete recovery roadmap.

**Cold Start Overlay** — the backend runs on Render's free tier and sleeps after inactivity. A custom overlay with status messages and a progress bar keeps users informed during the wake-up instead of showing a broken app.

**PDF Export** — generates a clean downloadable report of the full analysis using jsPDF, client-side.

**Live Loss Ticker** — a sticky bar at the bottom updates your estimated total loss in real time as you fill out the form.

**US and India support** — 401k match leak for US users, SIP delay cost for India users, with localized currency throughout.

---

## Stack

Backend is Python and FastAPI. AI inference runs on Groq cloud using `llama-3.3-70b-versatile`. Frontend is vanilla HTML, CSS, and JavaScript with Chart.js, Marked.js, and jsPDF. Deployed on Render and Netlify.

---

## Running locally

```bash
# Backend
cd backend
pip install -r ../requirements.txt
# Add GROQ_API_KEY to .env
uvicorn main:app --reload

# Frontend
# Open frontend/index.html in your browser
# Make sure API_BASE in app.js is set to http://localhost:8000
```

---

Built for Quest Hackathon 2026, Dev Annual Hackathon, and ImpactHacks 2026.

Made by Tazwar Ahnaf Enan
