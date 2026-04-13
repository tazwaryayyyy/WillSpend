from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class Subscription(BaseModel):
    name: str
    monthly_cost: float
    months_active: int


class Debt(BaseModel):
    name: str
    balance: float
    current_rate: float       # in % e.g. 18.0
    refinance_rate: float     # in % e.g. 10.0
    years: int


class UserProfile(BaseModel):
    age: Optional[int] = None
    monthly_income: Optional[float] = None
    current_salary: Optional[float] = None
    market_rate_salary: Optional[float] = None
    years_at_same_salary: Optional[int] = None

    savings_balance: Optional[float] = None
    current_savings_rate: Optional[float] = None
    high_yield_savings_rate: Optional[float] = None
    years_savings_idle: Optional[int] = None

    monthly_investment_missed: Optional[float] = None
    years_not_investing: Optional[int] = None

    subscriptions: List[Subscription]
    debts: List[Debt]

    # New localized fields
    country: str = "US"  # "US" or "India"
    city: str = ""

    # New inaction categories
    employer_match_pct: Optional[float] = 0.0
    user_contribution_pct: Optional[float] = 0.0
    years_not_matching_401k: Optional[int] = 0
    
    monthly_sip_missed: Optional[float] = 0.0
    years_sip_delayed: Optional[int] = 0

    # Bangladesh specific fields
    mobile_banking_balance: Optional[float] = 0.0
    years_mobile_banking_idle: Optional[int] = 0
    monthly_dps_missed: Optional[float] = 0.0
    months_dps_delayed: Optional[int] = 0
    monthly_sanchayapatra_eligible: Optional[float] = 0.0
    years_sanchayapatra_missed: Optional[int] = 0



class InactionItem(BaseModel):
    category: str
    description: str
    total_cost: float
    recovery_months: int               # how many months to recover this loss
    action_hint: str = ""              # suggested action to recover
    estimated_recovery_1year: float = 0.0  # estimated amount recoverable in 1 year


class SimulationResult(BaseModel):
    total_inaction_cost: float
    items: List[InactionItem]
    categories: Dict[str, Dict[str, Any]] = {}  # New breakdown by category


class WillSpendResponse(BaseModel):
    simulation: SimulationResult
    ai_report: str


class AdvisorRequest(BaseModel):
    profile: UserProfile
    simulation: SimulationResult
    category_losses: Optional[Dict[str, float]] = None
