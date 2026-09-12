var score = 0;
var lives = 3;
var roundDurationSeconds = 30;
var gridSize = 4;
var blackTileLimit = 2;
var roundStarted = false;
var gameEnded = false;
var roundTimerInterval = null;
var blackTileTimerInterval = null;
var roundStartTimestamp = 0;
var roundRemainingMs = 30000;
var lastRemovedBlackTileId = null;
var tileSpawnData = {};
var clickRateBySecond = [];
var totalRoundSeconds = 30;
var totalMisses = 0;
var blackTilesClicked = 0;
var chartInstance = null;
var correctTileSound = null;

$(document).ready(function () {
    loadSettings();
    createBoard();
    bindGameEvents();
    updateScoreDisplay();
    updateLivesDisplay();
    updateRoundTimerDisplay();
    startGame();
});

function playCorrectTileSound() {
    if (!correctTileSound) {
        correctTileSound = new Audio('assets/sounds/correct-tile.mp3');
        correctTileSound.volume = 0.7;
    }
    correctTileSound.currentTime = 0;
    correctTileSound.play().catch(function () {});
}

function loadSettings() {
    var saved = JSON.parse(localStorage.getItem('dontTapWhiteTiles.settings') || '{}');
    roundDurationSeconds = Number(saved.roundDuration || 30);
    gridSize = Number(saved.gridSize || 4);
    blackTileLimit = Number(saved.blackTileCount || 2);
    totalRoundSeconds = roundDurationSeconds;
    clickRateBySecond = new Array(totalRoundSeconds).fill(0);
}

function bindGameEvents() {
    $(document).on('keydown', function (event) {
        if (!window.modalStatus) {
            if (event.key === window.escapeKey) {
                event.preventDefault();
                startGame();
            }
            if ((event.key === window.key1) || (event.key === window.key2)) {
                event.preventDefault();
                simulateKeyTapAtPointer();
            }
        } else if (event.key === window.submitKey) {
            event.preventDefault();
            $('.submit:visible').trigger('click');
        }
    });

    document.addEventListener('pointerdown', function (event) {
        var target = event.target;
        if (gameEnded) {
            return;
        }

        if (target && target.closest && target.closest('.view-nav, .optionButton, button, a, select, input, .submit, .restart')) {
            return;
        }

        if (target && target.closest && target.closest('.square')) {
            var tile = target.closest('.square');
            if (tile.dataset.processing === 'true') {
                return;
            }
            event.preventDefault();
            if (tile.classList.contains('black')) {
                handleCorrectTileClick(tile, event);
            } else {
                handleWrongTap(event.clientX, event.clientY, tile);
            }
            return;
        }
    }, true);

    $(window).resize(function () {
        if ($(window).width() <= 750) {
            $('#gameContainer').css('height', $('#gameContainer').width() + 'px');
        } else {
            $('#gameContainer').css('height', '600px');
        }
    });

    $(window).trigger('resize');
}

function simulateKeyTapAtPointer() {
    var x = window.lastPointerX || window.innerWidth / 2;
    var y = window.lastPointerY || window.innerHeight / 2;
    var target = document.elementFromPoint(x, y);
    if (!target) {
        return;
    }
    if (target.closest && target.closest('.square')) {
        var tile = target.closest('.square');
        if (tile.dataset.processing === 'true') {
            return;
        }
        if (tile.classList.contains('black')) {
            handleCorrectTileClick(tile, { clientX: x, clientY: y });
        } else {
            handleWrongTap(x, y, tile);
        }
        return;
    }
    handleWrongTap(x, y, null);
}

function startGame() {
    clearRoundIntervals();
    resetGameState();
    createBoard();
    populateBlackTiles();
    $('.restart').fadeOut();
    window.modalStatus = false;
    $('.endgame').hide();
    $('.winGame, .loseGame').hide();
}

