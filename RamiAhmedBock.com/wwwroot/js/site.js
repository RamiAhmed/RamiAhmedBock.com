$(function () {

    var image = $("#profile-image");
    image.click(function (evt) {

        var width = $(document).width();
        var height = $(document).height();
        var x = 75 + (Math.random() * (width - 150));
        var y = 75 + (Math.random() * (height - 150));
        image.css({ top: y + "px", right: x + "px", 'position': 'fixed' });

        gtag('event', 'profile_click', {
            'event_category': 'Profile Image Click'
        });
    });

    $(".main-menu-button").click(function (evt) {
        gtag('event', 'link', {
            'event_category': 'Main Button',
            'href': $(this).attr('href')
        });

        $(this).remove();
    });

    $(".main-menu-text").click(function (evt) {
        gtag('event', 'text', {
            'event_category': 'Main Text Hidden',
            'value': $(this).text()
        });

        $(this).remove();
    });
});
