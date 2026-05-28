import os
import uuid
import json
import logging
import math
import random
from datetime import date, datetime, timedelta
from collections import defaultdict
from functools import wraps
from sklearn.linear_model import LinearRegression

from flask import Flask, render_template, request, jsonify, redirect, url_for, session, Response
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import requests
from bs4 import BeautifulSoup
from selenium import webdriver

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# # ML Models - Classical
# from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
# from sklearn.neighbors import KNeighborsClassifier
# from sklearn.svm import SVC, SVR
# from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
# from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor
# from sklearn.naive_bayes import GaussianNB
# from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
# from sklearn.model_selection import train_test_split, GridSearchCV
# from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, mean_squared_error, r2_score
# from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder

# # Gradient Boosting Libraries
# import xgboost as xgb
# import lightgbm as lgb

# # Deep Learning
# import tensorflow as tf
# from tensorflow import keras
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import Dense, Conv2D, MaxPooling2D, Flatten, LSTM, SimpleRNN, Dropout

# # NLP
# import nltk
# import spacy
# from textblob import TextBlob

# Local Modules
try:
    import pdf_report
except ModuleNotFoundError:
    from . import pdf_report

from helpers import (
    get_month_start_end,
    required_monthly_saving,
    calculate_savings_rate,
    safe_sum,
)
from constants import EXPENSE_CATEGORY_LABELS

app = Flask(__name__)
base_dir = os.path.dirname(os.path.abspath(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base_dir, 'finance.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'finance-secret-key-change-in-prod')
app.config['UPLOAD_FOLDER'] = os.path.join(base_dir, 'static', 'uploads', 'avatars')
db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    first_name = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    mobile_number = db.Column(db.String(20), nullable=True)
    otp_code = db.Column(db.String(10), nullable=True)
    monthly_income = db.Column(db.Float, default=0.0)
    monthly_expense = db.Column(db.Float, default=0.0)
    avatar_filename = db.Column(db.String(250), nullable=True)

class Income(db.Model):
    __tablename__ = 'income'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    type = db.Column(db.String(50), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(5), nullable=True) # HH:MM format
    source = db.Column(db.String(200), nullable=True)

class Expense(db.Model):
    __tablename__ = 'expense'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    category = db.Column(db.String(50), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(5), nullable=True)
    description = db.Column(db.String(500), nullable=True)
    payment_mode = db.Column(db.String(50), default='hand_cash')

class Saving(db.Model):
    __tablename__ = 'saving'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(5), nullable=True)
    notes = db.Column(db.String(500), nullable=True)

class Target(db.Model):
    __tablename__ = 'target'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    target_amount = db.Column(db.Float, nullable=False, default=0.0)
    years = db.Column(db.Float, nullable=False, default=1.0)
    notes = db.Column(db.String(500), nullable=True)

with app.app_context():
    db.create_all()
    try:
        db.session.execute(db.text('ALTER TABLE expense ADD COLUMN payment_mode VARCHAR(50)'))
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Add profile and time columns if database already exists (simple dev migration)
    for stmt in [
        'ALTER TABLE user ADD COLUMN monthly_income FLOAT',
        'ALTER TABLE user ADD COLUMN monthly_expense FLOAT',
        'ALTER TABLE user ADD COLUMN avatar_filename VARCHAR(250)',
        'ALTER TABLE user ADD COLUMN first_name VARCHAR(100)',
        'ALTER TABLE user ADD COLUMN country VARCHAR(100)',
        'ALTER TABLE user ADD COLUMN mobile_number VARCHAR(20)',
        'ALTER TABLE user ADD COLUMN otp_code VARCHAR(10)',
        'ALTER TABLE income ADD COLUMN time VARCHAR(5)',
        'ALTER TABLE expense ADD COLUMN time VARCHAR(5)',
        'ALTER TABLE saving ADD COLUMN time VARCHAR(5)'
    ]:
        try:
            db.session.execute(db.text(stmt))
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Ensure upload folder exists
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    except Exception:
        pass


def login_required(f):
    @wraps(f)
    def wrap(*args, **kw):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kw)
    return wrap


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        first_name = request.form.get('first_name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm = request.form.get('confirm_password')

        if password != confirm:
            return render_template('register.html', error='Password and Confirm Password do not match')
        
        if User.query.filter_by(email=email).first():
            return render_template('register.html', error='Email already registered')
            
        user = User(
            name=name, 
            first_name=first_name,
            email=email, 
            password=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()
        
        return redirect(url_for('login'))
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            return redirect(url_for('dashboard'))
        return render_template('login.html', error='Invalid email or password')
    return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))


