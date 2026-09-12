$(document).ready(function()
{
    $(document).trigger("resize");
});

function switchTo(pageIn, element)
{
    var pageOff;
    pageIn === "leaderboard" ? pageOff = "game" : pageOff = "leaderboard";

    if(!element.hasClass("active"))
    { 
        $(".gamePage, .leaderboardPage").toggleClass("active");
        animationPage(pageOff, "out");
        animationPage(pageIn, "in");
        sortLeaderboard("time", "asc");
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