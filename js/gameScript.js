var score = 0;
var hiScore = Number(localStorage.getItem('dontTapWhiteTiles.hiScore') || 0);
var gameEnded = false;
var timeLeft = 30;
var roundDuration = 30;
var gridSize = 4;
var blackLimit = 2;
var roundTimer = null;
var lastRemovedIndex = null;
var roundStarted = false;
var historyEntries = [];

$(document).ready(function () {
    loadSettings();
    bindGameEvents();
    renderHiScore();
    startGame();
});

function loadSettings() {
    try {
        var saved = JSON.parse(localStorage.getItem('dontTapWhiteTiles.settings') || '{}');
        roundDuration = Number(saved.roundDuration || 30);
        gridSize = Number(saved.gridSize || 4);
        blackLimit = Number(saved.blackTileCount || 2);
        timeLeft = roundDuration;
    } catch (error) {
        roundDuration = 30;
        gridSize = 4;
        blackLimit = 2;
        timeLeft = 30;
    }
}

function bindGameEvents() {
    $('#gameContainer').on('click', '.square', function (event) {
        if (gameEnded) {
            return;
        }
        event.preventDefault();
        var tile = event.currentTarget;
        if (tile.classList.contains('black')) {
            handleBlackTileClick(tile);
        } else {
            handleWrongTap(tile, event.clientX, event.clientY);
        }
    });

    $('.nav-btn.is-history').on('click', function () {
        switchTo('leaderboard');
    });

    $('.nav-btn.is-settings').on('click', function () {
        options('open');
    });

    $('.nav-btn.is-home').on('click', function () {
        switchTo('game');
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            startGame();
        }
    });
}

function renderHiScore() {
    hiScore = Number(localStorage.getItem('dontTapWhiteTiles.hiScore') || 0);
    $('#hi-score').text(hiScore);
    $('#current-score').text(score);
    $('#time-left').text(timeLeft);
}

function startGame() {
    clearInterval(roundTimer);
    gameEnded = false;
    roundStarted = false;
    score = 0;
    timeLeft = roundDuration;
    lastRemovedIndex = null;
    $('#gameStatus').text('');
    buildBoard();
    spawnBlackTiles();
    renderHud();
}

function buildBoard() {
    $('#gameContainer').removeClass();
    $('#gameContainer').addClass('size-' + gridSize);
    $('#gameContainer').empty();

    var total = gridSize * gridSize;
    for (var i = 0; i < total; i++) {
        var tile = $('<div class="square" data-index="' + i + '"></div>');
        tile.append('<div class="tile-progress"></div>');
        $('#gameContainer').append(tile);
    }
}

function spawnBlackTiles() {
    var tiles = $('.square').not('.black');
    var options = [];
    tiles.each(function () {
        var index = Number($(this).data('index'));
        if (lastRemovedIndex === null || index !== lastRemovedIndex) {
            options.push(this);
        }
    });

    var maxSpawn = Math.min(blackLimit, options.length);
    var chosen = [];
    while (chosen.length < maxSpawn && options.length > 0) {
        var pick = Math.floor(Math.random() * options.length);
        chosen.push(options.splice(pick, 1)[0]);
    }

    chosen.forEach(function (cell) {
        activateBlackTile(cell);
    });
}

function activateBlackTile(cell) {
    if (!cell || cell.classList.contains('black')) {
        return;
    }

    cell.classList.add('black');
    var progress = cell.querySelector('.tile-progress');
    if (progress) {
        progress.style.transform = 'scaleY(1)';
    }

    var spawnTime = performance.now();
    cell.dataset.spawnTime = spawnTime;
    requestAnimationFrame(function tick() {
        if (gameEnded || !cell.classList.contains('black')) {
            return;
        }

        var elapsed = performance.now() - Number(cell.dataset.spawnTime || 0);
        var ratio = Math.max(0, 1 - (elapsed / 1500));
        if (progress) {
            progress.style.transform = 'scaleY(' + ratio + ')';
        }

        if (elapsed >= 1500) {
            removeBlackTile(cell, 'timeout');
            return;
        }

        requestAnimationFrame(tick);
    });
}

function removeBlackTile(cell, reason) {
    if (!cell || !cell.classList.contains('black')) {
        return;
    }
    cell.classList.remove('black');
    var progress = cell.querySelector('.tile-progress');
    if (progress) {
        progress.style.transform = 'scaleY(0)';
    }
    lastRemovedIndex = Number(cell.dataset.index);
    if (reason !== 'hit') {
        spawnBlackTiles();
    }
}