@app.route('/')
def index():
    """First page: if logged in go to dashboard, else go to registration (mandatory flow)."""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('register'))



@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/add')
@login_required
def add_transaction():
    return render_template('add.html')

@app.route('/monthly')
@login_required
def monthly():
    return render_template('monthly.html')

@app.route('/yearly')
@login_required
def yearly():
    return render_template('yearly.html')

@app.route('/reports')
@login_required
def reports():
    return render_template('reports.html')

@app.route('/compare')
@login_required
def compare():
    return render_template('compare.html')

@app.route('/graphs')
@login_required
def graphs():
    return render_template('graphs.html')

@app.route('/targets')
@login_required
def targets():
    return render_template('targets.html')

@app.route('/calculator')
@login_required
def calculator():
    return render_template('calculator.html')

@app.route('/history')
@login_required
def history():
    return render_template('history.html')

def get_user_id():
    """Return current user id from session or 0."""
    return session.get('user_id', 0)


@app.route('/api/dashboard')
@login_required
def api_dashboard():
    uid = get_user_id()
    now = date.today()
    start, end = get_month_start_end(now.year, now.month)
    try:
        inc = sum(i.amount for i in Income.query.filter(Income.user_id == uid, Income.date >= start, Income.date <= end).all())
        exp = sum(e.amount for e in Expense.query.filter(Expense.user_id == uid, Expense.date >= start, Expense.date <= end).all())
        sav_logged = sum(s.amount for s in Saving.query.filter(Saving.user_id == uid, Saving.date >= start, Saving.date <= end).all())
        sav = (inc - exp) + sav_logged
        rate = calculate_savings_rate(inc, sav)
        return jsonify({
            'total_income': inc,
            'total_expense': exp,
            'total_savings': sav,
            'savings_rate': rate
        })
    except Exception as e:
        return jsonify({'error': str(e), 'total_income': 0, 'total_expense': 0, 'total_savings': 0, 'savings_rate': 0}), 500


@app.route('/api/savings-summary')
@login_required
def api_savings_summary():
    """Return savings for this month, last month, this year, last year."""
    uid = get_user_id()
    today = date.today()

    # This month
    m_now, y_now = today.month, today.year
    start_now, end_now = get_month_start_end(y_now, m_now)

    # Last month (handle year change)
    if m_now == 1:
        m_prev, y_prev = 12, y_now - 1
    else:
        m_prev, y_prev = m_now - 1, y_now
    start_prev, end_prev = get_month_start_end(y_prev, m_prev)

    # This year and last year
    start_year = date(y_now, 1, 1)
    end_year = date(y_now, 12, 31)
    start_last_year = date(y_now - 1, 1, 1)
    end_last_year = date(y_now - 1, 12, 31)

    def savings_between(s, e):
        inc = sum(i.amount for i in Income.query.filter(Income.user_id == uid, Income.date >= s, Income.date <= e).all())
        exp = sum(x.amount for x in Expense.query.filter(Expense.user_id == uid, Expense.date >= s, Expense.date <= e).all())
        sav_logged = sum(sv.amount for sv in Saving.query.filter(Saving.user_id == uid, Saving.date >= s, Saving.date <= e).all())
        return (inc - exp) + sav_logged

    data = {
        'this_month': savings_between(start_now, end_now),
        'last_month': savings_between(start_prev, end_prev),
        'this_year': savings_between(start_year, end_year),
        'last_year': savings_between(start_last_year, end_last_year),
    }
    return jsonify(data)


