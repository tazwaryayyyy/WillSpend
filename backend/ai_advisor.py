import os
from models import SimulationResult, UserProfile
from dotenv import load_dotenv
from ai_client import get_ai_response
from cache_manager import cached_ai_call

load_dotenv()


@cached_ai_call(ttl_seconds=300)
def generate_report(simulation: SimulationResult, profile: UserProfile, category_losses: dict = None) -> str:
    currency = "৳" if profile.country == "Bangladesh" else ("₹" if profile.country == "India" else "$")
    
    # Format category losses for the prompt
    if category_losses:
        losses_formatted = "\n".join([f"- {cat}: {currency}{amt:,.2f}" for cat, amt in category_losses.items()])
    else:
        # Fallback to simulation items if dict not provided
        losses_formatted = "\n".join([
            f"- {item.category}: {currency}{item.total_cost:,.2f}"
            for item in simulation.items
        ])

    location_context = f"based in {profile.city}, {profile.country}" if profile.city else f"based in {profile.country}"
    
    localization_context = {
        'Bangladesh': "৳50,000 = roughly one month rent in Dhaka",
        'India': "₹50,000 = roughly two months groceries for a family of 4",
        'US': "$10,000 = roughly 3 months emergency fund"
    }.get(profile.country, "$10,000 = roughly 3 months emergency fund")

    prompt = f"""You are a direct, no-nonsense financial recovery advisor. You have access to the user's exact calculated losses by category. Every recommendation you make must reference a specific number from their data. Never give generic advice.

The user's losses are:
{losses_formatted}

Rules:
1. Open with their single biggest loss category and its exact amount
2. Structure your response as ranked priorities — biggest loss first
3. For each category give ONE specific action with ONE specific number (minimum contribution, exact account type, exact rate available to them)
4. Never say "consider", "might", "could" — use direct commands
5. Enforce these exact replacements in your language:
   - "consider starting" -> "Start"
   - "consider opening" -> "Open"
   - "you might benefit from" -> "This gives you"
   - "could help you" -> "This stops"
   - "you may want to" -> "Do this:"
   - "you should consider" -> "Do this:"
   - "it may be worth" -> "This is worth"
   - "try to" -> (delete it)
   - "you could" -> "You can"
   - "might want to" -> (use a direct command)
6. Reference {profile.country} specific products only (DPS, bKash, SIP, HYSA, 401k — whatever applies)
7. Return the roadmap in <roadmap> tags as JSON:
   [{"{"}"week": 1, "title": "", "action": "", "impact": "", "category": "", "amount_recovered": 0{"}"}]
8. Keep the summary paragraph under 4 sentences
9. Never use the words: innovative, seamless, powerful, leverage, robust

Loss context for localization:
{localization_context}

User is {profile.age} years old and {location_context}. Total loss: {currency}{simulation.total_inaction_cost:,.2f}

Write the summary paragraph first, followed by the roadmap JSON."""

    try:
        response = get_ai_response(prompt, f"simulation_{simulation.total_inaction_cost}_profile_{profile.age}_{profile.country}")
        return response
    except Exception as e:
        raise Exception(f"AI Advisor processing failed: {str(e)}")
