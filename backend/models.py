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
    age: int
    monthly_income: float
    current_salary: float
    market_rate_salary: float          # what they could be earning
    years_at_same_salary: int

    savings_balance: float
    current_savings_rate: float        # in % e.g. 0.5
    high_yield_savings_rate: float     # in % e.g. 4.5
    years_savings_idle: int

    monthly_investment_missed: float   # amount they could have invested per month
    years_not_investing: int

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