@app.route('/api/profile', methods=['GET', 'POST'])
@login_required
def api_profile():
    """Get or update user profile info used for target evaluation (income/expense baseline + avatar)."""
    uid = get_user_id()
    user = User.query.get(uid)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if request.method == 'POST':
        d = request.get_json() or {}
        try:
            user.monthly_income = float(d.get('monthly_income', user.monthly_income or 0) or 0)
        except Exception:
            user.monthly_income = user.monthly_income or 0
        try:
            user.monthly_expense = float(d.get('monthly_expense', user.monthly_expense or 0) or 0)
        except Exception:
            user.monthly_expense = user.monthly_expense or 0
        db.session.commit()

    avatar_url = None
    if user.avatar_filename:
        avatar_url = url_for('static', filename='uploads/avatars/' + user.avatar_filename)

    return jsonify({
        'name': user.name,
        'email': user.email,
        'monthly_income': user.monthly_income or 0,
        'monthly_expense': user.monthly_expense or 0,
        'avatar_url': avatar_url
    })


@app.route('/api/profile/avatar', methods=['POST', 'DELETE'])
@login_required
def api_profile_avatar():
    """Upload or remove avatar photo for current user."""
    uid = get_user_id()
    user = User.query.get(uid)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if request.method == 'DELETE':
        # Remove file if exists
        if user.avatar_filename:
            try:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], user.avatar_filename))
            except Exception:
                pass
        user.avatar_filename = None
        db.session.commit()
        return jsonify({'ok': True})

    if 'avatar' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    f = request.files['avatar']
    if not f or not f.filename:
        return jsonify({'error': 'Invalid file'}), 400

    filename = secure_filename(f.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ['.png', '.jpg', '.jpeg', '.webp']:
        return jsonify({'error': 'Only png/jpg/jpeg/webp allowed'}), 400

    new_name = f'{uid}_{uuid.uuid4().hex}{ext}'
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], new_name)
    f.save(save_path)

    # Delete old file
    if user.avatar_filename and user.avatar_filename != new_name:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], user.avatar_filename))
        except Exception:
            pass
    user.avatar_filename = new_name
    db.session.commit()

    return jsonify({'avatar_url': url_for('static', filename='uploads/avatars/' + new_name)})

@app.route('/api/income', methods=['GET', 'POST'])
@login_required
def api_income():
    uid = get_user_id()
    if request.method == 'POST':
        d = request.get_json()
        i = Income(user_id=uid, amount=float(d['amount']), type=d['type'], date=datetime.strptime(d['date'], '%Y-%m-%d').date(), time=d.get('time'), source=d.get('source'))
        db.session.add(i)
        db.session.commit()
        return jsonify({'id': i.id})
    return jsonify([{'id': i.id, 'amount': i.amount, 'type': i.type, 'date': str(i.date), 'time': i.time} for i in Income.query.filter_by(user_id=uid).order_by(Income.date.desc(), Income.time.desc()).limit(100).all()])

@app.route('/api/expense', methods=['GET', 'POST'])
@login_required
def api_expense():
    uid = get_user_id()
    if request.method == 'POST':
        d = request.get_json()
        e = Expense(user_id=uid, amount=float(d['amount']), category=d['category'], date=datetime.strptime(d['date'], '%Y-%m-%d').date(), time=d.get('time'), description=d.get('description'), payment_mode=d.get('payment_mode', 'hand_cash'))
        db.session.add(e)
        db.session.commit()
        return jsonify({'id': e.id})
    return jsonify([{'id': e.id, 'amount': e.amount, 'category': e.category, 'date': str(e.date), 'time': e.time} for e in Expense.query.filter_by(user_id=uid).order_by(Expense.date.desc(), Expense.time.desc()).limit(100).all()])

