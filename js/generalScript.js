$(document).ready(function()
{
    $(document).trigger("resize");
});

function switchTo(pageIn)
{
    var pageOff = pageIn === "leaderboard" ? "game" : "leaderboard";
    var activeButton = pageIn === "leaderboard" ? "#history-view-button" : "#game-view-button";

    if(!$(activeButton).hasClass("is-active"))
    { 
        $(".view-nav-button").removeClass("is-active");
        $(activeButton).addClass("is-active");
        animationPage(pageOff, "out");
        animationPage(pageIn, "in");
        if (pageIn === "leaderboard" && typeof sortLeaderboard === "function") {
            sortLeaderboard("time", "asc");
        }
    }
}

function animationPage(page, direction)
{
    var page = page == "game" ? $(".game") : $(".leaderboard");
    if(direction == "out")
        page.fadeOut("fast");
    else
        page.delay(200).fadeIn("fast");
}