function resetGameState() {
    score = 0;
    lives = 3;
    roundStarted = false;
    gameEnded = false;
    roundStartTimestamp = 0;
    roundRemainingMs = roundDurationSeconds * 1000;
    totalMisses = 0;
    blackTilesClicked = 0;
    lastRemovedBlackTileId = null;
    tileSpawnData = {};
    clickRateBySecond = new Array(totalRoundSeconds).fill(0);
    updateScoreDisplay();
    updateBlackTilesClickedDisplay();
    updateLivesDisplay();
    updateRoundTimerDisplay();
}

function createBoard() {
    $('#gameContainer').removeClass();
    $('#gameContainer').addClass('size-' + gridSize);
    $('#gameContainer > .square:not(#tileTemplate)').remove();

    var totalTiles = gridSize * gridSize;
    for (var i = 1; i <= totalTiles; i++) {
        var tile = $('#tileTemplate').clone();
        tile.attr('id', 'tile-' + i);
        tile.removeAttr('style');
        tile.removeClass('black black-hit white-hit');
        tile.data('processing', 'false');
        tile.html('<div class="tile-progress"></div>');
        $('#gameContainer').append(tile);
    }
}

function populateBlackTiles() {
    var tiles = $('#gameContainer .square').not('.black, #tileTemplate').toArray();
    var count = Math.min(blackTileLimit, tiles.length);
    while (count > 0 && tiles.length) {
        var pick = Math.floor(Math.random() * tiles.length);
        var tile = tiles.splice(pick, 1)[0];
        if (activateBlackTile(tile)) {
            count--;
        }
    }
}

function activateBlackTile(tile) {
    if (!tile || !tile.id || tile.id === 'tileTemplate' || tile.dataset.processing === 'true' || tile.classList.contains('black')) {
        return false;
    }

    if (lastRemovedBlackTileId && tile.id === 'tile-' + lastRemovedBlackTileId) {
        return false;
    }

    tile.classList.add('black');
    tile.classList.remove('black-hit', 'white-hit');
    var progressEl = tile.querySelector('.tile-progress');
    if (progressEl) {
        progressEl.style.transform = 'scaleY(1)';
    }

    var spawnTime = performance.now();
    tileSpawnData[tile.id] = {
        spawnTime: spawnTime,
        lifetime: 1500,
        tickId: null
    };

    var updateProgress = function () {
        var state = tileSpawnData[tile.id];
        if (!state || !tile.classList.contains('black')) {
            return;
        }

        var elapsed = performance.now() - state.spawnTime;
        var remainingRatio = Math.max(0, 1 - (elapsed / state.lifetime));
        if (progressEl) {
            progressEl.style.transform = 'scaleY(' + remainingRatio + ')';
        }

        if (elapsed < state.lifetime && !gameEnded) {
            state.tickId = requestAnimationFrame(updateProgress);
        } else if (!gameEnded) {
            removeBlackTile(tile, 'timeout');
        }
    };

    var state = tileSpawnData[tile.id];
    if (state) {
        state.tickId = requestAnimationFrame(updateProgress);
    }
    return true;
}

function handleCorrectTileClick(tile, event) {
    if (gameEnded || tile.dataset.processing === 'true') {
        return;
    }

    tile.dataset.processing = 'true';
    playCorrectTileSound();
    blackTilesClicked += 1;
    updateBlackTilesClickedDisplay();
    if (!roundStarted) {
        roundStarted = true;
        startRoundTimer();
    }

    var spawnInfo = tileSpawnData[tile.id];
    var elapsed = spawnInfo ? (performance.now() - spawnInfo.spawnTime) : 0;
    var multiplier = Math.max(0, 1.5 - (elapsed / 1500));
    var points = Number((1 * multiplier).toFixed(2));

    score += points;
    updateScoreDisplay();
    recordClickRate();
    recordMultiplier(multiplier);
    createFloatingText(multiplier);

    tile.classList.remove('black');
    tile.classList.add('black-hit');
    tile.style.opacity = '0';
    if (tile.querySelector('.tile-progress')) {
        tile.querySelector('.tile-progress').style.transform = 'scaleY(0)';
    }

    delete tileSpawnData[tile.id];
    lastRemovedBlackTileId = tile.id.replace('tile-', '');
    if (!gameEnded) {
        refreshBlackTilePopulation();
    }
    setTimeout(function () {
        tile.classList.remove('black-hit');
        tile.style.opacity = '1';
        tile.dataset.processing = 'false';
        if (tile && tile.parentNode) {
            tile.classList.remove('black');
            tile.querySelector('.tile-progress').style.transform = 'scaleY(0)';
        }
    }, 100);
}

