// Navigation for index page
function createNavFromIndex() {
    const nav = document.getElementsByClassName('navbar')[0];
    nav.innerHTML = `
<ul>
    <li><a href="index.html">My Home</a></li>
    <li><a href="../Check-In/Check-In.html">Check in</a></li>
    <li><a href="../Food-Diary/Food-Diary.html">Food Diary</a></li>
    <li><a href="../Charts/Charts.html">Charts</a></li>
    <li><a href="../Profile/Profile.html">Profile</a></li>
</ul>
`
}

// Navigation for Check_In page
function createNavFromCheckIn() {
    const nav = document.getElementsByClassName('navbar')[0];
    nav.innerHTML = `
<ul>
    <li><a href="../index/index.html">My Home</a></li>
    <li><a href="Check-In.html">Check in</a></li>
    <li><a href="../Food-Diary/Food-Diary.html">Food Diary</a></li>
    <li><a href="../Charts/Charts.html">Charts</a></li>
    <li><a href="../Profile/Profile.html">Profile</a></li>
</ul>
`
}

// Navigation for Food-Diary page
function createNavFromFoodDiary() {
    const nav = document.getElementsByClassName('navbar')[0];
    nav.innerHTML = `
<ul>
    <li><a href="../index/index.html">My Home</a></li>
    <li><a href="../Check-In/Check-In.html">Check in</a></li>
    <li><a href="Food-Diary.html">Food Diary</a></li>
    <li><a href="../Charts/Charts.html">Charts</a></li>
    <li><a href="../Profile/Profile.html">Profile</a></li>
</ul>
`
}

// Navigation for Charts page
function createNavFromCharts() {
    const nav = document.getElementsByClassName('navbar')[0];
    nav.innerHTML = `
<ul>
    <li><a href="../index/index.html">My Home</a></li>
    <li><a href="../Check-In/Check-In.html">Check in</a></li>
    <li><a href="../Food-Diary/Food-Diary.html">Food Diary</a></li>
    <li><a href="Charts.html">Charts</a></li>
    <li><a href="../Profile/Profile.html">Profile</a></li>
</ul>
`
}

// Navigation for Profile page
function createNavFromProfile() {
    const nav = document.getElementsByClassName('navbar')[0];
    nav.innerHTML = `
<ul>
    <li><a href="../index/index.html">My Home</a></li>
    <li><a href="../Check-In/Check-In.html">Check in</a></li>
    <li><a href="../Food-Diary/Food-Diary.html">Food Diary</a></li>
    <li><a href="../Charts/Charts.html">Charts</a></li>
    <li><a href="Profile.html">Profile</a></li>
</ul>
`
}