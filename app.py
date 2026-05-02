from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from datetime import date, timedelta
import requests
from Backend.db_connection import get_db_connection

app = Flask(__name__, 
            template_folder='.', 
            static_folder='.', 
            static_url_path='')

app.secret_key = 'dev_key_for_myfitnesspal'
# Ensures the session doesn't disappear when the browser closes
app.permanent_session_lifetime = timedelta(days=31)


# In-memory diary data used to connect Food Diary with Home without browser storage.
# It resets when Flask restarts, but it works across pages during the running session.
DIARY_ENTRIES = {}
MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"]
NUTRIENT_KEYS = ["calories", "carbs", "fat", "protein", "sodium", "sugar"]


def _safe_float(value, default=0):
    try:
        if value in (None, "", "N/A"):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _bounded_float(value, default, minimum, maximum):
    number = _safe_float(value, default)
    if number < minimum or number > maximum:
        return default
    return number


def _calculate_calorie_goal():
    # Keep impossible/corrupted session values from creating crazy goals like 6000+ calories.
    weight = _bounded_float(session.get('weight'), 70, 30, 250)
    height = _bounded_float(session.get('height'), 170, 100, 230)
    age = _bounded_float(session.get('age'), 25, 10, 100)
    gender = str(session.get('gender', 'male')).lower()

    bmr = 10 * weight + 6.25 * height - 5 * age
    bmr += -161 if gender in ("female", "woman") else 5
    return round(bmr)


def _daily_goals():
    calories = _calculate_calorie_goal()
    return {
        "calories": calories,
        "carbs": round((calories * 0.50) / 4),
        "fat": round((calories * 0.30) / 9),
        "protein": round((calories * 0.20) / 4),
        "sodium": 2300,
        "sugar": 80,
    }


def _entry_key(date_key):
    user_key = str(session.get('user_id', 'guest'))
    return f"{user_key}:{date_key}"


def _today_key():
    return date.today().isoformat()


def _parse_date_key(date_key):
    try:
        return date.fromisoformat(str(date_key))
    except (TypeError, ValueError):
        return date.today()


def _empty_meals():
    return {meal: [] for meal in MEALS}


def _empty_diary_entry():
    return {
        "meals": _empty_meals(),
        "waterCups": 0,
        "notes": "",
        "completed": False,
    }


def _get_diary_entry(date_key):
    key = _entry_key(date_key)
    if key not in DIARY_ENTRIES:
        DIARY_ENTRIES[key] = _empty_diary_entry()

    # Backward compatibility if an older server run stored only meals.
    if "meals" not in DIARY_ENTRIES[key]:
        DIARY_ENTRIES[key] = {
            "meals": DIARY_ENTRIES[key],
            "waterCups": 0,
            "notes": "",
            "completed": False,
        }

    return DIARY_ENTRIES[key]


def _is_diary_locked(date_key):
    entry = _get_diary_entry(date_key)
    # Only today's diary can be edited. Yesterday/past days and future days are read-only.
    if _parse_date_key(date_key) != date.today():
        return True
    return bool(entry.get("completed"))


def _lock_reason(date_key):
    selected = _parse_date_key(date_key)
    if selected < date.today():
        return "This day has passed, so the entry is locked."
    if selected > date.today():
        return "Future diary entries are read-only until that day."
    if _get_diary_entry(date_key).get("completed"):
        return "This entry was completed and is now locked."
    return ""


def _normalize_server_food(food):
    return {
        "name": str(food.get("name", "Food"))[:120],
        "servingSize": str(food.get("servingSize") or "Serving size not available")[:80],
        "calories": _safe_float(food.get("calories"), 0),
        "carbs": _safe_float(food.get("carbs"), 0),
        "fat": _safe_float(food.get("fat"), 0),
        "protein": _safe_float(food.get("protein"), 0),
        "sodium": _safe_float(food.get("sodium"), 0),
        "sugar": _safe_float(food.get("sugar"), 0),
    }


def _calculate_totals(meals):
    totals = {key: 0 for key in NUTRIENT_KEYS}
    for foods in meals.values():
        for food in foods:
            for key in NUTRIENT_KEYS:
                totals[key] += _safe_float(food.get(key), 0)
    return {key: round(value, 1) for key, value in totals.items()}


def _diary_payload(date_key):
    entry = _get_diary_entry(date_key)
    meals = entry["meals"]
    locked = _is_diary_locked(date_key)
    return {
        "date": date_key,
        "meals": meals,
        "totals": _calculate_totals(meals),
        "goals": _daily_goals(),
        "waterCups": _safe_float(entry.get("waterCups"), 0),
        "notes": entry.get("notes", ""),
        "completed": bool(entry.get("completed")),
        "locked": locked,
        "lockReason": _lock_reason(date_key) if locked else "",
    }

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


