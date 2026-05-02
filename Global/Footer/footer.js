function createFooter() {
    const footer = document.getElementsByClassName('main-footer')[0];
    footer.innerHTML = `
    <div class="footer-container">
        <nav class="footer-links">
            <a href="#">Calorie Counter</a>
            <a href="#">Blog</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Contact Us</a>
            <a href="#">API</a>
            <a href="#">Jobs</a>
            <a href="#">Feedback</a>
            <a href="#">Community Guidelines</a>
        </nav>

        <div class="footer-lang">
            <select>
                <option>English</option>
                <option>Español</option>
            </select>
        </div>
    </div>
    <div class="footer-copyright">
        © 2026 MyFitnessPal, Inc.
    </div>
`
}
createFooter();