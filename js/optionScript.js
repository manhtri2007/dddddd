var key1 = 'z';
var key2 = 'x';
var openMenu = 'o';
var escapeKey = 'Escape';
var submitKey = 'Enter';
var keyBindingArray = [key1, key2, openMenu];

$(document).ready(function () {
    if (!localStorage.getItem('keyBindings')) {
        localStorage.setItem('keyBindings', JSON.stringify(keyBindingArray));
    }

    var data = JSON.parse(localStorage.getItem('keyBindings') || '[]');
    key1 = data[0] || key1;
    key2 = data[1] || key2;
    openMenu = data[2] || openMenu;
    keyBindingArray = [key1, key2, openMenu];
    updateKeys();

    $(document).keyup(function (event) {
        if (event.key === openMenu) {
            event.preventDefault();
            if ($('.optionButton').attr('onclick').split("'")[1] === 'open') {
                options('open');
            } else {
                options('close');
            }
        }
    });

    bindSettingsControls();
    initializeSettingsUi();
});

function updateKeys() {
    var data = JSON.parse(localStorage.getItem('keyBindings') || '[]');
    $('.keyBindingSub kbd').each(function (index, element) {
        $(element).text(data[index] || keyBindingArray[index]);
    });
}

function initializeSettingsUi() {
    var settings = JSON.parse(localStorage.getItem('dontTapWhiteTiles.settings') || '{}');
    var duration = Number(settings.roundDuration || 30);
    var gridSizeValue = Number(settings.gridSize || 4);
    var blackTileCount = Number(settings.blackTileCount || 2);

    $('#round-duration-input').val(duration);
    $('#black-tile-count-input').val(blackTileCount);
    $('.grid-size-btn').removeClass('active');
    $('.grid-size-btn[data-size="' + gridSizeValue + '"]').addClass('active');
}

function bindSettingsControls() {
    $('#settings-save-button').on('click', function () {
        var settings = {
            roundDuration: clampNumber(parseInt($('#round-duration-input').val(), 10) || 30, 10, 180),
            gridSize: clampNumber(parseInt($('.grid-size-btn.active').attr('data-size'), 10) || 4, 4, 8),
            blackTileCount: clampNumber(parseInt($('#black-tile-count-input').val(), 10) || 2, 1, 12)
        };

        localStorage.setItem('dontTapWhiteTiles.settings', JSON.stringify(settings));
        if (typeof window.updateGameSettings === 'function') {
            window.updateGameSettings(settings);
        }
        closeMenu();
    });

    $('.grid-size-btn').on('click', function () {
        $('.grid-size-btn').removeClass('active');
        $(this).addClass('active');
    });
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function options(option) {
    if (option === 'open') {
        $('.optionButton').addClass('menuOpenAnimation');
        $('.optionButton').attr('onclick', "options('close')");
        $('.menuLables').addClass('menuOpen');
    } else {
        $('.optionButton').removeClass('menuOpenAnimation');
        $('.optionButton').attr('onclick', "options('open')");
        $('.menuLables').removeClass('menuOpen');
    }
}

function openSubmenu(id) {
    $('.optionsBg').css('display', 'flex');
    $('.settingsSub, .keyBindingSub, .creditsSub').hide();

    switch (id) {
        case 'settings':
            $('.settingsSub').show();
            break;
        case 'keyBindings':
            $('.keyBindingSub').show();
            break;
        case 'reportBug':
            if (confirm('Report a bug?')) {
                window.open('mailto:parme.dev@gmail.com?subject=Report Bug');
            }
            break;
        case 'credits':
            $('.creditsSub').show();
            break;
        default:
            break;
    }
}

function closeMenu() {
    $('.optionsBg').hide();
    $('.settingsSub, .keyBindingSub, .creditsSub').hide();
}

function changeKey(elem) {
    var newKey = window.prompt('Change key', elem.text());
    if (newKey === null || newKey === '' || newKey.length > 1 || keyBindingArray.includes(newKey)) {
        alert('Invalid key');
        return;
    }

    switch (elem.attr('class')) {
        case 'key1':
            keyBindingArray[0] = newKey;
            key1 = newKey;
            break;
        case 'key2':
            keyBindingArray[1] = newKey;
            key2 = newKey;
            break;
        case 'openMenu':
            keyBindingArray[2] = newKey;
            openMenu = newKey;
            break;
    }

    localStorage.setItem('keyBindings', JSON.stringify(keyBindingArray));
    updateKeys();
}

window.options = options;
window.openSubmenu = openSubmenu;
window.closeMenu = closeMenu;
window.changeKey = changeKey;
window.key1 = key1;
window.key2 = key2;
window.openMenu = openMenu;
window.escapeKey = escapeKey;
window.submitKey = submitKey;