# --- FOOD API HELPERS ---
def _to_number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def _pick_nutrient(nutrients, names):
    for name in names:
        value = _to_number(nutrients.get(name))
        if value > 0:
            return value
    return 0


def _normalize_food_product(product):
    nutrients = product.get('nutriments') or {}
    name = (
        product.get('product_name')
        or product.get('generic_name')
        or product.get('abbreviated_product_name')
    )

    if not name:
        return None

    calories = _pick_nutrient(nutrients, [
        'energy-kcal_serving',
        'energy-kcal_100g',
        'energy-kcal',
    ])

    if not calories:
        return None

    used_serving_value = _to_number(nutrients.get('energy-kcal_serving')) > 0
    serving_size = product.get('serving_size') or ('1 serving' if used_serving_value else '100 g')
    brands = product.get('brands') or ''
    brand = f" ({brands.split(',')[0]})" if brands else ''

    return {
        'name': f'{name}{brand}',
        'servingSize': serving_size,
        'calories': round(calories),
        'carbs': _pick_nutrient(nutrients, ['carbohydrates_serving', 'carbohydrates_100g', 'carbohydrates']),
        'fat': _pick_nutrient(nutrients, ['fat_serving', 'fat_100g', 'fat']),
        'protein': _pick_nutrient(nutrients, ['proteins_serving', 'proteins_100g', 'proteins']),
        # Open Food Facts stores sodium in grams, so convert to milligrams for the table.
        'sodium': round(_pick_nutrient(nutrients, ['sodium_serving', 'sodium_100g', 'sodium']) * 1000),
        'sugar': _pick_nutrient(nutrients, ['sugars_serving', 'sugars_100g', 'sugars']),
    }