@app.route('/api/history')
@login_required
def api_history():
    """Return all transactions (income, expense, saving) filtered by month/year."""
    uid = get_user_id()
    try:
        month = int(request.args.get('month', 0))
        year = int(request.args.get('year', 0))
    except ValueError:
        return jsonify({'error': 'Invalid month or year'}), 400

    query_income = Income.query.filter_by(user_id=uid)
    query_expense = Expense.query.filter_by(user_id=uid)
    query_saving = Saving.query.filter_by(user_id=uid)

    if year > 0:
        if month > 0:
            start, end = get_month_start_end(year, month)
            query_income = query_income.filter(Income.date >= start, Income.date <= end)
            query_expense = query_expense.filter(Expense.date >= start, Expense.date <= end)
            query_saving = query_saving.filter(Saving.date >= start, Saving.date <= end)
        else:
            start_year = date(year, 1, 1)
            end_year = date(year, 12, 31)
            query_income = query_income.filter(Income.date >= start_year, Income.date <= end_year)
            query_expense = query_expense.filter(Expense.date >= start_year, Expense.date <= end_year)
            query_saving = query_saving.filter(Saving.date >= start_year, Saving.date <= end_year)

    incomes = query_income.order_by(Income.date.desc()).all()
    expenses = query_expense.order_by(Expense.date.desc()).all()
    savings = query_saving.order_by(Saving.date.desc()).all()

    data = []
    for i in incomes:
        data.append({'id': i.id, 'type': 'income', 'subtype': i.type, 'amount': i.amount, 'date': str(i.date), 'time': i.time, 'source': i.source or ''})
    for e in expenses:
        data.append({'id': e.id, 'type': 'expense', 'subtype': e.category, 'amount': e.amount, 'date': str(e.date), 'time': e.time, 'description': e.description or '', 'payment_mode': e.payment_mode})
    for s in savings:
        data.append({'id': s.id, 'type': 'saving', 'subtype': 'Savings', 'amount': s.amount, 'date': str(s.date), 'time': s.time, 'notes': s.notes or ''})

    # Sort combined data- list by date desc, then time desc
    data.sort(key=lambda x: (x['date'], x['time'] or '00:00'), reverse=True)
    return jsonify(data)