function handleWrongTap(x, y, tile) {
    if (gameEnded) {
        return;
    }

    if (tile) {
        tile.dataset.processing = 'true';
        tile.classList.add('white-hit');
        setTimeout(function () {
            tile.classList.remove('white-hit');
            tile.dataset.processing = 'false';
        }, 100);
    }

    createMissEffect(x, y);
    totalMisses += 1;
    lives -= 1;
    updateLivesDisplay();

    if (lives <= 0) {
        finishRound(false);
    }
}

function createMissEffect(x, y) {
    var hit = document.createElement('div');
    hit.className = 'miss-hit';
    hit.style.left = x + 'px';
    hit.style.top = y + 'px';
    document.body.appendChild(hit);
    setTimeout(function () {
        hit.remove();
    }, 100);
}

function createFloatingText(multiplier) {
    var area = document.getElementById('combo-area');
    if (!area) {
        return;
    }

    var text = document.createElement('div');
    text.className = 'combo-text';
    text.textContent = 'x' + Number(multiplier).toFixed(2);
    var randomX = 20 + Math.random() * 120;
    var randomY = 20 + Math.random() * 60;
    text.style.left = randomX + 'px';
    text.style.top = randomY + 'px';
    area.appendChild(text);
    setTimeout(function () {
        text.remove();
    }, 500);
}

function startRoundTimer() {
    roundStartTimestamp = performance.now();
    roundTimerInterval = setInterval(function () {
        if (gameEnded) {
            clearInterval(roundTimerInterval);
            return;
        }

        var elapsed = performance.now() - roundStartTimestamp;
        roundRemainingMs = Math.max(0, roundDurationSeconds * 1000 - elapsed);
        updateRoundTimerDisplay();

        if (roundRemainingMs <= 0) {
            gameOver();
        }
    }, 100);
}

function updateRoundTimerDisplay() {
    var remaining = Math.max(0, Math.ceil(roundRemainingMs / 1000));
    $('.timer').text(remaining || 0);
}

function gameOver() {
    finishRound(true);
}

function updateScoreDisplay() {
    $('.score').text(Number(score).toFixed(2));
}

function updateBlackTilesClickedDisplay() {
    $('.black-tiles-clicked').text(blackTilesClicked);
}

function updateLivesDisplay() {
    var hearts = '';
    for (var i = 0; i < 3; i++) {
        hearts += i < lives ? '♥' : '♡';
    }
    $('#lives').text(hearts);
}

function refreshBlackTilePopulation() {
    var activeBlackTiles = $('#gameContainer .square.black').length;
    while (activeBlackTiles < blackTileLimit) {
        var candidates = $('#gameContainer .square').not('.black, #tileTemplate');
        var safeCandidates = [];
        candidates.each(function () {
            if (this.id !== 'tile-' + lastRemovedBlackTileId && this.dataset.processing !== 'true' && !this.classList.contains('black-hit')) {
                safeCandidates.push(this);
            }
        });
        if (!safeCandidates.length) {
            break;
        }
        var tile = safeCandidates[Math.floor(Math.random() * safeCandidates.length)];
        activateBlackTile(tile);
        activeBlackTiles = $('#gameContainer .square.black').length;
    }
}

