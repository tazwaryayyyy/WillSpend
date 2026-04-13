from typing import Dict, Any

def calculate_idle_savings_loss(balance: float, years: int, low_rate: float = 0.045, high_rate: float = 0.075) -> float:
    """
    Loss from keeping money in low-yield mobile banking (bKash/Nagad) vs Bank FD.
    """
    if balance <= 0 or years <= 0:
        return 0.0
    
    n = 12 # monthly compounding
    r_low = low_rate / n
    r_high = high_rate / n
    periods = years * n
    
    low_fv = balance * ((1 + r_low) ** periods)
    high_fv = balance * ((1 + r_high) ** periods)
    
    return round(high_fv - low_fv, 2)

def calculate_dps_missed_loss(monthly_amount: float, months_delayed: int, annual_return: float = 0.07) -> float:
    """
    Calculate maturity loss for missed DPS.
    FV of annuity formula: PMT * [(1 + r)^n - 1] / r
    """
    if monthly_amount <= 0 or months_delayed <= 0:
        return 0.0
    
    monthly_return = annual_return / 12
    fv = monthly_amount * ((1 + monthly_return) ** months_delayed - 1) / monthly_return
    
    return round(fv, 2)

def calculate_sanchayapatra_loss(monthly_amount: float, years: int) -> float:
    """
    Loss from missing Sanchayapatra (avg 11.5% return) vs standard Bank FD (avg 7.5% return).
    Difference: 4.26%
    """
    if monthly_amount <= 0 or years <= 0:
        return 0.0
    
    # Differential return logic
    # total_loss = monthlyAmount * 12 * years * (0.1176 - 0.075)
    # Using the user's requested formula specifically for consistency
    loss = monthly_amount * 12 * years * (0.1176 - 0.075)
    
    return round(loss, 2)

def get_bangladesh_examples(loss_amount: float) -> str:
    """Relatable context for Bangladesh."""
    if loss_amount <= 0:
        return "No significant loss to contextualize."
    
    if loss_amount < 50000:
        return f"That ৳{loss_amount:,.0f} is roughly one month's rent in a decent Dhaka neighborhood."
    elif loss_amount < 200000:
        return f"That ৳{loss_amount:,.0f} could have paid for a high-end gaming laptop or a nice vacation in Cox's Bazar."
    elif loss_amount < 500000:
        return f"That ৳{loss_amount:,.0f} would cover a full year of private university tuition in Bangladesh."
    elif loss_amount < 1000000:
        return f"That ৳{loss_amount:,.0f} is a significant chunk of a down payment for a flat in Chattogram or Sylhet."
    elif loss_amount < 2500000:
        return f"That ৳{loss_amount:,.0f} could buy a brand new sedan or a small plot of land in a developing area."
    else:
        return f"That ৳{loss_amount:,.0f} represents a life-changing sum—enough to buy a flat in Dhaka or start a robust business."

def calculate_bangladesh_specific_metrics(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    results = {}
    
    # Idle Mobile Banking Savings
    if profile_data.get("mobile_banking_balance", 0) > 0 and profile_data.get("years_mobile_banking_idle", 0) > 0:
        mb_loss = calculate_idle_savings_loss(
            profile_data["mobile_banking_balance"],
            profile_data["years_mobile_banking_idle"]
        )
        results["mobile_banking_idle_cost"] = mb_loss
        results["mobile_banking_example"] = get_bangladesh_examples(mb_loss)
        
    # Missed DPS
    if profile_data.get("monthly_dps_missed", 0) > 0 and profile_data.get("months_dps_delayed", 0) > 0:
        dps_loss = calculate_dps_missed_loss(
            profile_data["monthly_dps_missed"],
            profile_data["months_dps_delayed"]
        )
        results["dps_missed_cost"] = dps_loss
        results["dps_example"] = get_bangladesh_examples(dps_loss)
        
    # Sanchayapatra Missed
    if profile_data.get("monthly_sanchayapatra_eligible", 0) > 0 and profile_data.get("years_sanchayapatra_missed", 0) > 0:
        s_loss = calculate_sanchayapatra_loss(
            profile_data["monthly_sanchayapatra_eligible"],
            profile_data["years_sanchayapatra_missed"]
        )
        results["sanchayapatra_missed_cost"] = s_loss
        results["sanchayapatra_example"] = get_bangladesh_examples(s_loss)
        
    return results