@app.route('/api/edit/<string:type>/<int:id>', methods=['PUT'])
@login_required
def api_edit_transaction(type, id):
    uid = get_user_id()
    item = None
    if type == 'income':
        item = Income.query.filter_by(id=id, user_id=uid).first()
    elif type == 'expense':
        item = Expense.query.filter_by(id=id, user_id=uid).first()
    elif type == 'saving':
        item = Saving.query.filter_by(id=id, user_id=uid).first()

    if not item:
        return jsonify({'error': 'Transaction not found'}), 404

    try:
        d = request.get_json()
        if 'amount' in d: item.amount = float(d['amount'])
        if 'date' in d: item.date = datetime.strptime(d['date'], '%Y-%m-%d').date()
        if 'time' in d: item.time = d['time']
        
        if type == 'income':
            if 'type' in d: item.type = d['type']
            if 'source' in d: item.source = d['source']
        elif type == 'expense':
            if 'category' in d: item.category = d['category']
            if 'description' in d: item.description = d['description']
            if 'payment_mode' in d: item.payment_mode = d['payment_mode']
        elif type == 'saving':
            if 'notes' in d: item.notes = d['notes']

        db.session.commit()
        return jsonify({'ok': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/monthly/<int:month>/<int:year>')
@login_required
def api_monthly(month, year):
    uid = get_user_id()
    start = date(year, month, 1)
    end = date(year, 12, 31) if month == 12 else date(year, month + 1, 1) - timedelta(days=1)
    inc = sum(i.amount for i in Income.query.filter(Income.user_id == uid, Income.date >= start, Income.date <= end).all())
    exp = sum(e.amount for e in Expense.query.filter(Expense.user_id == uid, Expense.date >= start, Expense.date <= end).all())
    cats = defaultdict(float)
    for e in Expense.query.filter(Expense.user_id == uid, Expense.date >= start, Expense.date <= end).all():
        cats[e.category] += e.amount
    sav_logged = sum(s.amount for s in Saving.query.filter(Saving.user_id == uid, Saving.date >= start, Saving.date <= end).all())
    top = max(cats, key=cats.get) if cats else 'N/A'
    sav = (inc - exp) + sav_logged
    rate = (sav / inc * 100) if inc else 0
    return jsonify({'total_income': inc, 'total_expense': exp, 'total_savings': sav, 'savings_rate': rate, 'top_category': top, 'by_category': dict(cats)})

@app.route('/api/graphs/<int:year>')
@login_required
def api_graphs(year):
    uid = get_user_id()
    months = []
    for m in range(1, 13):
        start = date(year, m, 1)
        end = date(year, 12, 31) if m == 12 else date(year, m + 1, 1) - timedelta(days=1)
        inc = sum(i.amount for i in Income.query.filter(Income.user_id == uid, Income.date >= start, Income.date <= end).all())
        exp = sum(e.amount for e in Expense.query.filter(Expense.user_id == uid, Expense.date >= start, Expense.date <= end).all())
        sav_log = sum(s.amount for s in Saving.query.filter(Saving.user_id == uid, Saving.date >= start, Saving.date <= end).all())
        months.append({'month': m, 'income': inc, 'expense': exp, 'savings': (inc - exp) + sav_log})
    cats = defaultdict(float)
    for e in Expense.query.filter(Expense.user_id == uid, Expense.date >= date(year,1,1), Expense.date <= date(year,12,31)).all():
        cats[e.category] += e.amount
    return jsonify({'months': months, 'by_category': dict(cats), 'year': year})

@app.route('/api/yearly/<int:year>')
@login_required
def api_yearly(year):
    uid = get_user_id()
    months = []
    for m in range(1, 13):
        start = date(year, m, 1)
        end = date(year, 12, 31) if m == 12 else date(year, m + 1, 1) - timedelta(days=1)
        inc = sum(i.amount for i in Income.query.filter(Income.user_id == uid, Income.date >= start, Income.date <= end).all())
        exp = sum(e.amount for e in Expense.query.filter(Expense.user_id == uid, Expense.date >= start, Expense.date <= end).all())
        sav_log = sum(s.amount for s in Saving.query.filter(Saving.user_id == uid, Saving.date >= start, Saving.date <= end).all())
        months.append({'month': m, 'income': inc, 'expense': exp, 'savings': (inc - exp) + sav_log})
    return jsonify({'months': months, 'year': year})

@app.route('/api/compare')
@login_required
def api_compare():
    uid = get_user_id()
    
    def get_stats_for_period(year, month=0):
        try:
            if month > 0:
                start, end = get_month_start_end(year, month)
            else:
                start = date(year, 1, 1)
                end = date(year, 12, 31)
                
            inc = sum(i.amount for i in Income.query.filter(Income.user_id == uid, Income.date >= start, Income.date <= end).all())
            exp = sum(e.amount for e in Expense.query.filter(Expense.user_id == uid, Expense.date >= start, Expense.date <= end).all())
            sav_log = sum(s.amount for s in Saving.query.filter(Saving.user_id == uid, Saving.date >= start, Saving.date <= end).all())
            return {
                'income': inc,
                'expense': exp,
                'savings': (inc - exp) + sav_log
            }
        except Exception as e:
            return {'income': 0, 'expense': 0, 'savings': 0, 'error': str(e)}

    try:
        y1 = int(request.args.get('y1', 0))
        m1 = int(request.args.get('m1', 0))
        y2 = int(request.args.get('y2', 0))
        m2 = int(request.args.get('m2', 0))
        
        if y1 == 0 or y2 == 0:
            return jsonify({'error': 'Missing year parameters (y1/y2)'}), 400
            
        period1 = get_stats_for_period(y1, m1)
        period2 = get_stats_for_period(y2, m2)
        
        if 'error' in period1 or 'error' in period2:
            return jsonify({'error': 'Error calculating one of the periods', 'details': period1.get('error') or period2.get('error')}), 500

        return jsonify({
            'period1': period1,
            'period2': period2,
            'diff': {
                'income': period2['income'] - period1['income'],
                'expense': period2['expense'] - period1['expense'],
                'savings': period2['savings'] - period1['savings']
            }
        })
    except ValueError:
        return jsonify({'error': 'Invalid parameters (must be integers)'}), 400
    except Exception as e:
        return jsonify({'error': f"Server error: {str(e)}"}), 500

@app.route('/api/clear-month/<int:month>/<int:year>', methods=['DELETE'])
@login_required
def api_clear_month(month, year):
    uid = get_user_id()
    start, end = get_month_start_end(year, month)
    
    # Delete all incomes, expenses, and savings for this user in this month
    Income.query.filter(Income.user_id == uid, Income.date >= start, Income.date <= end).delete()
    Expense.query.filter(Expense.user_id == uid, Expense.date >= start, Expense.date <= end).delete()
    Saving.query.filter(Saving.user_id == uid, Saving.date >= start, Saving.date <= end).delete()
    
    db.session.commit()
    return jsonify({'ok': True, 'message': f'All data for {month}/{year} cleared.'})

@app.route('/api/history/delete/<string:type>/<int:id>', methods=['DELETE'])
@login_required
def api_delete_transaction(type, id):
    uid = get_user_id()
    item = None
    if type == 'income':
        item = Income.query.filter_by(id=id, user_id=uid).first()
    elif type == 'expense':
        item = Expense.query.filter_by(id=id, user_id=uid).first()
    elif type == 'saving':
        item = Saving.query.filter_by(id=id, user_id=uid).first()
    
    if item:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'ok': True})
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/savings', methods=['GET', 'POST'])
@login_required
def api_savings():
    uid = get_user_id()
    if request.method == 'POST':
        d = request.get_json()
        s = Saving(user_id=uid, amount=float(d['amount']), date=datetime.strptime(d['date'], '%Y-%m-%d').date(), notes=d.get('notes'))
        db.session.add(s)
        db.session.commit()
        return jsonify({'id': s.id})
    return jsonify([{'id': s.id, 'amount': s.amount, 'date': str(s.date)} for s in Saving.query.filter_by(user_id=uid).order_by(Saving.date.desc()).limit(100).all()])

