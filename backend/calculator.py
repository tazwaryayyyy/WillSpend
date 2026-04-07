from models import UserProfile, SimulationResult, InactionItem
from typing import List
from cache_manager import cached_simulation


def future_value_missed(monthly_amount: float, years: int, annual_rate: float = 0.10) -> float:
    """Calculate how much you'd have if you invested monthly_amount for `years` at annual_rate."""
    if years <= 0 or monthly_amount <= 0:
        return 0.0
    r = annual_rate / 12
    n = years * 12
    fv = monthly_amount * (((1 + r) ** n - 1) / r)
    return round(fv, 2)


def compound_interest_loss(balance: float, rate_diff: tuple, years: int) -> float:
    """Loss from keeping money in a low-yield account vs high-yield, monthly compounding."""
    if years <= 0 or balance <= 0:
        return 0.0
    
    # Monthly compounding formula: A = P(1 + r/n)^(nt)
    n = 12  # monthly
    r_low = (rate_diff[0] / 100) / n
    r_high = (rate_diff[1] / 100) / n
    periods = years * n

    low = balance * ((1 + r_low) ** periods)
    high = balance * ((1 + r_high) ** periods)
    
    return round(high - low, 2)


def salary_loss(current: float, market: float, years: int) -> float:
    """Total salary left on the table over the years."""
    diff = market - current
    if diff <= 0 or years <= 0:
        return 0.0
    return round(diff * 12 * years, 2)


def debt_interest_overpaid(balance: float, current_rate: float, refinance_rate: float, years: int) -> float:
    """Extra interest paid by not refinancing, monthly compounding on the difference."""
    if current_rate <= refinance_rate or years <= 0 or balance <= 0:
        return 0.0
    
    n = 12
    r_curr = (current_rate / 100) / n
    r_refi = (refinance_rate / 100) / n
    periods = years * n
    
    # Estimate total interest paid on a flat balance (worst case/simple comparison)
    # but using compounding logic for a more "pessimistic" cost of inaction
    curr_total = balance * ((1 + r_curr) ** periods)
    refi_total = balance * ((1 + r_refi) ** periods)
    
    return round(curr_total - refi_total, 2)


def recovery_months(lost_amount: float, monthly_income: float) -> int:
    """Rough estimate of months needed to recover the lost amount."""
    if monthly_income <= 0 or lost_amount <= 0:
        return 0
    savings_rate = 0.20  # assume they save 20% of income
    monthly_savings = monthly_income * savings_rate
    return round(lost_amount / monthly_savings)


def get_action_hint(category: str) -> str:
    """Get suggested action hint based on category."""
    hints = {
        "Salary Not Negotiated": "negotiate your next raise",
        "Savings Account Not Switched": "switch to high-yield savings", 
        "Not Investing Monthly": "start automated monthly investing",
        "401k Match Leak": "enroll in 401k up to match",
        "SIP Delay Cost": "start your SIP immediately",
        "Debt Not Refinanced": "apply for balance transfer card"
    }
    
    # Handle subscription categories
    if "Unused Subscription" in category:
        return "cancel unused subscriptions"
    
    return hints.get(category, "take action to recover losses")

def estimate_recovery_1year(total_cost: float, category: str) -> float:
    """Estimate how much can be recovered in 1 year."""
    recovery_rates = {
        "Salary Not Negotiated": 0.5,  # 50% of annual loss recoverable via raise
        "Savings Account Not Switched": 1.0,  # 100% recoverable by switching
        "Not Investing Monthly": 0.3,  # Only part recoverable in 1 year
        "401k Match Leak": 1.0,  # 100% recoverable by enrolling
        "SIP Delay Cost": 0.4,  # Partial recovery in 1 year
        "Debt Not Refinanced": 0.65  # 65% via lower interest
    }
    
    if "Unused Subscription" in category:
        return 1.0  # 100% recoverable by canceling
    
    rate = recovery_rates.get(category, 0.5)
    return round(total_cost * rate, 2)

