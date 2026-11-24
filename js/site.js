// Little gags: the profile picture jumps around when clicked,
// and links/text disappear once clicked.
document.addEventListener("DOMContentLoaded", function () {

    var year = document.getElementById("current-year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    var image = document.getElementById("profile-image");
    image.addEventListener("click", function () {
        var width = document.documentElement.clientWidth;
        var height = document.documentElement.clientHeight;
        var x = 75 + (Math.random() * (width - 150));
        var y = 75 + (Math.random() * (height - 150));

        image.style.position = "fixed";
        image.style.top = y + "px";
        image.style.right = x + "px";
    });

    document.querySelectorAll(".main-menu-button, .main-menu-text").forEach(function (element) {
        element.addEventListener("click", function () {
            element.remove();
        });
    });
});
