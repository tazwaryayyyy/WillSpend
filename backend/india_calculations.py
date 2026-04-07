import math
from typing import Dict, Any, Tuple

def calculate_sip_delay_cost(monthly_sip_amount: float, delay_months: int, expected_return: float = 0.12) -> float:
    """
    Calculate the future value loss due to SIP delay.
    
    Args:
        monthly_sip_amount: Monthly SIP amount in INR
        delay_months: Number of months SIP was delayed
        expected_return: Expected annual return (default 12% for Indian equity)
    
    Returns:
        Future value loss in INR
    """
    if monthly_sip_amount <= 0 or delay_months <= 0:
        return 0.0
    
    monthly_return = expected_return / 12
    
    # Calculate what the SIP would have been worth if started on time
    # FV of ordinary annuity: PMT * [(1 + r)^n - 1] / r
    future_value = monthly_sip_amount * ((1 + monthly_return) ** delay_months - 1) / monthly_return
    
    return round(future_value, 2)

def calculate_epf_missed_opportunity(current_epf_balance: float, additional_contribution_monthly: float, 
                                   months_delayed: int, epf_interest: float = 0.085) -> float:
    """
    Calculate EPF missed opportunity due to delayed additional contributions.
    
    Args:
        current_epf_balance: Current EPF balance in INR
        additional_contribution_monthly: Additional monthly contribution that was delayed
        months_delayed: Number of months contribution was delayed
        epf_interest: EPF interest rate (default 8.5%)
    
    Returns:
        Missed opportunity amount in INR
    """
    if additional_contribution_monthly <= 0 or months_delayed <= 0:
        return 0.0
    
    monthly_interest = epf_interest / 12
    
    # Future value of delayed contributions
    missed_fv = additional_contribution_monthly * ((1 + monthly_interest) ** months_delayed - 1) / monthly_interest
    
    # Also calculate interest on current balance that could have been higher
    # This is a simplified calculation
    additional_interest = current_epf_balance * ((1 + monthly_interest) ** months_delayed - 1)
    
    return round(missed_fv + additional_interest * 0.1, 2)  # 10% of additional interest as conservative estimate

def compare_tax_regimes(annual_salary: float, hra: float, rent_paid: float, 
                       section_80c_investments: float, nps_contribution: float) -> Dict[str, Any]:
    """
    Compare Old vs New tax regime in India and recommend the better option.
    
    Args:
        annual_salary: Annual gross salary in INR
        hra: HRA received annually in INR
        rent_paid: Annual rent paid in INR
        section_80c_investments: Investments under 80C in INR (max 1.5L)
        nps_contribution: NPS contribution under 80CCD(1B) in INR (max 50K)
    
    Returns:
        Dictionary with tax comparison and recommendation
    """
    # Tax slabs for FY 2023-24 (assuming individual < 60 years)
    def calculate_old_tax(taxable_income: float) -> float:
        tax = 0
        if taxable_income <= 250000:
            return 0
        elif taxable_income <= 500000:
            tax = (taxable_income - 250000) * 0.05
        elif taxable_income <= 1000000:
            tax = 12500 + (taxable_income - 500000) * 0.2
        else:
            tax = 112500 + (taxable_income - 1000000) * 0.3
        return tax
    
    def calculate_new_tax(taxable_income: float) -> float:
        tax = 0
        if taxable_income <= 300000:
            return 0
        elif taxable_income <= 700000:
            tax = (taxable_income - 300000) * 0.05
        elif taxable_income <= 1000000:
            tax = 20000 + (taxable_income - 700000) * 0.1
        elif taxable_income <= 1200000:
            tax = 50000 + (taxable_income - 1000000) * 0.15
        elif taxable_income <= 1500000:
            tax = 80000 + (taxable_income - 1200000) * 0.2
        else:
            tax = 140000 + (taxable_income - 1500000) * 0.3
        return tax
    
    # Standard deduction
    std_deduction = 50000
    
    # Old Regime Calculations
    # Basic deductions under old regime
    deductions_80c = min(section_80c_investments, 150000)  # 80C limit
    deductions_nps = min(nps_contribution, 50000)  # 80CCD(1B) limit
    
    # HRA calculation (simplified)
    hra_exemption = 0
    if hra > 0 and rent_paid > 0:
        # HRA exemption = min(actual HRA, 40% of basic (50% for metro), rent paid - 10% of basic)
        # Assuming basic is 50% of salary for simplicity
        basic_salary = annual_salary * 0.5
        metro_factor = 0.5  # Assuming metro city
        hra_exemption = min(hra, basic_salary * metro_factor, max(0, rent_paid - basic_salary * 0.1))
    
    total_deductions_old = std_deduction + deductions_80c + deductions_nps + hra_exemption
    taxable_income_old = max(0, annual_salary - total_deductions_old)
    tax_old = calculate_old_tax(taxable_income_old)
    
    # New Regime Calculations (only standard deduction)
    taxable_income_new = max(0, annual_salary - std_deduction)
    tax_new = calculate_new_tax(taxable_income_new)
    
    # Add cess (4%) to both
    tax_old_with_cess = tax_old * 1.04
    tax_new_with_cess = tax_new * 1.04
    
    # Determine recommendation
    if tax_old_with_cess < tax_new_with_cess:
        recommended_regime = "Old"
        annual_saving = tax_new_with_cess - tax_old_with_cess
    else:
        recommended_regime = "New"
        annual_saving = tax_old_with_cess - tax_new_with_cess
    
    return {
        "old_regime": {
            "taxable_income": round(taxable_income_old, 2),
            "tax_before_cess": round(tax_old, 2),
            "tax_with_cess": round(tax_old_with_cess, 2),
            "deductions": {
                "standard": std_deduction,
                "section_80c": deductions_80c,
                "nps": deductions_nps,
                "hra": round(hra_exemption, 2),
                "total": round(total_deductions_old, 2)
            }
        },
        "new_regime": {
            "taxable_income": round(taxable_income_new, 2),
            "tax_before_cess": round(tax_new, 2),
            "tax_with_cess": round(tax_new_with_cess),
            "deductions": {
                "standard": std_deduction,
                "total": std_deduction
            }
        },
        "recommendation": {
            "regime": recommended_regime,
            "annual_saving": round(annual_saving, 2),
            "monthly_saving": round(annual_saving / 12, 2)
        }
    }

