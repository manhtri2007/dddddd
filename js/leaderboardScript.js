var leaderboardDiffName = 'all';

$(document).ready(function () {
    leaderboardDiffName = $('#mode :selected').text();
    renderLeaderboard();
});

function sortLeaderboard(mode, dir) {
    var entries = loadLeaderboardEntries();
    if (mode === 'time') {
        entries.sort(function (a, b) {
            return a.timeAlive - b.timeAlive;
        });
        if (dir === 'dec') {
            entries.reverse();
        }
    } else {
        entries.sort(function (a, b) {
            return a.rawDate - b.rawDate;
        });
        if (dir === 'dec') {
            entries.reverse();
        }
    }

    renderLeaderboard(entries);
}

function loadLeaderboardEntries() {
    try {
        var raw = JSON.parse(localStorage.getItem('dontTapWhiteTiles.history') || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch (error) {
        return [];
    }
}

function renderLeaderboard(entries) {
    var list = entries && entries.length ? entries : loadLeaderboardEntries();
    list.sort(function (a, b) {
        return Number(b.totalScore) - Number(a.totalScore);
    });

    $('.bodyGrid').empty();
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var temp = $('.leaderboardTemplate').clone();
        temp.removeClass('leaderboardTemplate');
        temp.addClass('leaderboardField');
        temp.find('.leaderboardName').text(item.id || 'Player');
        temp.find('.leaderboardTime').text(item.totalScore + ' pts');
        temp.find('.leaderboardDate').text(item.date || 'N/A');
        temp.attr('id', item.rawDate || i);
        $('.bodyGrid').append(temp);
    }
}

function animationEnd(mode, replace) {
    $('#stateArrow' + mode).one('animationend', function () {
        $('#stateArrow' + mode).attr('src', 'assets/icons/' + replace + '.svg');
        $('#stateArrow' + mode).toggleClass('slideOut slideIn');
    });
    $('#stateArrow' + mode).one('animationend', function () {
        $('#stateArrow' + mode).removeClass('slideIn slideOut');
    });
}

function leaderboardUpdate(leaderboardDiffName, arr) {
    renderLeaderboard(arr);
}

function deleteModal(idScore) {
    $('.deleteModal').attr('data-delete', idScore);
    $('.deleteModal').find('.deleteName').text($('#' + idScore).find('.leaderboardName').text());
    $('.deleteModal').find('.deleteTime').text($('#' + idScore).find('.leaderboardTime').text());
    $('.deleteModal').find('.deleteDate').text($('#' + idScore).find('.leaderboardDate').text());
    $('.deleteScore').css('display', 'flex');
    $('.deleteModal').css('display', 'flex');
}

function deleteScore(idScore) {
    if (idScore !== -1) {
        var list = loadLeaderboardEntries();
        list = list.filter(function (item) {
            return String(item.rawDate) !== String(idScore);
        });
        localStorage.setItem('dontTapWhiteTiles.history', JSON.stringify(list));
        renderLeaderboard(list);
    }
    $('.deleteScore').css('display', 'none');
    $('.deleteModal').css('display', 'none');
}

window.renderLeaderboard = renderLeaderboard;
window.sortLeaderboard = sortLeaderboard;