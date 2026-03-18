import os
from groq import Groq
from models import SimulationResult, UserProfile
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def generate_report(simulation: SimulationResult, profile: UserProfile) -> str:
    items_text = "\n".join([
        f"- {item.category}: ${item.total_cost:,.2f} lost | Recovery: ~{item.recovery_months} months"
        for item in simulation.items
    ])

    location_context = f"based in {profile.city}, {profile.country}" if profile.city else f"based in {profile.country}"

    prompt = f"""You are a brutally honest but empathetic financial advisor.
    
A {profile.age}-year-old with a monthly income of ${profile.monthly_income:,.0f} {location_context} has just run a Cost of Inaction analysis. Here are the results:

Total money lost due to financial inaction: ${simulation.total_inaction_cost:,.2f}

Breakdown:
{items_text}

Write a structured report with these 3 specific sections:

1. THE DAMAGE — A 3-4 sentence plain-English summary of what their inaction has truly cost them. 

2. REGRET STORIES — For their #1 biggest inaction item, tell a "Regret Story". Translate that dollar amount into real-world terms relative to their location ({profile.city}, {profile.country}). For example, "That $42,000 would have been a down payment on a 2-bedroom in Austin, Texas" or "That's 5 years of private school tuition in Mumbai." Make it hit hard.

3. RECOVERY ROADMAP — Give 3 concrete, specific actions they can take THIS WEEK, THIS MONTH, and THIS YEAR to start recovering. 

Keep the total response under 400 words. Use markdown headings (##) for sections."""

    try:
        response = client.chat.completions.create(
            # Using the same model as before
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"The AI Advisor is currently offline due to a connection error. However, your data is visible above. (Error: {str(e)})"