def get_india_examples(loss_amount: float) -> str:
    """
    Convert loss amount to relatable Indian context.
    
    Args:
        loss_amount: Loss amount in INR
    
    Returns:
        Real-world example string
    """
    if loss_amount <= 0:
        return "No significant loss to contextualize."
    
    # Education examples
    if loss_amount < 50000:
        return f"That ₹{loss_amount:,.0f} could cover a full semester's tuition at Delhi University."
    elif loss_amount < 100000:
        return f"That ₹{loss_amount:,.0f} would pay for a complete year of engineering college at a top NIT."
    elif loss_amount < 200000:
        return f"That ₹{loss_amount:,.0f} could fund an MBA from a prestigious IIM for a semester."
    
    # Real estate examples
    elif loss_amount < 500000:
        return f"That ₹{loss_amount:,.0f} would be a 20% down payment on a 2BHK apartment in Tier-2 cities like Pune or Jaipur."
    elif loss_amount < 1000000:
        return f"That ₹{loss_amount:,.0f} could buy you a 1BHK flat in many Tier-3 cities or cover the entire down payment for a Mumbai suburban home."
    elif loss_amount < 2000000:
        return f"That ₹{loss_amount:,.0f} would purchase a luxury 3BHK apartment in cities like Ahmedabad or Kolkata."
    
    # High-value examples
    elif loss_amount < 5000000:
        return f"That ₹{loss_amount:,.0f} could buy you a premium villa in Bangalore's outskirts or fund multiple children's education through Ivy League universities."
    else:
        return f"That ₹{loss_amount:,.0f} represents generational wealth - enough to buy commercial property in prime Mumbai locations or start a successful business."

def calculate_india_specific_metrics(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate India-specific financial metrics based on user profile.
    
    Args:
        profile_data: Dictionary containing user financial profile
    
    Returns:
        Dictionary with India-specific calculations
    """
    results = {}
    
    # SIP delay cost
    if profile_data.get("monthly_sip_missed", 0) > 0 and profile_data.get("years_sip_delayed", 0) > 0:
        delay_months = profile_data["years_sip_delayed"] * 12
        sip_loss = calculate_sip_delay_cost(
            profile_data["monthly_sip_missed"],
            delay_months
        )
        results["sip_delay_cost"] = sip_loss
        results["sip_example"] = get_india_examples(sip_loss)
    
    # EPF opportunity
    if profile_data.get("current_epf_balance", 0) > 0:
        epf_loss = calculate_epf_missed_opportunity(
            profile_data["current_epf_balance"],
            profile_data.get("additional_epf_contribution", 5000),  # Default 5K
            profile_data.get("months_delayed_epf", 12)
        )
        results["epf_missed_opportunity"] = epf_loss
        results["epf_example"] = get_india_examples(epf_loss)
    
    # Tax regime comparison
    if profile_data.get("annual_salary", 0) > 0:
        tax_comparison = compare_tax_regimes(
            profile_data["annual_salary"],
            profile_data.get("hra", 0),
            profile_data.get("rent_paid", 0),
            profile_data.get("section_80c_investments", 0),
            profile_data.get("nps_contribution", 0)
        )
        results["tax_comparison"] = tax_comparison
    
    return results
