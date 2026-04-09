"""
Database configuration and model documentation for Finance Intel.

This module documents the database structure. The actual models and
database connection are defined in app.py for simplicity.

DATABASE: SQLite (finance.db in flask_app folder)
LOCATION: flask_app/finance.db

TABLES:
------

1. user
   - id (INTEGER, PRIMARY KEY)
   - name (VARCHAR 100, NOT NULL)
   - email (VARCHAR 120, UNIQUE, NOT NULL)
   - password (VARCHAR 200, NOT NULL) - hashed with werkzeug

2. income
   - id (INTEGER, PRIMARY KEY)
   - user_id (INTEGER, FK -> user.id)
   - amount (FLOAT, NOT NULL)
   - type (VARCHAR 50) - e.g. salary, bonus, freelance
   - date (DATE, NOT NULL)
   - source (VARCHAR 200, optional)

3. expense
   - id (INTEGER, PRIMARY KEY)
   - user_id (INTEGER, FK -> user.id)
   - amount (FLOAT, NOT NULL)
   - category (VARCHAR 50) - e.g. food_dining, rent, emi
   - date (DATE, NOT NULL)
   - description (VARCHAR 500, optional)
   - payment_mode (VARCHAR 50) - 'hand_cash' or 'phonepay'

4. saving
   - id (INTEGER, PRIMARY KEY)
   - user_id (INTEGER, FK -> user.id)
   - amount (FLOAT, NOT NULL)
   - date (DATE, NOT NULL)
   - notes (VARCHAR 500, optional)

5. target
   - id (INTEGER, PRIMARY KEY)
   - user_id (INTEGER, FK -> user.id)
   - name (VARCHAR 200) - goal name e.g. "Own House"
   - target_amount (FLOAT, NOT NULL)
   - years (FLOAT, NOT NULL) - years to achieve
   - notes (VARCHAR 500, optional)

RELATIONSHIPS:
- All transaction tables (income, expense, saving, target) link to user via user_id.
- One user has many incomes, expenses, savings, targets.

USAGE:
- Run app.py once to create finance.db and tables.
- Tables are created with db.create_all() in app context.
"""

# This file is documentation only. Models live in app.py.