# A small offline fallback keeps the food search usable when the public API is
# unreachable from the school/device network. The app still tries Open Food Facts first.
FALLBACK_FOODS = [
    {'name': 'Egg, boiled', 'servingSize': '1 large egg', 'calories': 78, 'carbs': 0.6, 'fat': 5.3, 'protein': 6.3, 'sodium': 62, 'sugar': 0.6},
    {'name': 'Egg, fried', 'servingSize': '1 large egg', 'calories': 90, 'carbs': 0.4, 'fat': 7, 'protein': 6.3, 'sodium': 95, 'sugar': 0.4},
    {'name': 'White rice, cooked', 'servingSize': '1 cup cooked', 'calories': 205, 'carbs': 45, 'fat': 0.4, 'protein': 4.3, 'sodium': 2, 'sugar': 0.1},
    {'name': 'Brown rice, cooked', 'servingSize': '1 cup cooked', 'calories': 216, 'carbs': 45, 'fat': 1.8, 'protein': 5, 'sodium': 10, 'sugar': 0.7},
    {'name': 'Chicken breast, cooked', 'servingSize': '100 g', 'calories': 165, 'carbs': 0, 'fat': 3.6, 'protein': 31, 'sodium': 74, 'sugar': 0},
    {'name': 'Chicken thigh, cooked', 'servingSize': '100 g', 'calories': 209, 'carbs': 0, 'fat': 10.9, 'protein': 26, 'sodium': 82, 'sugar': 0},
    {'name': 'Banana', 'servingSize': '1 medium', 'calories': 105, 'carbs': 27, 'fat': 0.4, 'protein': 1.3, 'sodium': 1, 'sugar': 14},
    {'name': 'Apple', 'servingSize': '1 medium', 'calories': 95, 'carbs': 25, 'fat': 0.3, 'protein': 0.5, 'sodium': 2, 'sugar': 19},
    {'name': 'Milk, whole', 'servingSize': '1 cup', 'calories': 149, 'carbs': 12, 'fat': 8, 'protein': 7.7, 'sodium': 105, 'sugar': 12},
    {'name': 'Milk, low fat', 'servingSize': '1 cup', 'calories': 102, 'carbs': 12, 'fat': 2.4, 'protein': 8.2, 'sodium': 107, 'sugar': 12},
    {'name': 'Bread, white', 'servingSize': '1 slice', 'calories': 80, 'carbs': 15, 'fat': 1, 'protein': 2.7, 'sodium': 150, 'sugar': 1.5},
    {'name': 'Bread, whole wheat', 'servingSize': '1 slice', 'calories': 81, 'carbs': 14, 'fat': 1.1, 'protein': 4, 'sodium': 144, 'sugar': 1.6},
    {'name': 'Oats', 'servingSize': '40 g dry', 'calories': 150, 'carbs': 27, 'fat': 3, 'protein': 5, 'sodium': 0, 'sugar': 1},
    {'name': 'Pasta, cooked', 'servingSize': '1 cup cooked', 'calories': 200, 'carbs': 42, 'fat': 1.2, 'protein': 7, 'sodium': 1, 'sugar': 1.2},
    {'name': 'Potato, baked', 'servingSize': '1 medium', 'calories': 161, 'carbs': 37, 'fat': 0.2, 'protein': 4.3, 'sodium': 17, 'sugar': 2},
    {'name': 'Greek yogurt, plain', 'servingSize': '170 g', 'calories': 100, 'carbs': 6, 'fat': 0.7, 'protein': 17, 'sodium': 61, 'sugar': 5},
    {'name': 'Tuna, canned in water', 'servingSize': '100 g', 'calories': 116, 'carbs': 0, 'fat': 1, 'protein': 26, 'sodium': 338, 'sugar': 0},
    {'name': 'Salmon, cooked', 'servingSize': '100 g', 'calories': 206, 'carbs': 0, 'fat': 12, 'protein': 22, 'sodium': 59, 'sugar': 0},
    {'name': 'Beef steak, cooked', 'servingSize': '100 g', 'calories': 271, 'carbs': 0, 'fat': 19, 'protein': 25, 'sodium': 58, 'sugar': 0},
    {'name': 'Almonds', 'servingSize': '28 g', 'calories': 164, 'carbs': 6, 'fat': 14, 'protein': 6, 'sodium': 0, 'sugar': 1.2},
    {'name': 'Peanut butter', 'servingSize': '2 tbsp', 'calories': 188, 'carbs': 6, 'fat': 16, 'protein': 8, 'sodium': 147, 'sugar': 3},
    {'name': 'Orange', 'servingSize': '1 medium', 'calories': 62, 'carbs': 15, 'fat': 0.2, 'protein': 1.2, 'sodium': 0, 'sugar': 12},
    {'name': 'Tomato', 'servingSize': '1 medium', 'calories': 22, 'carbs': 4.8, 'fat': 0.2, 'protein': 1.1, 'sodium': 6, 'sugar': 3.2},
    {'name': 'Cucumber', 'servingSize': '100 g', 'calories': 15, 'carbs': 3.6, 'fat': 0.1, 'protein': 0.7, 'sodium': 2, 'sugar': 1.7},
    {'name': 'Lentils, cooked', 'servingSize': '1 cup cooked', 'calories': 230, 'carbs': 40, 'fat': 0.8, 'protein': 18, 'sodium': 4, 'sugar': 3.6},
]


def _fallback_food_search(query):
    query_words = [word for word in query.lower().split() if word]
    if not query_words:
        return []

    matches = []
    for food in FALLBACK_FOODS:
        search_text = f"{food['name']} {food['servingSize']}".lower()
        if all(word in search_text for word in query_words) or any(word in search_text for word in query_words):
            matches.append(food)

    return matches[:10]

@app.route('/api/food-search')
def food_search():
    query = request.args.get('q', '').strip()

    if len(query) < 2:
        return jsonify({'foods': [], 'message': 'Please enter at least 2 characters.'})

    fallback_foods = _fallback_food_search(query)

    try:
        response = requests.get(
            'https://world.openfoodfacts.org/api/v2/search',
            params={
                'search_terms': query,
                'fields': 'product_name,generic_name,abbreviated_product_name,brands,serving_size,nutriments',
                'page_size': 20,
                'sort_by': 'unique_scans_n',
            },
            headers={
                'User-Agent': 'FitnessTrackerVY/1.0 (student-project; contact: local)'
            },
            timeout=8,
        )
        response.raise_for_status()

        products = response.json().get('products', [])
        foods = []
        seen_names = set()

        for product in products:
            food = _normalize_food_product(product)
            if not food:
                continue

            key = food['name'].lower()
            if key in seen_names:
                continue

            seen_names.add(key)
            foods.append(food)

        # If the public API gives weak/empty results for generic searches like
        # "rice", add our common-food fallback after the online results.
        for food in fallback_foods:
            key = food['name'].lower()
            if key not in seen_names:
                foods.append(food)
                seen_names.add(key)

        return jsonify({'foods': foods[:10], 'source': 'openfoodfacts'})

    except requests.RequestException:
        # Do not return a 502 to the frontend. Return useful fallback results so
        # the Add Food modal still works when Open Food Facts is blocked/offline.
        return jsonify({
            'foods': fallback_foods,
            'source': 'fallback',
            'message': 'Online food API is unavailable, showing common foods instead.',
        })


