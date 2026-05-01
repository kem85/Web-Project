CREATE DATABASE IF NOT EXISTS myfitnesspal_db;
USE myfitnesspal_db;

-- Table to store user profiles
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email varchar(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    calories_goal INT,
    current_weight FLOAT,
    goal_weight FLOAT,
    height FLOAT,
    age INT NOT NULL,
    gender VARCHAR(10) NOT NULL,
    about_me VARCHAR(255),
    motivation VARCHAR(255),
    inspiration VARCHAR(255),
    neck_entry INT,
    waist_entry INT,
    hips_entry INT
);

-- Table to store food logs
CREATE TABLE food_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    calories INT,
    carbs INT,
    fat INT,
    protein INT,
    sodium INT,
    sugar INT,
    date_added DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE charts_report (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    weight INT,
    steps INT,
    calories INT,
    water_intake INT,
    date_added DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
