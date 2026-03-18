# WillSpend

Most people know what they spend. Nobody knows what they lost by standing still.

WillSpend is a financial autopsy. You put in your real numbers and it tells you exactly how much your passive decisions have cost you over the years. The salary you never negotiated. The savings account you never switched. The investments you kept putting off. It adds it all up, compounded, and puts a number on it.

Then an AI advisor translates that number into something real. Not percentages and projections. Actual things. Like what that money would have bought you, and what you can still do about it.

---

## What it looks at

**Salary gap** — the difference between what you earn and what the market pays for your role, multiplied across every month you stayed quiet.

**Idle savings** — your money sitting in a low-interest account while high-yield accounts existed the whole time.

**Missed investing** — what a modest monthly investment would have compounded into at a 10% average market return.

**401k match leak** (US only) — employer match you never claimed. That is free money that also compounds for 20 or 30 years.

**SIP delay** (India only) — the cost of pushing off a monthly SIP at a 12% Nifty 50 average return.

**Ghost subscriptions** — every forgotten monthly charge, added up across however many months it ran.

**Unrefinanced debt** — the extra interest you paid by never shopping for a better rate.

---

## How it works

You fill out a short profile. The backend runs compound math on every category. A live ticker at the bottom of the screen updates your estimated loss as you type. When you submit, you get a full breakdown chart category by category, and an AI generated report that tells you what the damage actually means and what to do this week, this month, and this year to start recovering.

---

## Stack

Backend is Python and FastAPI. AI is Groq running LLaMA 3.3 70B, completely free tier. Frontend is plain HTML, CSS, and JavaScript with Chart.js for the chart. Deployed on Render.

---

## Running it locally

Clone the repo and go into the folder.

```bash
git clone https://github.com/tazwaryayyyy/WillSpend.git
cd WillSpend
```

Set up a virtual environment and install dependencies.

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the root folder and add your Groq API key. You can get one free at console.groq.com, no credit card needed.

```
GROQ_API_KEY=your_key_here
```

Start the backend from the backend folder.

```bash
cd backend
uvicorn main:app --reload
```

Then open `frontend/index.html` in your browser.

---

## Built for

NextGen Product Lab Hackathon 2026 and Quest Hackathon 2026.

Made by Tazwar Ahnaf Enan
Built for
NextGen Product Lab Hackathon 2026 and Quest Hackathon 2026.
Made by Tazwar Ahnaf Enan
