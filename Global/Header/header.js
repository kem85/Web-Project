function createHeader() {
    const header = document.getElementsByClassName('header')[0];
    header.innerHTML = `
<div class="logo">
    <h1>myfitnesspal</h1>
</div>

<div class="user-section">

<span>Hi <span id="username">User</span></span>



<a href="#">Help</a>
<a href="#">Settings</a>
<a href="#" class="logout">Logout</a>

</div>
`
}
createHeader();