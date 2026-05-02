from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    session,
    jsonify,
)
from datetime import date, timedelta
import requests
from functools import wraps
from Backend.db_connection import get_db_connection

# Initialize the Flask application
app = Flask(__name__, template_folder=".", static_folder=".", static_url_path="")

# Secret key required for secure session management
app.secret_key = "dev_key_for_myfitnesspal"

# Extend session lifetime to 31 days
app.permanent_session_lifetime = timedelta(days=31)

import json

# --- CONFIG & DATABASE DIARY ---
MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"]
NUTRIENT_KEYS = ["calories", "carbs", "fat", "protein", "sodium", "sugar"]

def _init_db():
    try:
        conn = get_db_connection()
        if not conn:
            return
        cursor = conn.cursor()
        
        # Ensure the json storage table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diary_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                date DATE,
                diary_data JSON,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, date)
            )
        """)
        
        # Safely attempt to add unique constraints for upserts if they don't exist yet
        try:
            cursor.execute("ALTER TABLE food_entries ADD UNIQUE KEY unique_user_date (user_id, date_added)")
        except:
            pass
            
        try:
            cursor.execute("ALTER TABLE charts_report ADD UNIQUE KEY unique_user_date_chart (user_id, date_added)")
        except:
            pass

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB Init Error: {e}")

# Run database initialization once on startup
_init_db()

def _get_diary_entry(date_key):
    user_id = session.get("user_id")
    default_entry = {
        "meals": {m: [] for m in MEALS},
        "waterCups": 0,
        "notes": "",
        "completed": False,
    }
    
    if not user_id:
        return default_entry

    try:
        conn = get_db_connection()
        if not conn:
            return default_entry
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT diary_data FROM diary_logs WHERE user_id=%s AND date=%s", (user_id, date_key))
        row = cursor.fetchone()
        conn.close()

        if row and row.get("diary_data"):
            entry = json.loads(row["diary_data"]) if isinstance(row["diary_data"], str) else row["diary_data"]
            for m in MEALS:
                if m not in entry["meals"]:
                    entry["meals"][m] = []
            return entry
    except Exception as e:
        print(f"Error fetching diary entry: {e}")

    return default_entry


def _save_diary_entry(date_key, entry):
    user_id = session.get("user_id")
    if not user_id:
        return

    try:
        conn = get_db_connection()
        if not conn:
            return
        cursor = conn.cursor()
        
        # 1. Save complete JSON diary payload
        diary_json = json.dumps(entry)
        cursor.execute("""
            INSERT INTO diary_logs (user_id, date, diary_data) 
            VALUES (%s, %s, %s) 
            ON DUPLICATE KEY UPDATE diary_data=VALUES(diary_data)
        """, (user_id, date_key, diary_json))
        
        # 2. Sync daily macro totals into the food_entries registry
        totals = {
            k: sum(float(f.get(k, 0)) for m in entry["meals"].values() for f in m)
            for k in NUTRIENT_KEYS
        }
        cursor.execute("""
            INSERT INTO food_entries (user_id, calories, carbs, fat, protein, sodium, sugar, date_added)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                calories=VALUES(calories), carbs=VALUES(carbs), 
                fat=VALUES(fat), protein=VALUES(protein), 
                sodium=VALUES(sodium), sugar=VALUES(sugar)
        """, (
            user_id, totals["calories"], totals["carbs"], 
            totals["fat"], totals["protein"], totals["sodium"], totals["sugar"], date_key
        ))
        
        # 3. Sync daily water and calories into charts_report
        water_cups = float(entry.get("waterCups", 0))
        cursor.execute("""
            INSERT INTO charts_report (user_id, calories, water_intake, date_added)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE calories=VALUES(calories), water_intake=VALUES(water_intake)
        """, (user_id, totals["calories"], water_cups, date_key))

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving diary entry: {e}")


def _diary_payload(date_key):
    entry = _get_diary_entry(date_key)

    # Calculate nutrient totals by iterating through all foods across meals
    totals = {
        k: sum(float(f.get(k, 0)) for m in entry["meals"].values() for f in m)
        for k in NUTRIENT_KEYS
    }

    # Set fallback defaults for missing session data
    w = float(
        session.get("weight") if session.get("weight") not in (None, "N/A") else 70
    )
    h = float(
        session.get("height") if session.get("height") not in (None, "N/A") else 170
    )
    a = float(session.get("age") if session.get("age") not in (None, "N/A") else 25)
    gender = str(session.get("gender", "male")).lower()

    # Calculate BMR (Basal Metabolic Rate) using the Mifflin-St Jeor equation
    bmr = round(
        10 * w + 6.25 * h - 5 * a + (-161 if gender in ("female", "woman") else 5)
    )

    # Define macro goals based on BMR
    goals = {
        "calories": bmr,
        "carbs": round(bmr * 0.5 / 4),  # 50% carbs
        "fat": round(bmr * 0.3 / 9),  # 30% fat
        "protein": round(bmr * 0.2 / 4),  # 20% protein
        "sodium": 2300,
        "sugar": 80,
    }

    today_iso = date.today().isoformat()
    locked = False
    lockReason = ""

    if date_key != today_iso:
        locked = True
        lockReason = "You can only edit today's diary."
    elif entry.get("completed"):
        locked = True
        lockReason = "This diary entry is completed and locked."

    return {
        "date": date_key,
        "meals": entry["meals"],
        "totals": totals,
        "goals": goals,
        "waterCups": float(entry.get("waterCups", 0)),
        "notes": entry.get("notes", ""),
        "completed": bool(entry.get("completed")),
        "locked": locked,
        "lockReason": lockReason,
    }


@app.context_processor
def inject_user_data():
    # Automatically inject user session data into all templates context
    return {
        k: session.get(k, "N/A" if k != "username" else "Guest")
        for k in [
            "username",
            "age",
            "height",
            "gender",
            "weight",
            "neck",
            "waist",
            "hips",
        ]
    }


# --- FOOD API ---
# Fallback dataset for offline functionality or API failure
FALLBACK_FOODS = [
    {
        "name": "Egg, boiled",
        "servingSize": "1 large egg",
        "calories": 78,
        "carbs": 0.6,
        "fat": 5.3,
        "protein": 6.3,
        "sodium": 62,
        "sugar": 0.6,
    },
    {
        "name": "White rice, cooked",
        "servingSize": "1 cup cooked",
        "calories": 205,
        "carbs": 45,
        "fat": 0.4,
        "protein": 4.3,
        "sodium": 2,
        "sugar": 0.1,
    },
    {
        "name": "Chicken breast, cooked",
        "servingSize": "100 g",
        "calories": 165,
        "carbs": 0,
        "fat": 3.6,
        "protein": 31,
        "sodium": 74,
        "sugar": 0,
    },
    {
        "name": "Banana",
        "servingSize": "1 medium",
        "calories": 105,
        "carbs": 27,
        "fat": 0.4,
        "protein": 1.3,
        "sodium": 1,
        "sugar": 14,
    },
    {
        "name": "Apple",
        "servingSize": "1 medium",
        "calories": 95,
        "carbs": 25,
        "fat": 0.3,
        "protein": 0.5,
        "sodium": 2,
        "sugar": 19,
    },
]


@app.route("/api/food-search")
def food_search():
    # Parse search query
    query = request.args.get("q", "").strip().lower()

    # Filter local fallback matches
    matches = [
        f for f in FALLBACK_FOODS if all(w in f["name"].lower() for w in query.split())
    ][:10]

    try:
        # Query Open Food Facts API for external nutrition data
        res = requests.get(
            "https://world.openfoodfacts.org/api/v2/search",
            params={
                "search_terms": query,
                "fields": "product_name,generic_name,brands,serving_size,nutriments",
                "page_size": 20,
            },
            timeout=5,
        )

        foods = []
        for p in res.json().get("products", []):
            name = p.get("product_name") or p.get("generic_name")
            if not name:
                continue

            nut = p.get("nutriments", {})
            # Normalize external API fields to internal structure
            foods.append(
                {
                    "name": (
                        f"{name} ({p.get('brands', '').split(',')[0]})"
                        if p.get("brands")
                        else name
                    ),
                    "servingSize": p.get("serving_size", "100 g"),
                    "calories": float(nut.get("energy-kcal_100g", 0)),
                    "carbs": float(nut.get("carbohydrates_100g", 0)),
                    "fat": float(nut.get("fat_100g", 0)),
                    "protein": float(nut.get("proteins_100g", 0)),
                    "sodium": float(nut.get("sodium_100g", 0)) * 1000,
                    "sugar": float(nut.get("sugars_100g", 0)),
                }
            )

        # Combine API and fallback results
        return jsonify({"foods": (foods + matches)[:10], "source": "openfoodfacts"})

    except:
        # Return local matches as fallback on request failure
        return jsonify({"foods": matches, "source": "fallback"})


# --- DIARY ENDPOINTS ---
@app.route("/api/diary", methods=["GET"])
def api_get_diary():
    # Return serialized diary payload for specified date
    date_key = request.args.get("date", date.today().isoformat())
    return jsonify(_diary_payload(date_key))


@app.route("/api/diary/add", methods=["POST"])
def api_add_diary_food():
    # Append new food item to the requested meal
    data = request.get_json()
    date_key = data.get("date")
    meal = data.get("meal")
    food = data.get("food")

    entry = _get_diary_entry(date_key)
    entry["meals"][meal].append(food)
    _save_diary_entry(date_key, entry)

    return jsonify(_diary_payload(date_key))


@app.route("/api/diary/remove", methods=["POST"])
def api_remove_diary_food():
    # Remove food item by index from the requested meal
    data = request.get_json()
    date_key = data.get("date")
    meal = data.get("meal")
    index = int(data.get("index"))

    entry = _get_diary_entry(date_key)
    entry["meals"][meal].pop(index)
    _save_diary_entry(date_key, entry)

    return jsonify(_diary_payload(date_key))


@app.route("/api/diary/water", methods=["POST"])
def api_update_diary_water():
    # Process water cup increments or resets
    data = request.get_json()
    date_key = data.get("date")

    entry = _get_diary_entry(date_key)

    if data.get("action") == "reset":
        entry["waterCups"] = 0
    else:
        entry["waterCups"] = float(entry.get("waterCups", 0)) + float(
            data.get("cups", 0)
        )
    _save_diary_entry(date_key, entry)

    return jsonify(_diary_payload(date_key))


@app.route("/api/diary/notes", methods=["POST"])
def api_update_diary_notes():
    data = request.get_json()
    date_key = data.get("date")

    entry = _get_diary_entry(date_key)
    entry["notes"] = data.get("notes", "")
    _save_diary_entry(date_key, entry)

    return jsonify(_diary_payload(date_key))


@app.route("/api/diary/complete", methods=["POST"])
def api_complete_diary():
    # Flag the diary entry as completed
    date_key = request.get_json().get("date")

    entry = _get_diary_entry(date_key)
    entry["completed"] = True
    _save_diary_entry(date_key, entry)

    return jsonify(_diary_payload(date_key))

@app.route("/api/diary/unlock", methods=["POST"])
def api_unlock_diary():
    # Flag the diary entry as not completed, allowing edits again (only for today)
    date_key = request.get_json().get("date")

    today_iso = date.today().isoformat()
    if date_key != today_iso:
        return jsonify({"error": "You can only edit today's diary."}), 400

    entry = _get_diary_entry(date_key)
    entry["completed"] = False
    _save_diary_entry(date_key, entry)

    return jsonify(_diary_payload(date_key))


# --- APP ROUTES ---
def login_required(f):
    # Decorator to require authentication for protected routes
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)

    return decorated


@app.route("/")
@login_required
def index():
    return render_template("index/index.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # Handle authentication against database
        conn = get_db_connection()
        if not conn:
            flash("Database connection failed. Ensure MySQL is running.")
            return render_template("Login/Login.html")
            
        cursor = conn.cursor(dictionary=True)

        email = request.form.get("email")
        password = request.form.get("password")

        cursor.execute(
            "SELECT * FROM users WHERE email=%s AND password=%s", (email, password)
        )
        user = cursor.fetchone()
        conn.close()

        if user:
            # Cache user data in session cookie to minimize DB queries
            session.update(
                {
                    "user_id": user["id"],
                    "username": user["username"],
                    "age": user["age"],
                    "height": user["height"],
                    "gender": user["gender"],
                    "weight": user.get("current_weight", "N/A"),
                    "neck": user.get("neck_entry", "N/A"),
                    "waist": user.get("waist_entry", "N/A"),
                    "hips": user.get("hips_entry", "N/A"),
                }
            )
            session.permanent = True
            return redirect(url_for("index"))

        flash("Invalid credentials")

    return render_template("Login/Login.html")


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        # Handle new user registration
        conn = get_db_connection()
        if not conn:
            flash("Database connection failed. Ensure MySQL is running.")
            return render_template("Register/Register.html")
            
        cursor = conn.cursor(dictionary=True)

        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")
        age = request.form.get("age")
        height = request.form.get("height")
        gender = request.form.get("gender")

        # Insert new user record (Note: plaintext password used for simplicity)
        cursor.execute(
            "INSERT INTO users (username, email, password, age, height, gender) VALUES (%s, %s, %s, %s, %s, %s)",
            (username, email, password, age, height, gender),
        )
        conn.commit()

        # Auto-login newly created user
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()
        conn.close()

        session.update(
            {
                "user_id": user["id"],
                "username": user["username"],
                "age": user["age"],
                "height": user["height"],
                "gender": user["gender"],
                "weight": "N/A",
            }
        )
        session.permanent = True

        return redirect(url_for("index"))

    return render_template("Register/Register.html")


@app.route("/check_in", methods=["GET", "POST"])
@login_required
def check_in():
    if request.method == "POST":
        # Process user metric updates
        conn = get_db_connection()
        cursor = conn.cursor()

        weight = request.form.get("weight")
        neck = request.form.get("neck")
        waist = request.form.get("waist")
        hips = request.form.get("hips")
        steps = request.form.get("steps")

        # Use COALESCE/NULLIF to preserve existing values if fields are submitted blank
        cursor.execute(
            "UPDATE users SET current_weight=%s, neck_entry=COALESCE(NULLIF(%s,''), neck_entry), waist_entry=COALESCE(NULLIF(%s,''), waist_entry), hips_entry=COALESCE(NULLIF(%s,''), hips_entry) WHERE id=%s",
            (weight, neck, waist, hips, session["user_id"]),
        )

        # Upsert progress data into charts report
        cursor.execute(
            "INSERT INTO charts_report (user_id, weight, steps, date_added) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE weight=VALUES(weight), steps=VALUES(steps)",
            (session["user_id"], weight, steps, date.today()),
        )

        conn.commit()
        conn.close()

        # Sync updated metrics back to session cache
        session.update(
            {
                k: request.form.get(k)
                for k in ["weight", "neck", "waist", "hips"]
                if request.form.get(k)
            }
        )

        flash("Progress saved!")
        return redirect(url_for("check_in"))

    return render_template("Check-In/Check-In.html")


@app.route("/food_diary", methods=["GET", "POST"])
@login_required
def food_diary():
    current_date = request.args.get("date", date.today().strftime("%Y-%m-%d"))
    return render_template("Food-Diary/Food-Diary.html", current_date=current_date)


@app.route("/api/charts/data")
@login_required
def api_charts_data():
    conn = get_db_connection()
    if not conn:
        return jsonify([])

    cursor = conn.cursor(dictionary=True)
    user_id = session["user_id"]

    cursor.execute("""
        SELECT date_added as date, weight, steps, calories, water_intake as water 
        FROM charts_report 
        WHERE user_id = %s 
        ORDER BY date_added ASC
    """, (user_id,))
    
    rows = cursor.fetchall()
    conn.close()

    # Format dates as ISO strings
    for row in rows:
        if row["date"]:
            row["date"] = row["date"].isoformat()

    return jsonify(rows)

@app.route("/charts")
@login_required
def charts():
    return render_template("Charts/Charts.html")


@app.route("/profile")
@login_required
def profile():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE id=%s", (session["user_id"],))
    user = cursor.fetchone()
    conn.close()
    return render_template("Profile/Profile.html", user=user)


@app.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request.method == "POST":
        username = request.form.get("username")
        age = request.form.get("age")
        gender = request.form.get("gender")
        about_me = request.form.get("about_me", "")
        motivation = request.form.get("motivation", "")
        inspiration = request.form.get("inspiration", "")

        cursor.execute(
            """UPDATE users 
               SET username=COALESCE(NULLIF(%s,''), username), 
                   age=COALESCE(NULLIF(%s,''), age), 
                   gender=COALESCE(NULLIF(%s,''), gender),
                   about_me=NULLIF(%s,''),
                   motivation=NULLIF(%s,''),
                   inspiration=NULLIF(%s,'')
               WHERE id=%s""",
            (username, age, gender, about_me, motivation, inspiration, session["user_id"]),
        )
        conn.commit()
        session.update({k: request.form.get(k) for k in ["username", "age", "gender"] if request.form.get(k)})

        flash("Profile saved successfully.")
        return redirect(url_for("settings"))

    cursor.execute("SELECT * FROM users WHERE id=%s", (session["user_id"],))
    user = cursor.fetchone()
    print(user)
    conn.close()
    return render_template("Settings/Settings.html", user=user)

@app.route("/api/profile", methods=["GET", "POST"])
@login_required
def api_profile():
    user_id = session["user_id"]
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
        
    cursor = conn.cursor(dictionary=True)

    if request.method == "GET":
        cursor.execute("""
            SELECT username, age, gender, about_me, motivation, inspiration
            FROM users WHERE id=%s
        """, (user_id,))
        user = cursor.fetchone()
        
        profile_state = {
            "name": user["username"],
            "age": user["age"],
            "gender": user["gender"].capitalize() if user["gender"] else "Male",
            "memberSince": "Recently Joined",
            "aboutMe": user["about_me"] or "",
            "whyShape": user["motivation"] or "",      
            "inspirations": user["inspiration"] or "", 
        }
            
        conn.close()
        return jsonify(profile_state)

    if request.method == "POST":
        data = request.get_json()
        
        # Update your specific columns!
        cursor.execute("""
            UPDATE users 
            SET username=COALESCE(NULLIF(%s,''), username), 
                age=COALESCE(NULLIF(%s,''), age), 
                gender=COALESCE(NULLIF(%s,''), gender), 
                about_me=NULLIF(%s,''), motivation=NULLIF(%s,''), inspiration=NULLIF(%s,''),
            WHERE id=%s
        """, (
            data.get("name"), 
            data.get("age"), 
            data.get("gender"), 
            data.get("aboutMe", ""), 
            data.get("whyShape", ""),      
            data.get("inspirations", ""),  
            user_id
        ))
        
        conn.commit()
        conn.close()
        
        session["username"] = data.get("name")
        session["age"] = data.get("age")
        session["gender"] = data.get("gender")
        
        return jsonify({"status": "success"})

@app.route("/logout")
def logout():
    # Clear session data to terminate session
    session.clear()
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True)
