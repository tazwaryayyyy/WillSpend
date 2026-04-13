# WillSpend 💰

WillSpend quantifies the compounded financial loss caused by procrastination and provides a localized roadmap to recover diverted wealth.

## Live Demo
[https://willspend.netlify.app](https://willspend.netlify.app)
**Try this first:** Start the ticker by scrolling, fill out the basic form, and drag the "What If I Wait?" delay slider to see how every second of inaction compounds your damage.

## Why This Exists
Most financial tools focuses on what you have or what you might gain. They fail to address the psychological weight of money already lost to indecision. WillSpend shifts the perspective to loss aversion, showing users the literal cost of staying idle to trigger immediate corrective behavior.

## Features

| Feature | What It Does | Why It Matters |
| :--- | :--- | :--- |
| **Discovery** | | |
| Live Loss Ticker | Streams a real-time incrementing cost of inaction directly in the hero headline | Emphasizes that every second of delay has a literal pecuniary cost |
| Smooth Onboarding | Transitions from zero-state counting to real data with a single scroll | Reduces friction for users who are anxious about facing their numbers |
| **Calculator** | | |
| Inaction Engine | Computes losses across salary gaps, idle savings, missed investments, and debt | Provides a comprehensive view of how multiple small delays add up to significant wealth destruction |
| Multicurrency Math | Calculates localized losses for US, India, and Bangladesh markets | Ensures the calculations respect regional realities like 401k matches or DPS yields |
| **Results & Insights** | | |
| Inaction Age Score | Calculates the total years of wealth accumulation lost to date | Provides an immediate emotional anchor for the magnitude of past mistakes |
| What If Delay Slider | Projects compounded damage 0 to 5 years into the future in real time | Visualizes the accelerating cost of continuing to do nothing |
| Recovery Projection | Visualizes "Do Nothing" vs "Follow the Plan" over 12 months with a "Recovery Zone" | Proves that immediate action can effectively stop the wealth bleed |
| Peer Comparison | Benchmarks user loss against median loss for their age group and country | Leverages social context to motivate users to perform above the average |
| AI Recovery Advisor | Generates a structured roadmap using LLaMA 3.3 70B via Groq | Replaces vague financial anxiety with specific, localized, actionable steps |
| **Export & Share** | | |
| PDF Export | Generates a professional multi-page report of the inaction analysis | Allows offline review and formal record-keeping of the recovery pledge |
| Share Results | Copies a formatted text summary of critical stats to the clipboard | Leverages social accountability to encourage others to face their numbers |

## System Architecture

```mermaid
graph TD
    Input[User Profile Input] --> Controller[FastAPI Backend]
    
    subgraph Engine [Calculation Engine]
        Controller --> US[US: 401k Match / Debt]
        Controller --> IN[India: SIP Delay / Savings]
        Controller --> BD[Bangladesh: DPS / bKash]
    end
    
    Controller --> LLM[Groq LLaMA 3.3 70B]
    
    subgraph UI [Results Dashboard]
        LLM --> AICards[AI Advisor Cards]
        Engine --> Age[Inaction Age]
        Engine --> Slider[Delay Slider]
        Engine --> Chart[Recovery Chart]
        Engine --> Peer[Peer Comparison]
        UI --> PDF[jsPDF Export]
        UI --> Share[Social Share]
    end
```

## Country Support

| Market | Specialized Calculation | Localized Context |
| :--- | :--- | :--- |
| **United States** | 401k Employer Match Leak | US Tax environments and S&P 500 (7%) growth rates |
| **India** | SIP (Systematic Investment Plan) Delay | Nifty 50 (12%) historical averages and high-yield savings |
| **Bangladesh** | DPS/FDR/Mobile Banking (bKash/Nagad) | Local DPS maturity rates (7%) and DSE (9%) averages |

## Local Development

### Backend (Python 3.11)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
**Required .env variables:**
- `GROQ_API_KEY`: Your Groq Cloud API key

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
**Required .env variables:**
- `VITE_API_URL`: Your local or production backend URL

## How the AI Advisor Works
The AI Advisor utilizes LLaMA 3.3 70B via the Groq SDK for high-speed inference. The engine injects localized calculation results into a strict system prompt that demands a narrative "Regret Story" and a structured recovery plan. The roadmap is forced into a JSON schema wrapped in custom `<roadmap>` tags. The backend implements regex-based extraction to separate the human-readable advice from the machine-readable roadmap items, with a graceful fallback to text-only mode if the model deviates from the schema.

## Built For
Built for the **Global Fusion Hackathon 2026** under the **FinTech / AI** track. This project addresses the global impact mandate by providing a specialized financial tool that adapts to different economic structures, from 401k-centric US retirement to DPS-heavy savings in Bangladesh.

## What's Next
1. **UK Integration**: Add a UK specific mode with ISA and pension gap calculators.
2. **Bangladesh Mobile App**: Dedicated mobile application for bKash users with offline calculation support.
3. **Global Benchmarking**: Aggregate anonymous data to publish real-time median inaction costs per country from actual user inputs.