@app.route('/api/targets', methods=['GET', 'POST'])
@login_required
def api_targets():
    uid = get_user_id()
    try:
        if request.method == 'POST':
            d = request.get_json()
            user = User.query.get(uid)
            if not user or not user.monthly_income or user.monthly_income <= 0:
                return jsonify({'error': 'Please set your monthly income first in Targets (Income Setup).'}), 400
            t = Target(user_id=uid, name=d['name'], target_amount=float(d['target_amount']), years=float(d['years']), notes=d.get('notes'))
            db.session.add(t)
            db.session.commit()
            return jsonify({'id': t.id})
        
        targets = Target.query.filter_by(user_id=uid).all()
        # Analyse last 3 months savings and expense mix for suggestions
        today = date.today()
        savings_values = []
        cats = defaultdict(float)

        def savings_between(s, e):
            inc = sum(i.amount for i in Income.query.filter(Income.user_id == uid, Income.date >= s, Income.date <= e).all())
            exp = list(Expense.query.filter(Expense.user_id == uid, Expense.date >= s, Expense.date <= e).all())
            total_exp = sum(x.amount for x in exp)
            sav_logged = sum(sv.amount for sv in Saving.query.filter(Saving.user_id == uid, Saving.date >= s, Saving.date <= e).all())
            for x in exp:
                cats[x.category] += x.amount
            return (inc - total_exp) + sav_logged

        m, y = today.month, today.year
        for offset in range(3):
            mm = m - offset
            yy = y
            if mm <= 0:
                mm += 12
                yy -= 1
            try:
                start_m, end_m = get_month_start_end(yy, mm)
                savings_values.append(savings_between(start_m, end_m))
            except Exception:
                pass

        avg_monthly_saving = safe_sum(savings_values) / len(savings_values) if savings_values else 0
        top_cat = max(cats, key=cats.get) if cats else None
        top_cat_label = EXPENSE_CATEGORY_LABELS.get(top_cat, top_cat) if top_cat else None

        user = User.query.get(uid)
        monthly_income = float(user.monthly_income or 0) if user else 0
        baseline_expense = float(user.monthly_expense or 0) if user else 0
        estimated_monthly_expense = (safe_sum(list(cats.values())) / 3.0) if (baseline_expense <= 0 and cats) else baseline_expense
        saving_capacity = (monthly_income - estimated_monthly_expense) if monthly_income > 0 else 0
        daily_capacity = saving_capacity / 30.0 if saving_capacity else 0
        yearly_capacity = saving_capacity * 12.0 if saving_capacity else 0
        saving_pct = (saving_capacity / monthly_income * 100.0) if monthly_income > 0 else 0

        result = []
        for t in targets:
            required_m = required_monthly_saving(t.target_amount, t.years)
            required_y = required_m * 12
            
            # Use current average savings for actual progress, but use capacity for potential
            actual_m = avg_monthly_saving
            actual_y = actual_m * 12
            
            gap_m = max(0, required_m - actual_m)
            gap_y = gap_m * 12
            
            # Revised timeline if continuing at current average
            if actual_m > 0:
                revised_years = t.target_amount / (actual_m * 12)
            else:
                revised_years = None # Goal not reachable at current rate
            
            # Actionable advice
            if gap_m <= 0:
                suggestion = "Excellent! You are on track to achieve this goal on time with your current saving patterns."
                advice_list = ["Keep maintaining your current savings rate."]
            else:
                advice_list = []
                # Scenario 1: Increase Income / Reduce Expense
                advice_list.append(f"To stay on timeline: Increase monthly savings by ₹{gap_m:,.0f} (either via higher income or lower spending).")
                
                # Scenario 2: Extend Years
                if actual_m > 0:
                    advice_list.append(f"To keep current savings: You would need to extend your goal timeline to {revised_years:.1f} years.")
                else:
                    advice_list.append("Critical: Your current average savings are zero or negative. You must increase income or drastically reduce expenses to start making progress.")

                if top_cat_label:
                    approx_reduce = (cats.get(top_cat, 0) / 3.0) * 0.15
                    advice_list.append(f"Specific Tip: Reducing your {top_cat_label} spending by 15% would contribute ₹{approx_reduce:,.0f} toward this goal.")

                suggestion = "At Risk: You are currently short of your monthly target."

            # Calculate months to goal based on theoretical capacity
            if saving_capacity > 0:
                months_at_capacity = int((t.target_amount / saving_capacity) + 1)
            else:
                months_at_capacity = None
            
            result.append({
                'id': t.id,
                'name': t.name,
                'target_amount': t.target_amount,
                'years': t.years,
                'required_monthly': required_m,
                'required_yearly': required_y,
                'actual_monthly': actual_m,
                'actual_yearly': actual_y,
                'monthly_gap': gap_m,
                'yearly_gap': gap_y,
                'revised_years_needed': revised_years,
                'monthly_income': monthly_income,
                'estimated_monthly_expense': estimated_monthly_expense,
                'saving_capacity_monthly': saving_capacity,
                'saving_capacity_pct': saving_pct,
                'months_to_goal_at_capacity': months_at_capacity,
                'suggestion': suggestion,
                'advice_list': advice_list
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/targets/clear', methods=['POST'])
@login_required
def api_targets_clear():
    uid = get_user_id()
    try:
        Target.query.filter_by(user_id=uid).delete()
        db.session.commit()
        return jsonify({'ok': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/report-pdf/<int:month>/<int:year>')
@login_required
def api_report_pdf(month, year):
    """Generate PDF report for given month/year. Uses pdf_report module; requires reportlab."""
    uid = get_user_id()
    try:
        start = date(year, month, 1)
        end = date(year, 12, 31) if month == 12 else date(year, month + 1, 1) - timedelta(days=1)
        inc = sum(i.amount for i in Income.query.filter(Income.user_id == uid, Income.date >= start, Income.date <= end).all())
        exp = sum(e.amount for e in Expense.query.filter(Expense.user_id == uid, Expense.date >= start, Expense.date <= end).all())
        try:
            sav_logged = sum(s.amount for s in Saving.query.filter(Saving.user_id == uid, Saving.date >= start, Saving.date <= end).all())
        except Exception:
            sav_logged = 0
        sav = (inc - exp) + sav_logged
        from pdf_report import generate_monthly_report_pdf
        pdf_bytes = generate_monthly_report_pdf(month, year, inc, exp, sav)
        return Response(pdf_bytes, mimetype='application/pdf', headers={'Content-Disposition': 'attachment; filename=report-%d-%d.pdf' % (month, year)})
    except ImportError as e:
        return jsonify({'error': 'PDF library not installed. Run: pip install reportlab'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health():
    """Simple health check for deployment."""
    return jsonify({'status': 'ok', 'app': 'Finance Intel'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