@cached_simulation(ttl_seconds=600)
def run_simulation(profile: UserProfile) -> SimulationResult:
    items: List[InactionItem] = []
    currency = "₹" if profile.country == "India" else "$"

    # 1. Salary not negotiated
    s_loss = salary_loss(profile.current_salary, profile.market_rate_salary, profile.years_at_same_salary)
    if s_loss > 0:
        category = "Salary Not Negotiated"
        items.append(InactionItem(
            category=category,
            description=f"You've been earning {currency}{profile.current_salary:,.0f}/mo when the market rate is {currency}{profile.market_rate_salary:,.0f}/mo for {profile.years_at_same_salary} year(s).",
            total_cost=s_loss,
            recovery_months=recovery_months(s_loss, profile.monthly_income),
            action_hint=get_action_hint(category),
            estimated_recovery_1year=estimate_recovery_1year(s_loss, category)
        ))

    # 2. Savings account not switched
    savings_loss = compound_interest_loss(
        profile.savings_balance,
        (profile.current_savings_rate, profile.high_yield_savings_rate),
        profile.years_savings_idle
    )
    if savings_loss > 0:
        category = "Savings Account Not Switched"
        items.append(InactionItem(
            category=category,
            description=f"Your {currency}{profile.savings_balance:,.0f} sitting at {profile.current_savings_rate}% instead of {profile.high_yield_savings_rate}% for {profile.years_savings_idle} year(s).",
            total_cost=savings_loss,
            recovery_months=recovery_months(savings_loss, profile.monthly_income),
            action_hint=get_action_hint(category),
            estimated_recovery_1year=estimate_recovery_1year(savings_loss, category)
        ))

    # 3. Not investing monthly
    invest_loss = future_value_missed(profile.monthly_investment_missed, profile.years_not_investing)
    if invest_loss > 0:
        category = "Not Investing Monthly"
        items.append(InactionItem(
            category=category,
            description=f"Not investing {currency}{profile.monthly_investment_missed:,.0f}/mo for {profile.years_not_investing} year(s) at 10% avg market return.",
            total_cost=invest_loss,
            recovery_months=recovery_months(invest_loss, profile.monthly_income),
            action_hint=get_action_hint(category),
            estimated_recovery_1year=estimate_recovery_1year(invest_loss, category)
        ))

    # 4. 401k Match Leak (US Only)
    if profile.country == "US" and profile.employer_match_pct > 0 and profile.years_not_matching_401k > 0:
        match_leak_pct = max(0, profile.employer_match_pct - profile.user_contribution_pct)
        # Monthly amount lost is % of monthly monthly salary
        # Assuming current_salary is monthly
        monthly_leak = (match_leak_pct / 100) * profile.current_salary
        if monthly_leak > 0:
            match_loss = future_value_missed(monthly_leak, profile.years_not_matching_401k, 0.105)
            category = "401k Match Leak"
            items.append(InactionItem(
                category=category,
                description=f"You missed out on a {match_leak_pct}% employer match for {profile.years_not_matching_401k} year(s). That's free money left on the table.",
                total_cost=match_loss,
                recovery_months=recovery_months(match_loss, profile.monthly_income),
                action_hint=get_action_hint(category),
                estimated_recovery_1year=estimate_recovery_1year(match_loss, category)
            ))

    # 5. SIP Delay Cost (India Only)
    if profile.country == "India" and profile.monthly_sip_missed > 0 and profile.years_sip_delayed > 0:
        sip_loss = future_value_missed(profile.monthly_sip_missed, profile.years_sip_delayed, 0.12)
        category = "SIP Delay Cost"
        items.append(InactionItem(
            category=category,
            description=f"Delaying your {currency}{profile.monthly_sip_missed:,.0f}/mo SIP for {profile.years_sip_delayed} year(s) at 12% Nifty 50 avg return.",
            total_cost=sip_loss,
            recovery_months=recovery_months(sip_loss, profile.monthly_income),
            action_hint=get_action_hint(category),
            estimated_recovery_1year=estimate_recovery_1year(sip_loss, category)
        ))

    # 6. Subscriptions
    for sub in profile.subscriptions:
        cost = round(sub.monthly_cost * sub.months_active, 2)
        if cost > 0:
            category = f"Unused Subscription: {sub.name}"
            items.append(InactionItem(
                category=category,
                description=f"{currency}{sub.monthly_cost}/mo for {sub.months_active} months you probably forgot about.",
                total_cost=cost,
                recovery_months=recovery_months(cost, profile.monthly_income),
                action_hint=get_action_hint(category),
                estimated_recovery_1year=estimate_recovery_1year(cost, category)
            ))

    # 7. Debts not refinanced
    for debt in profile.debts:
        d_loss = debt_interest_overpaid(debt.balance, debt.current_rate, debt.refinance_rate, debt.years)
        if d_loss > 0:
            category = f"Debt Not Refinanced: {debt.name}"
            items.append(InactionItem(
                category=category,
                description=f"Paying {debt.current_rate}% on {currency}{debt.balance:,.0f} instead of refinancing at {debt.refinance_rate}% for {debt.years} year(s).",
                total_cost=d_loss,
                recovery_months=recovery_months(d_loss, profile.monthly_income),
                action_hint=get_action_hint(category),
                estimated_recovery_1year=estimate_recovery_1year(d_loss, category)
            ))

    # Sort by damage — highest first
    items.sort(key=lambda x: x.total_cost, reverse=True)
    total = round(sum(i.total_cost for i in items), 2)
    
    # Create categories breakdown
    categories = {}
    for item in items:
        # Extract base category (remove specific details like subscription names)
        base_category = item.category.split(":")[0].strip()
        if base_category not in categories:
            categories[base_category] = {
                "amount": 0,
                "action_hint": item.action_hint,
                "estimated_recovery_1year": 0
            }
        categories[base_category]["amount"] += item.total_cost
        categories[base_category]["estimated_recovery_1year"] += item.estimated_recovery_1year
    
    # Round category amounts
    for cat in categories:
        categories[cat]["amount"] = round(categories[cat]["amount"], 2)
        categories[cat]["estimated_recovery_1year"] = round(categories[cat]["estimated_recovery_1year"], 2)

    return SimulationResult(total_inaction_cost=total, items=items, categories=categories)
