var leaderboardDiffName = 'all';
var selectedHistoryId = null;

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
    } else if (mode === 'date') {
        entries.sort(function (a, b) {
            var dateDifference = Number(b.rawDate || 0) - Number(a.rawDate || 0);
            return dateDifference || Number(b.totalScore || 0) - Number(a.totalScore || 0);
        });
    } else {
        entries.sort(function (a, b) {
            return Number(b.totalScore || 0) - Number(a.totalScore || 0);
        });
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
    var hasProvidedEntries = entries && entries.length;
    var list = hasProvidedEntries ? entries : loadLeaderboardEntries();
    if (!hasProvidedEntries) {
        list.sort(function (a, b) {
            var dateDifference = Number(b.rawDate || 0) - Number(a.rawDate || 0);
            return dateDifference || Number(b.totalScore || 0) - Number(a.totalScore || 0);
        });
    }

    var totalPlays = list.length;
    var latestPlay = list.reduce(function (latest, item) {
        return Math.max(latest, Number(item.playNumber) || 0);
    }, totalPlays);
    $('#historySummary').text('Lượt chơi: ' + latestPlay + ' / Tổng số lượt: ' + totalPlays);

    $('.bodyGrid').empty();
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var temp = $('.leaderboardTemplate').clone();
        temp.removeClass('leaderboardTemplate');
        temp.addClass('leaderboardField');
        var playLabel = item.playNumber ? 'Lượt #' + item.playNumber : 'Lượt #' + (i + 1);
        temp.find('.leaderboardName').text(playLabel + ' - ' + (item.id || 'Player'));
        temp.find('.leaderboardTime').text(item.totalScore + ' pts');
        temp.find('.leaderboardDate').text(item.date || 'N/A');
        temp.attr('id', item.rawDate || i);
        temp.attr('data-history-id', item.rawDate || i);
        temp.on('click', function () {
            showHistoryDetails($(this).attr('data-history-id'));
        });
        $('.bodyGrid').append(temp);
    }
}

function showHistoryDetails(id) {
    var entry = loadLeaderboardEntries().find(function (item) {
        return String(item.rawDate) === String(id);
    });
    if (!entry) {
        return;
    }

    selectedHistoryId = id;
    var details = [
        ['Lượt chơi', entry.playNumber || 'N/A'],
        ['Điểm', Number(entry.totalScore || 0).toFixed(2) + ' pt'],
        ['Thời gian sống', (entry.timeAlive || 0) + ' giây'],
        ['Tốc độ cao nhất', Number(entry.maxRate || 0).toFixed(2) + ' tile/s'],
        ['Tốc độ thấp nhất', Number(entry.minRate || 0).toFixed(2) + ' tile/s'],
        ['Tốc độ trung bình', Number(entry.avgRate || 0).toFixed(2) + ' tile/s'],
        ['Hệ số cao nhất', 'x' + Number(entry.maxMultiplier || 0).toFixed(2)],
        ['Hệ số thấp nhất', 'x' + Number(entry.minMultiplier || 0).toFixed(2)],
        ['Hệ số trung bình', 'x' + Number(entry.avgMultiplier || 0).toFixed(2)],
        ['Kết quả', entry.win ? 'Thắng' : 'Thua'],
        ['Ngày chơi', entry.date || 'N/A']
    ];

    $('.history-details-content').html(details.map(function (detail) {
        return '<div class="history-detail-row"><strong>' + detail[0] + '</strong><span>' + detail[1] + '</span></div>';
    }).join(''));
    $('#historyDetails').css('display', 'flex');
}

function closeHistoryDetails() {
    selectedHistoryId = null;
    $('#historyDetails').hide();
}

function deleteSelectedHistory() {
    if (selectedHistoryId === null) {
        return;
    }
    deleteScore(selectedHistoryId);
    closeHistoryDetails();
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
window.showHistoryDetails = showHistoryDetails;
window.closeHistoryDetails = closeHistoryDetails;
window.deleteSelectedHistory = deleteSelectedHistory;