function clearRoundIntervals() {
    clearInterval(roundTimerInterval);
    roundTimerInterval = null;
    if (blackTileTimerInterval) {
        clearInterval(blackTileTimerInterval);
        blackTileTimerInterval = null;
    }
    Object.keys(tileSpawnData).forEach(function (tileId) {
        var tile = document.getElementById(tileId);
        if (tile) {
            tile.classList.remove('black');
            tile.querySelector('.tile-progress').style.transform = 'scaleY(0)';
        }
    });
    tileSpawnData = {};
}

function removeBlackTile(tile, reason) {
    if (!tile || !tile.id) {
        return;
    }

    if (tileSpawnData[tile.id]) {
        cancelAnimationFrame(tileSpawnData[tile.id].tickId);
        delete tileSpawnData[tile.id];
    }

    tile.classList.remove('black');
    var progressEl = tile.querySelector('.tile-progress');
    if (progressEl) {
        progressEl.style.transform = 'scaleY(0)';
    }
    lastRemovedBlackTileId = tile.id.replace('tile-', '');
    if (reason !== 'hit') {
        refreshBlackTilePopulation();
    }
}

function recordClickRate() {
    if (!roundStarted) {
        return;
    }
    var elapsedSeconds = Math.floor((performance.now() - roundStartTimestamp) / 1000);
    var index = Math.min(Math.max(elapsedSeconds, 0), clickRateBySecond.length - 1);
    clickRateBySecond[index] = (clickRateBySecond[index] || 0) + 1;
}

function recordMultiplier(multiplier) {
    if (!Number.isFinite(multiplier)) {
        return;
    }
    window.latestMultiplierSamples = window.latestMultiplierSamples || [];
    window.latestMultiplierSamples.push(Number(multiplier.toFixed(2)));
}

function buildEndGameStats() {
    var totalTime = roundDurationSeconds - Math.max(0, Math.ceil(roundRemainingMs / 1000));
    var rateValues = clickRateBySecond.filter(function (value) { return value > 0; });
    var maxRate = rateValues.length ? Math.max.apply(null, rateValues) : 0;
    var minRate = rateValues.length ? Math.min.apply(null, rateValues) : 0;
    var avgRate = rateValues.length ? (rateValues.reduce(function (sum, item) { return sum + item; }, 0) / rateValues.length) : 0;
    var multiplierValues = window.latestMultiplierSamples || [];
    var multiplierMax = multiplierValues.length ? Math.max.apply(null, multiplierValues) : 0;
    var multiplierMin = multiplierValues.length ? Math.min.apply(null, multiplierValues) : 0;
    var multiplierAvg = multiplierValues.length ? (multiplierValues.reduce(function (sum, item) { return sum + item; }, 0) / multiplierValues.length) : 0;

    return {
        totalScore: Number(score).toFixed(2),
        blackTilesClicked: blackTilesClicked,
        totalTime: totalTime,
        maxRate: maxRate.toFixed(2),
        minRate: minRate.toFixed(2),
        avgRate: avgRate.toFixed(2),
        maxMultiplier: multiplierMax.toFixed(2),
        minMultiplier: multiplierMin.toFixed(2),
        avgMultiplier: multiplierAvg.toFixed(2),
        chartSeries: clickRateBySecond
    };
}

function finishRound(win) {
    if (gameEnded) {
        return;
    }

    gameEnded = true;
    clearRoundIntervals();
    roundStarted = false;
    $('.restart').css('display', 'flex');

    var stats = buildEndGameStats();
    renderEndGameSummary(stats, win);
    renderChart(stats.chartSeries);
    saveHistory(stats, win);

    $('.endgame').css('display', 'flex');
    $('.' + (win ? 'winGame' : 'loseGame')).css('display', 'flex');
    $('.' + (win ? 'loseGame' : 'winGame')).hide();
    window.modalStatus = true;
}