@app.route('/api/diary')
def api_get_diary():
    date_key = request.args.get('date') or _today_key()
    return jsonify(_diary_payload(date_key))


@app.route('/api/diary/add', methods=['POST'])
def api_add_diary_food():
    data = request.get_json(silent=True) or {}
    date_key = data.get('date') or _today_key()
    meal = data.get('meal')
    food = data.get('food') or {}

    if meal not in MEALS:
        return jsonify({"error": "Invalid meal."}), 400

    if _is_diary_locked(date_key):
        return jsonify({"error": _lock_reason(date_key) or "This diary entry is locked.", "locked": True}), 423

    normalized_food = _normalize_server_food(food)
    if not normalized_food["name"] or normalized_food["calories"] <= 0:
        return jsonify({"error": "Invalid food data."}), 400

    entry = _get_diary_entry(date_key)
    entry["meals"][meal].append(normalized_food)
    return jsonify(_diary_payload(date_key))


@app.route('/api/diary/remove', methods=['POST'])
def api_remove_diary_food():
    data = request.get_json(silent=True) or {}
    date_key = data.get('date') or _today_key()
    meal = data.get('meal')
    index = data.get('index')

    if meal not in MEALS:
        return jsonify({"error": "Invalid meal."}), 400

    if _is_diary_locked(date_key):
        return jsonify({"error": _lock_reason(date_key) or "This diary entry is locked.", "locked": True}), 423

    try:
        index = int(index)
        entry = _get_diary_entry(date_key)
        meals = entry["meals"]
        if 0 <= index < len(meals[meal]):
            meals[meal].pop(index)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid food index."}), 400

    return jsonify(_diary_payload(date_key))


@app.route('/api/diary/water', methods=['POST'])
def api_update_diary_water():
    data = request.get_json(silent=True) or {}
    date_key = data.get('date') or _today_key()

    if _is_diary_locked(date_key):
        return jsonify({"error": _lock_reason(date_key) or "This diary entry is locked.", "locked": True}), 423

    entry = _get_diary_entry(date_key)
    action = data.get('action')

    if action == 'reset':
        entry['waterCups'] = 0
    else:
        amount = _safe_float(data.get('cups'), 0)
        if amount <= 0:
            return jsonify({"error": "Invalid water amount."}), 400
        entry['waterCups'] = max(0, _safe_float(entry.get('waterCups'), 0) + amount)

    return jsonify(_diary_payload(date_key))


@app.route('/api/diary/notes', methods=['POST'])
def api_update_diary_notes():
    data = request.get_json(silent=True) or {}
    date_key = data.get('date') or _today_key()

    if _is_diary_locked(date_key):
        return jsonify({"error": _lock_reason(date_key) or "This diary entry is locked.", "locked": True}), 423

    entry = _get_diary_entry(date_key)
    entry['notes'] = str(data.get('notes') or '')[:2000]
    return jsonify(_diary_payload(date_key))


@app.route('/api/diary/complete', methods=['POST'])
def api_complete_diary():
    data = request.get_json(silent=True) or {}
    date_key = data.get('date') or _today_key()

    if _parse_date_key(date_key) != date.today():
        return jsonify({"error": _lock_reason(date_key) or "Only today's entry can be completed.", "locked": True}), 423

    entry = _get_diary_entry(date_key)
    entry['completed'] = True
    return jsonify(_diary_payload(date_key))


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

        weight_value = _safe_float(weight, None)
        if weight_value is None or weight_value < 30 or weight_value > 250:
            flash("Please enter a realistic weight between 30 and 250 kg.")
            return redirect(url_for('check_in'))
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

@app.route('/food_diary', methods=['GET', 'POST'])
def food_diary():
    if request.method == 'POST':
        calories = request.form.get('calories')
        carbs = request.form.get('carbs')
        fat = request.form.get('fat')
        protein = request.form.get('protein')
        sodium = request.form.get('sodium')
        sugar = request.form.get('sugar')
        entry_date = request.form.get('date')
        user_id = session['user_id']
    else:
        target_date = request.args.get('date')
        if not target_date:
            target_date = date.today().strftime('%Y-%m-%d')
        print(f"Retrieving diary entries for user {session['user_id']} on {target_date}")

    return render_template('Food-Diary/Food-Diary.html', current_date=target_date)

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