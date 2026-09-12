function loadLeaderboardEntries() {
    try {
        var raw = JSON.parse(localStorage.getItem('dontTapWhiteTiles.history') || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch (error) {
        return [];
    }
}

function renderLeaderboard() {
    var list = loadLeaderboardEntries();
    list.sort(function (a, b) {
        return Number(b.score || 0) - Number(a.score || 0);
    });

    var total = list.length;
    $('#history-count').text(total > 0 ? total : 0);
    $('#history-total').text(total > 0 ? total : 0);

    $('.bodyGrid').empty();
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var row = $('<div class="leaderboardField"></div>');
        row.append('<div class="leaderboardName">#' + (i + 1) + '</div>');
        row.append('<div class="leaderboardTime">' + (item.score || 0) + ' pts</div>');
        row.append('<div class="leaderboardDate">' + (item.date || 'N/A') + '</div>');
        $('.bodyGrid').append(row);
    }
}

$(document).ready(function () {
    renderLeaderboard();
});

window.renderLeaderboard = renderLeaderboard;