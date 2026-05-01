from flask import Flask, render_template, request, redirect, url_for, flash, session
from datetime import date, timedelta
from Backend.db_connection import get_db_connection

app = Flask(__name__, 
            template_folder='.', 
            static_folder='.', 
            static_url_path='')

app.secret_key = 'dev_key_for_myfitnesspal'
# Ensures the session doesn't disappear when the browser closes
app.permanent_session_lifetime = timedelta(days=31)

# --- THE AUTO-BRIDGE ---
@app.context_processor
def inject_user_data():
    """Makes these variables available to EVERY HTML file automatically."""
    return dict(
        username=session.get('username', 'Guest'),
        age=session.get('age', 'N/A'),
        height=session.get('height', 'N/A'),
        gender=session.get('gender', 'N/A'),
        weight=session.get('weight', 'N/A'),
        neck=session.get('neck', 'N/A'),
        waist=session.get('waist', 'N/A'),
        hips=session.get('hips', 'N/A')
    )

# --- ROUTES ---

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index/index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Note: In production, use hashed passwords!
        cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            session.permanent = True
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['age'] = user['age']
            session['height'] = user['height']
            session['gender'] = user['gender']
            session['weight'] = user.get('current_weight', 'N/A')
            session['neck'] = user.get('neck_entry', 'N/A')
            session['waist'] = user.get('waist_entry', 'N/A')
            session['hips'] = user.get('hips_entry', 'N/A')
            return redirect(url_for('index'))
        else:
            flash("Invalid credentials")
            return redirect(url_for('login'))

    return render_template('Login/Login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        age = request.form.get('age')
        height = request.form.get('height')
        gender = request.form.get('gender')

        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            try:
                query = """INSERT INTO users (username, email, password, age, height, gender) 
                           VALUES (%s, %s, %s, %s, %s, %s)"""
                cursor.execute(query, (username, email, password, age, height, gender))
                conn.commit()
                
                # Log them in automatically after signup
                cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
                new_user = cursor.fetchone()
                
                if new_user:
                    session.permanent = True
                    session['user_id'] = new_user['id']
                    session['username'] = new_user['username']
                    session['age'] = new_user['age']
                    session['height'] = new_user['height']
                    session['gender'] = new_user['gender']
                    session['weight'] = 'N/A'
                
                return redirect(url_for('index'))
            except Exception as e:
                print(f"Signup Error: {e}")
                flash("Signup failed. Email might already exist.")
                return redirect(url_for('signup'))
            finally:
                cursor.close()
                conn.close()

    return render_template('Register/Register.html')

@app.route('/check_in', methods=['GET', 'POST'])
def check_in():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        weight = request.form.get('weight')
        steps = request.form.get('steps')
        neck = request.form.get('neck')
        waist = request.form.get('waist')
        hips = request.form.get('hips')
        user_id = session['user_id']
        today = date.today()

        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            try:
                # 1. Update the Users Table
                user_query = """
                    UPDATE users 
                    SET current_weight = %s,
                        neck_entry = IF(%s = '' OR %s IS NULL, neck_entry, %s),
                        waist_entry = IF(%s = '' OR %s IS NULL, waist_entry, %s),
                        hips_entry = IF(%s = '' OR %s IS NULL, hips_entry, %s)
                    WHERE id = %s
                """
                cursor.execute(user_query, (weight, neck, neck, neck, waist, waist, waist, hips, hips, hips, user_id))

                # 2. Update the Charts Report (Upsert logic)
                report_query = """
                    INSERT INTO charts_report (user_id, weight, steps, date_added)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                        weight = VALUES(weight),
                        steps = VALUES(steps)
                """
                cursor.execute(report_query, (user_id, weight, steps, today))
                
                conn.commit()

                # 3. SYNC SESSION: This ensures the UI updates without logging out
                session['weight'] = weight
                if neck: session['neck'] = neck
                if waist: session['waist'] = waist
                if hips: session['hips'] = hips

                flash("Progress saved successfully!")
            except Exception as e:
                conn.rollback()
                print(f"Database Error: {e}")
                flash("An error occurred while saving.")
            finally:
                cursor.close()
                conn.close()

        return redirect(url_for('check_in'))

    return render_template('Check-In/Check-In.html')

@app.route('/food_diary')
def food_diary():
    return render_template('Food-Diary/Food-Diary.html') if 'user_id' in session else redirect(url_for('login'))

@app.route('/charts')
def charts():
    return render_template('Charts/Charts.html') if 'user_id' in session else redirect(url_for('login'))

@app.route('/profile')
def profile():
    return render_template('Profile/Profile.html') if 'user_id' in session else redirect(url_for('login'))

@app.route('/settings')
def settings():
    return render_template('Settings/Settings.html') if 'user_id' in session else redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.clear() 
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)