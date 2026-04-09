"""
Constants and allowed values for Finance Intel.
Use these for validation and dropdown options to keep the app consistent.
"""

# Income types - used in Add Transaction > Income
INCOME_TYPES = [
    'salary',
    'bonus',
    'hike',
    'extra_money',
    'freelance',
    'business',
    'investment_returns',
    'rental',
    'pension',
    'gift',
    'refund',
    'commission',
    'other',
]

# Expense categories - used in Add Transaction > Expense
EXPENSE_CATEGORIES = [
    'food_dining',
    'groceries',
    'rent',
    'emi',
    'electricity',
    'water',
    'gas',
    'internet',
    'phone_bill',
    'monthly_bills',
    'transport',
    'fuel',
    'entertainment',
    'shopping',
    'health',
    'insurance',
    'education',
    'subscriptions',
    'personal_care',
    'travel',
    'donations',
    'household',
    'child_care',
    'other',
]

# Payment modes - only two as per requirement
PAYMENT_MODES = ['hand_cash', 'phonepay']

# PhonePe sub-options
PHONEPAY_ENTRY_TYPES = ['normal', 'screenshot', 'scan']

# Display labels for income types (for reports/UI)
INCOME_TYPE_LABELS = {
    'salary': 'Salary',
    'bonus': 'Bonus',
    'hike': 'Hike / Increment',
    'extra_money': 'Extra Money',
    'freelance': 'Freelance',
    'business': 'Business Income',
    'investment_returns': 'Investment Returns',
    'rental': 'Rental Income',
    'pension': 'Pension',
    'gift': 'Gift',
    'refund': 'Refund',
    'commission': 'Commission',
    'other': 'Other Income',
}

# Display labels for expense categories
EXPENSE_CATEGORY_LABELS = {
    'food_dining': 'Food & Dining',
    'groceries': 'Groceries',
    'rent': 'Rent',
    'emi': 'EMI / Loan',
    'electricity': 'Electricity Bill',
    'water': 'Water Bill',
    'gas': 'Gas Bill',
    'internet': 'Internet / Broadband',
    'phone_bill': 'Phone Bill',
    'monthly_bills': 'Monthly Bills (Other)',
    'transport': 'Transport',
    'fuel': 'Fuel / Petrol',
    'entertainment': 'Entertainment',
    'shopping': 'Shopping',
    'health': 'Health / Medical',
    'insurance': 'Insurance',
    'education': 'Education',
    'subscriptions': 'Subscriptions (OTT)',
    'personal_care': 'Personal Care',
    'travel': 'Travel',
    'donations': 'Donations',
    'household': 'Household',
    'child_care': 'Child Care',
    'other': 'Other Expenses',
}
