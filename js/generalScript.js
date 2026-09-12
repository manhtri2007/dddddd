$(document).ready(function () {
    $('.leaderboard').hide();
    $('.game-area').show();
});

function switchTo(pageIn) {
    if (pageIn === 'leaderboard') {
        $('.game-area').hide();
        $('.leaderboard').show();
    } else {
        $('.leaderboard').hide();
        $('.game-area').show();
    }

    if (typeof window.renderLeaderboard === 'function') {
        window.renderLeaderboard();
    }
}

function animationPage(page, direction) {
    if (direction === 'out') {
        $(page).fadeOut('fast');
    } else {
        $(page).delay(200).fadeIn('fast');
    }
}