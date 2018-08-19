$(function () {

    var image = $("#profile-image");
    image.click(function (evt) {

        var width = $(document).width();
        var height = $(document).height();
        var x = 75 + (Math.random() * (width - 150));
        var y = 75 + (Math.random() * (height - 150));
        image.css({ top: y + "px", left: x + "px", 'position': 'fixed' });

        //console.log("clicked " + x + ", " + y + ", width: " + width + ", height: " + height);
        gtag('event', 'profile_click', {
            'event_category': 'Profile Image Click'
        });
    });

    $("#main-menu-button").click(function (evt) {
        gtag('event', 'link', {
            'event_category': 'Main Menu Button',
            'href': $(this).attr('href')
        });
    });
});