function renderEndGameSummary(stats, win) {
    var html = [
        '<div class="stat-item"><strong>Score:</strong> ' + stats.totalScore + '</div>',
        '<div class="stat-item"><strong>Black tiles:</strong> ' + stats.blackTilesClicked + '</div>',
        '<div class="stat-item"><strong>Alive:</strong> ' + stats.totalTime + 's</div>',
        '<div class="stat-item"><strong>Max rate:</strong> ' + stats.maxRate + ' tiles/s</div>',
        '<div class="stat-item"><strong>Min rate:</strong> ' + stats.minRate + ' tiles/s</div>',
        '<div class="stat-item"><strong>Avg rate:</strong> ' + stats.avgRate + ' tiles/s</div>',
        '<div class="stat-item"><strong>Max mult:</strong> x' + stats.maxMultiplier + '</div>',
        '<div class="stat-item"><strong>Min mult:</strong> x' + stats.minMultiplier + '</div>',
        '<div class="stat-item"><strong>Avg mult:</strong> x' + stats.avgMultiplier + '</div>'
    ].join('');

    $('.endgame-stats').html(html);
}

function renderChart(series) {
    var canvasId = 'gameChart';
    var ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') {
        return;
    }

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: series.map(function (_, index) { return index + 1 + 's'; }),
            datasets: [{
                label: 'Tiles per second',
                data: series,
                borderColor: '#3d7af3',
                backgroundColor: 'rgba(61, 122, 243, 0.15)',
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(4, ...(series || [0]))
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function saveHistory(stats, win) {
    var currentEntries;
    try {
        currentEntries = JSON.parse(localStorage.getItem('dontTapWhiteTiles.history') || '[]');
    } catch (error) {
        currentEntries = [];
    }
    if (!Array.isArray(currentEntries)) {
        currentEntries = [];
    }
    var playNumber = currentEntries.length + 1;
    var currentScore = Number(stats.totalScore);
    var previousHiScore = Number(localStorage.getItem('dontTapWhiteTiles.hiScore') || 0);
    if (currentScore > previousHiScore) {
        localStorage.setItem('dontTapWhiteTiles.hiScore', String(currentScore));
    }
    var entry = {
        id: 'Player',
        date: new Date().toLocaleDateString('vi-VN'),
        totalScore: currentScore,
        blackTilesClicked: Number(stats.blackTilesClicked || 0),
        timeAlive: Number(stats.totalTime),
        maxRate: Number(stats.maxRate),
        minRate: Number(stats.minRate),
        avgRate: Number(stats.avgRate),
        maxMultiplier: Number(stats.maxMultiplier),
        minMultiplier: Number(stats.minMultiplier),
        avgMultiplier: Number(stats.avgMultiplier),
        rawDate: Date.now(),
        playNumber: playNumber,
        totalPlays: playNumber,
        win: !!win
    };
    currentEntries.push(entry);
    localStorage.setItem('dontTapWhiteTiles.history', JSON.stringify(currentEntries));
    if (typeof window.renderLeaderboard === 'function') {
        window.renderLeaderboard();
    }
}

function handleEndGame(win) {
    if ($('.endgame:visible').length) {
        $('.restart').css('display', 'flex');
        $('.endgame').hide();
        window.modalStatus = false;
        return false;
    }

    if (win) {
        finishRound(true);
    } else {
        finishRound(false);
    }
}

window.startGame = startGame;
window.gameOver = gameOver;
window.handleEndGame = handleEndGame;
window.updateGameSettings = function (settings) {
    roundDurationSeconds = Number(settings.roundDuration || roundDurationSeconds);
    gridSize = Number(settings.gridSize || gridSize);
    blackTileLimit = Number(settings.blackTileCount || blackTileLimit);
    totalRoundSeconds = roundDurationSeconds;
    clickRateBySecond = new Array(totalRoundSeconds).fill(0);
    if (!gameEnded) {
        startGame();
    }
};