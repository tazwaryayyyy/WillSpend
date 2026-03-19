# 💀 WillSpend: The Financial Autopsy Engine

**"How much has doing nothing cost you?"**

Most financial tools tell you what you *have*. WillSpend tells you what you *could have had* if you hadn't been paralyzed by indecision. It’s a "Financial Autopsy" that calculates the exact dollar (or rupee) amount your passive decisions have quietly drained from your future—compounded over time.

Built for the **NextGen Product Lab Hackathon**.

---

## 🚀 The Vibe
WillSpend isn't a boring budget tracker. It’s a high-contrast, brutalist, and "brutally honest" tool designed to spark action through regret. We use a dark, premium aesthetic (glassmorphism, noise textures, and neon accents) to make the data hit harder.

## ✨ Features

### 1. The Inaction Simulator
Calculates losses across multiple "leak" categories:
- **Salary Gaps:** What you lost by not negotiating to market rate.
- **Idle Savings:** The cost of keeping the emergency fund in a 0.01% account instead of an HYSA.
- **Missed Investing:** The compounding tragedy of "waiting for a dip."
- **401k Match Leak (US):** Leaving free employer money on the table.
- **SIP Delay (India):** The heavy price of delaying your monthly investments.
- **Ghost Subscriptions:** Money lost to services you forgot you owned.
- **Unrefinanced Debt:** Extra interest paid on high-rate loans.

### 2. AI Advisor (Powered by Llama 3.3)
Our AI doesn't just give you numbers; it gives you perspective.
- **The Damage:** A plain-English summary of your financial tragedy.
- **Regret Stories:** Translates your loss into real-world terms based on your city (e.g., *"That $40k was a down payment on a condo in Austin"*).
- **Recovery Roadmap:** Three concrete steps you can take *this week* to stop the bleeding.

### 3. Cold Start Engine
Since it's hosted on Render's free tier, the backend can take a minute to wake up. We built a custom **Cold Start Overlay** that keeps you engaged with pulsing status updates and a realistic progress bar while the "engine" warms up.

### 4. Portable Autopsy (PDF Export)
Generate a clean, professional PDF report of your failures to keep as a reminder (or to show your actual financial advisor).

---

## 🛠️ Tech Stack

**Frontend:**
- **Vanilla HTML5/CSS3:** No frameworks, just raw performance and custom design tokens.
- **Chart.js:** For the "Damage Breakdown" visualization.
- **Marked.js:** To render the AI's markdown reports.
- **jsPDF:** For client-side PDF generation.

**Backend:**
- **FastAPI (Python):** High-performance async API.
- **Groq Cloud:** Running `llama-3.3-70b-versatile` for near-instant AI insights.
- **Pydantic:** For strict data validation and simulation models.

---

## 🏃 Running Locally

### Backend
1. Navigate to `/backend`.
2. Create a `.env` file with your `GROQ_API_KEY`.
3. Install dependencies: `pip install -r requirements.txt`.
4. Run the server: `uvicorn main:app --reload`.

### Frontend
1. Open `/frontend/index.html` in your browser (or use Live Server).
2. Ensure `API_BASE` in `app.js` is set to `http://localhost:8000`.

---

## 📜 License
Created by **Tazwar Ahnaf Enan** for the NextGen Product Lab Hackathon. © 2026.
