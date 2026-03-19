from models import UserProfile, SimulationResult, InactionItem
from typing import List


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


def run_simulation(profile: UserProfile) -> SimulationResult:
    items: List[InactionItem] = []
    currency = "₹" if profile.country == "India" else "$"

    # 1. Salary not negotiated
    s_loss = salary_loss(profile.current_salary, profile.market_rate_salary, profile.years_at_same_salary)
    if s_loss > 0:
        items.append(InactionItem(
            category="Salary Not Negotiated",
            description=f"You've been earning {currency}{profile.current_salary:,.0f}/mo when the market rate is {currency}{profile.market_rate_salary:,.0f}/mo for {profile.years_at_same_salary} year(s).",
            total_cost=s_loss,
            recovery_months=recovery_months(s_loss, profile.monthly_income)
        ))

    # 2. Savings account not switched
    savings_loss = compound_interest_loss(
        profile.savings_balance,
        (profile.current_savings_rate, profile.high_yield_savings_rate),
        profile.years_savings_idle
    )
    if savings_loss > 0:
        items.append(InactionItem(
            category="Savings Account Not Switched",
            description=f"Your {currency}{profile.savings_balance:,.0f} sitting at {profile.current_savings_rate}% instead of {profile.high_yield_savings_rate}% for {profile.years_savings_idle} year(s).",
            total_cost=savings_loss,
            recovery_months=recovery_months(savings_loss, profile.monthly_income)
        ))

    # 3. Not investing monthly
    invest_loss = future_value_missed(profile.monthly_investment_missed, profile.years_not_investing)
    if invest_loss > 0:
        items.append(InactionItem(
            category="Not Investing Monthly",
            description=f"Not investing {currency}{profile.monthly_investment_missed:,.0f}/mo for {profile.years_not_investing} year(s) at 10% avg market return.",
            total_cost=invest_loss,
            recovery_months=recovery_months(invest_loss, profile.monthly_income)
        ))

    # 4. 401k Match Leak (US Only)
    if profile.country == "US" and profile.employer_match_pct > 0 and profile.years_not_matching_401k > 0:
        match_leak_pct = max(0, profile.employer_match_pct - profile.user_contribution_pct)
        # Monthly amount lost is % of monthly monthly salary
        # Assuming current_salary is monthly
        monthly_leak = (match_leak_pct / 100) * profile.current_salary
        if monthly_leak > 0:
            match_loss = future_value_missed(monthly_leak, profile.years_not_matching_401k, 0.105)
            items.append(InactionItem(
                category="401k Match Leak",
                description=f"You missed out on a {match_leak_pct}% employer match for {profile.years_not_matching_401k} year(s). That's free money left on the table.",
                total_cost=match_loss,
                recovery_months=recovery_months(match_loss, profile.monthly_income)
            ))

    # 5. SIP Delay Cost (India Only)
    if profile.country == "India" and profile.monthly_sip_missed > 0 and profile.years_sip_delayed > 0:
        sip_loss = future_value_missed(profile.monthly_sip_missed, profile.years_sip_delayed, 0.12)
        items.append(InactionItem(
            category="SIP Delay Cost",
            description=f"Delaying your {currency}{profile.monthly_sip_missed:,.0f}/mo SIP for {profile.years_sip_delayed} year(s) at 12% Nifty 50 avg return.",
            total_cost=sip_loss,
            recovery_months=recovery_months(sip_loss, profile.monthly_income)
        ))

    # 6. Subscriptions
    for sub in profile.subscriptions:
        cost = round(sub.monthly_cost * sub.months_active, 2)
        if cost > 0:
            items.append(InactionItem(
                category=f"Unused Subscription: {sub.name}",
                description=f"{currency}{sub.monthly_cost}/mo for {sub.months_active} months you probably forgot about.",
                total_cost=cost,
                recovery_months=recovery_months(cost, profile.monthly_income)
            ))

    # 7. Debts not refinanced
    for debt in profile.debts:
        d_loss = debt_interest_overpaid(debt.balance, debt.current_rate, debt.refinance_rate, debt.years)
        if d_loss > 0:
            items.append(InactionItem(
                category=f"Debt Not Refinanced: {debt.name}",
                description=f"Paying {debt.current_rate}% on {currency}{debt.balance:,.0f} instead of refinancing at {debt.refinance_rate}% for {debt.years} year(s).",
                total_cost=d_loss,
                recovery_months=recovery_months(d_loss, profile.monthly_income)
            ))

    # Sort by damage — highest first
    items.sort(key=lambda x: x.total_cost, reverse=True)
    total = round(sum(i.total_cost for i in items), 2)

    return SimulationResult(total_inaction_cost=total, items=items)