function handleBlackTileClick(tile) {
    if (gameEnded || tile.dataset.locked === 'true') {
        return;
    }

    tile.dataset.locked = 'true';
    if (!roundStarted) {
        roundStarted = true;
        startRoundTimer();
    }

    var spawn = Number(tile.dataset.spawnTime || performance.now());
    var elapsed = performance.now() - spawn;
    var multiplier = Math.max(0, 1.5 - (elapsed / 1500));
    var points = Number((1 * multiplier).toFixed(2));

    score += points;
    if (score > hiScore) {
        hiScore = score;
        localStorage.setItem('dontTapWhiteTiles.hiScore', String(hiScore));
    }

    tile.classList.add('black-hit');
    tile.classList.remove('black');
    var progress = tile.querySelector('.tile-progress');
    if (progress) {
        progress.style.transform = 'scaleY(0)';
    }

    lastRemovedIndex = Number(tile.dataset.index);
    renderHud();
    showFloatingText('x' + Number(multiplier).toFixed(2));

    setTimeout(function () {
        tile.classList.remove('black-hit');
        tile.dataset.locked = 'false';
        if (!gameEnded) {
            spawnBlackTiles();
        }
    }, 100);
}

function handleWrongTap(tile, x, y) {
    if (gameEnded || (tile && tile.dataset.locked === 'true')) {
        return;
    }
    if (tile) {
        tile.dataset.locked = 'true';
        tile.classList.add('white-hit');
        setTimeout(function () {
            tile.classList.remove('white-hit');
            tile.dataset.locked = 'false';
        }, 100);
    }

    showMissPulse(x, y);
    gameOver();
}

function showMissPulse(x, y) {
    var pulse = document.createElement('div');
    pulse.className = 'miss-hit';
    if (x && y) {
        pulse.style.left = x + 'px';
        pulse.style.top = y + 'px';
    } else {
        pulse.style.left = '50%';
        pulse.style.top = '50%';
    }
    document.body.appendChild(pulse);
    setTimeout(function () { pulse.remove(); }, 100);
}

function showFloatingText(text) {
    var area = document.getElementById('combo-area');
    if (!area) {
        return;
    }

    var node = document.createElement('div');
    node.className = 'combo-text';
    node.textContent = text;
    node.style.left = (20 + Math.random() * 120) + 'px';
    node.style.top = (20 + Math.random() * 60) + 'px';
    area.appendChild(node);
    setTimeout(function () { node.remove(); }, 500);
}

function startRoundTimer() {
    clearInterval(roundTimer);
    roundTimer = setInterval(function () {
        if (gameEnded) {
            clearInterval(roundTimer);
            return;
        }

        timeLeft -= 1;
        if (timeLeft <= 0) {
            timeLeft = 0;
            renderHud();
            gameOver();
            return;
        }

        renderHud();
    }, 1000);
}

function renderHud() {
    $('#current-score').text(Number(score).toFixed(0));
    $('#hi-score').text(Number(hiScore).toFixed(0));
    $('#time-left').text(timeLeft);
}

function gameOver() {
    if (gameEnded) {
        return;
    }

    gameEnded = true;
    clearInterval(roundTimer);
    $('#gameStatus').text('Game Over');
    saveHistory();
    renderHiScore();
    setTimeout(function () {
        startGame();
    }, 800);
}

function saveHistory() {
    var list = JSON.parse(localStorage.getItem('dontTapWhiteTiles.history') || '[]');
    var entry = {
        score: Number(score).toFixed(0),
        date: new Date().toLocaleDateString('vi-VN'),
        time: timeLeft,
        createdAt: Date.now()
    };
    list.push(entry);
    localStorage.setItem('dontTapWhiteTiles.history', JSON.stringify(list));
    if (typeof window.renderLeaderboard === 'function') {
        window.renderLeaderboard();
    }
}

window.startGame = startGame;
window.gameOver = gameOver;
window.updateGameSettings = function (settings) {
    roundDuration = Number(settings.roundDuration || roundDuration);
    gridSize = Number(settings.gridSize || gridSize);
    blackLimit = Number(settings.blackTileCount || blackLimit);
    timeLeft = roundDuration;
    if (!gameEnded) {
        startGame();
    }
};