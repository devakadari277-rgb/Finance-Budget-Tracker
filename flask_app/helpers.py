"""
Helper functions for Finance Intel application.
Used for validation, formatting, and date calculations.
"""

from datetime import date, timedelta
from collections import defaultdict


def get_month_start_end(year: int, month: int) -> tuple:
    """Return (start_date, end_date) for the given month and year."""
    start = date(year, month, 1)
    if month == 12:
        end = date(year, 12, 31)
    else:
        end = date(year, month + 1, 1) - timedelta(days=1)
    return start, end


def validate_amount(value) -> tuple:
    """
    Validate amount value. Returns (is_valid, error_message).
    """
    try:
        v = float(value)
        if v < 0:
            return False, "Amount cannot be negative"
        return True, None
    except (TypeError, ValueError):
        return False, "Invalid amount"


def validate_email_format(email: str) -> bool:
    """Simple email format check."""
    if not email or not isinstance(email, str):
        return False
    return "@" in email and "." in email and len(email) > 5


def validate_password_strength(password: str) -> tuple:
    """
    Check password has minimum length. Returns (is_ok, message).
    """
    if not password:
        return False, "Password is required"
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    return True, None


def format_currency(amount: float, symbol: str = "₹") -> str:
    """Format number as currency string."""
    try:
        return "%s%.2f" % (symbol, float(amount))
    except (TypeError, ValueError):
        return "%s0.00" % symbol


def format_percent(value: float) -> str:
    """Format as percentage."""
    try:
        return "%.1f%%" % float(value)
    except (TypeError, ValueError):
        return "0.0%"


def safe_sum(iterable, default=0):
    """Sum iterable, return default if empty or error."""
    try:
        s = sum(iterable)
        return s if s is not None else default
    except (TypeError, ValueError):
        return default


def aggregate_by_category(expense_list) -> dict:
    """Given list of expense objects with .category and .amount, return dict category -> total."""
    result = defaultdict(float)
    for e in expense_list:
        result[e.category] += e.amount
    return dict(result)


def calculate_savings_rate(income: float, savings: float) -> float:
    """Savings rate as percentage. Returns 0 if income is 0."""
    if not income or income <= 0:
        return 0.0
    return (savings / income) * 100


def get_years_back(current_year: int, count: int) -> list:
    """Return list of years from current_year down to current_year - count + 1."""
    return [current_year - i for i in range(count)]


def month_name(month_num: int) -> str:
    """Return full month name for 1-12."""
    names = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    if 1 <= month_num <= 12:
        return names[month_num]
    return ""


def required_monthly_saving(target_amount: float, years: float) -> float:
    """Approximate monthly saving needed to reach target (no interest)."""
    if not years or years <= 0:
        return 0
    months = years * 12
    return target_amount / months if months else 0
