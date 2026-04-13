import os
from models import SimulationResult, UserProfile
from dotenv import load_dotenv
from ai_client import get_ai_response
from cache_manager import cached_ai_call

load_dotenv()


@cached_ai_call(ttl_seconds=300)
def generate_report(simulation: SimulationResult, profile: UserProfile) -> str:
    currency = "৳" if profile.country == "Bangladesh" else ("₹" if profile.country == "India" else "$")
    
    items_text = "\n".join([
        f"- {item.category}: {currency}{item.total_cost:,.2f} lost | Recovery: ~{item.recovery_months} months"
        for item in simulation.items
    ])

    location_context = f"based in {profile.city}, {profile.country}" if profile.city else f"based in {profile.country}"
    
    bd_context = ""
    if profile.country == "Bangladesh":
        bd_context = """
        Additional Context for Bangladesh:
        - Currency: BDT (৳)
        - Reference points: "৳50,000 is roughly one month rent in Dhaka", "৳1,000,000 is a down payment on a flat in Chattogram"
        - Mention bKash, Nagad, DPS, and Bangladesh Bank FD rates naturally in the advice.
        - Recovery roadmap should reference locally available products like DPS, FDR, and Sanchayapatra.
        """

    prompt = f"""You are a brutally honest but empathetic financial advisor.
    
A {profile.age}-year-old with a monthly income of {currency}{profile.monthly_income:,.0f} {location_context} has just run a Cost of Inaction analysis. Here are the results:

Total money lost due to financial inaction: {currency}{simulation.total_inaction_cost:,.2f}

Breakdown:
{items_text}

{bd_context}

Write a structured report with these 3 specific sections:

1. THE DAMAGE — A 3-4 sentence plain-English summary of what their inaction has truly cost them. 

2. REGRET STORIES — For their #1 biggest inaction item, tell a "Regret Story". Translate that dollar amount into real-world terms relative to their location ({profile.city}, {profile.country}). For example, "That {currency}42,000 would have been a down payment on a 2-bedroom in Austin, Texas" or "That's 5 years of private school tuition in Mumbai." Make it hit hard.

3. RECOVERY ROADMAP — Provide a recovery roadmap in JSON format wrapped inside <roadmap> tags.

Format the roadmap JSON EXACTLY like this (nothing else after the tag):
<roadmap>
[
  {"week": 1, "title": "...", "action": "...", "impact": "..."},
  {"week": 2, "title": "...", "action": "...", "impact": "..."},
  {"month": 1, "title": "...", "action": "...", "impact": "..."},
  {"year": 1, "title": "...", "action": "...", "impact": "..."}
]
</roadmap>

Keep the total response (including JSON) under 500 words. Use markdown headings (##) for sections 1 and 2."""


    try:
        response = get_ai_response(prompt, f"simulation_{simulation.total_inaction_cost}_profile_{profile.age}_{profile.country}")
        return response
    except Exception as e:
        return f"The AI Advisor is currently offline due to a connection error. However, your data is visible above. (Error: {str(e)})"
