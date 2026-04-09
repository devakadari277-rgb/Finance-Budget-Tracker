"""Run the Finance Tracker Flask app from project root: python app.py"""
import os
import sys

# Run from flask_app folder so templates and static paths work
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'flask_app'))
sys.path.insert(0, os.getcwd())

from app import app

if __name__ == '__main__':
    app.run(debug=True, port=5000)
