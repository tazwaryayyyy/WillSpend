# WillSpend

Most financial tools show you what you have. WillSpend shows you what you threw away by doing nothing.

It calculates the real cost of every passive financial decision you have made. The salary you never negotiated. The savings account you never switched. The investments you kept putting off. Then it puts an exact dollar amount on the damage and gives you a concrete plan to recover.

## What It Does

**Inaction Simulator** calculates compounded losses across:
- Salary gaps (what you could be earning vs what you earn now)
- Idle savings (low interest accounts vs high yield)
- Missed investments (compound growth you never captured)
- 401k match leaks (US only, leaving employer money on the table)
- SIP delays (India only, waiting too long to start investing)
- Forgotten subscriptions ( recurring charges for things you forgot about)
- Unrefinanced debt (paying high interest when you could pay less)

**AI Advisor** uses LLaMA 3.3 70B via Groq to generate a plain English summary of your damage. It includes location specific context ("that $40k was a down payment in Austin") and a week by week recovery roadmap.

**PDF Export** generates a clean downloadable report of your full analysis.

**Live Loss Ticker** updates your estimated total loss in real time as you fill out the form.

**US and India support** with localized currency and country specific calculations.

## Stack

- **Backend**: Python, FastAPI
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **AI**: Groq Cloud with LLaMA 3.3 70B
- **PDF**: jsPDF client side generation

## Running Locally

Backend:
```bash
cd backend
pip install -r ../requirements.txt
# Add GROQ_API_KEY to .env
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Make sure the frontend API calls point to `http://localhost:8000`.

---

Made by Tazwar Ahnaf Enan
