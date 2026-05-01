from flask import Flask, render_template, request, redirect, url_for, flash, session
from Backend.db_connection import get_db_connection

# template_folder='.' allows Flask to see your subfolders like /Register and /index
app = Flask(__name__, 
            template_folder='.', 
            static_folder='.', 
            static_url_path='')
app.secret_key = 'dev_key_for_myfitnesspal'

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index/index.html', username=session.get('username'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        print("Login form submitted")
        email = request.form.get('email')
        password = request.form.get('password')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            print("login successful")
            session['user_id'] = user['id']
            session['username'] = user['username'] # You can still store the username in the session!
            return redirect(url_for('index'))
        else:
            print("wrong password")
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
            cursor = conn.cursor(dictionary=True) # Use dictionary=True to get the new ID easily
            try:
                query = """INSERT INTO users (username, email, password, age, height, gender) 
                           VALUES (%s, %s, %s, %s, %s, %s)"""
                cursor.execute(query, (username, email, password, age, height, gender))
                conn.commit()
                
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                new_user = cursor.fetchone()
                
                if new_user:
                    session['user_id'] = new_user['id']
                    session['username'] = username
                
                print(f"Signup successful! Redirecting {username} to Index.")
                return redirect(url_for('index'))

            except Exception as e:
                print(f"Signup Error: {e}")
                flash("Signup failed. That email or username might be taken.")
            finally:
                cursor.close()
                conn.close()

    return render_template('Register/Register.html')

@app.route('/check_in')
def check_in():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('Check-In/Check-In.html', username=session.get('username'))

@app.route('/food_diary')
def food_diary():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('Food-Diary/Food-Diary.html', username=session.get('username'))

@app.route('/charts')
def charts():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('Charts/Charts.html', username=session.get('username'))

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('Profile/Profile.html', username=session.get('username'))

@app.route('/settings')
def settings():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('Settings/Settings.html')

@app.route('/logout')
def logout():
    session.clear() 
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)