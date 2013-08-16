var app = angular.module('app', []);

app.run(['searchService', '$q', function (searchService, $q) {

    var shouldQuery = false;

    // The onClicked callback function.
    var shiftAndNext = function (list, port) {
        list.shift();
        onRequestHandler(list, port, false);
    };

    function onRequestHandler(list, port, firstRun) {

        if (shouldQuery && list && list.length > 0) {

            var _str = list[0].name;
            var title, year;

            //lose all dots
            _str = _str.replace(/\./g, ' ');
            //convert parenthesis to spaces
            _str = _str.replace(/\(/g, ' ');
            _str = _str.replace(/\)/g, ' ');
            //convert double spaces to 1 space
            _str = _str.replace(/  /g, ' ');

            var m = /\d{4}/g.exec(_str);

            if (m) {
                title = _str.substring(0, m.index - 1);
                year = parseInt(m[0]);
            }
            else {
                title = _str;
            }

            searchService.searchIMDB(firstRun, title, year)
                .then(function (item) {
                    if (shouldQuery) {
                        port.postMessage({type: 'ratingResponse', index: list[0].index, rating: item.rating});
                        shiftAndNext(list, port);
                    }

                }, function (err) {
                    if (shouldQuery) {
//                        console.log('error with this', list[0]);
                        shiftAndNext(list, port);
                    }
                });
        }
    }

    chrome.runtime.onConnect.addListener(function (port) {
        port.onDisconnect.addListener(function () {
            shouldQuery = false;
            port.onMessage.removeListener();
        });
        if (port.name === 'getRating') {
            port.onMessage.addListener(function (msg) {
                if (msg.type === 'list') {
                    shouldQuery = true;
                    onRequestHandler(msg.list, port, true);
                }
            });
        }
    });
}]);