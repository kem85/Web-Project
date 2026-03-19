function createNav() {
    const nav = document.getElementsByClassName('navbar')[0];
    nav.innerHTML = `
<ul>
    <li><a href="../../index/index.html">My Home</a></li>
 <li><a href="../../Check-In/Check-In.html" >Check in</a></li>
 <li><a href="../../Food-Diary/Food-Diary.html" >Food Diary</a></li>
 <li><a href="../../Charts/Charts.html" >Charts</a></li>
 <li><a href="../../Profile/Profile.html" >Profile</a></li>
</ul>
`
}
createNav();