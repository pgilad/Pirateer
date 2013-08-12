var app = angular.module('app', []);

app.run(['searchService', '$rootScope', function (searchService, $rootScope) {

    // The onClicked callback function.
    function onRequestHandler(list, port) {
        if (list && list.length > 0) {
            var _str = list[0].name;
            //lose all dots
            _str = _str.replace(/\./g, ' ');
            //convert parenthesis to spaces
            _str = _str.replace(/\(/g, ' ');
            _str = _str.replace(/\)/g, ' ');
            //convert double spaces to 1 space
            _str = _str.replace(/  /g, ' ');

            var m = /\d{4}/g.exec(_str);

            if (m) {
                var _title = searchService.searchString.title = _str.substring(0, m.index - 1);
                var _year = parseInt(m[0]);
            }
            else {
                var _title = _str;
            }

            $rootScope.$broadcast('Search_Found');
            port.postMessage({type: 'ratingResponse', index: list[0].index, rating: 7.6});
        }
    }

    chrome.runtime.onConnect.addListener(function (port) {
        if (port.name === 'getRating') {
            port.onMessage.addListener(function (msg) {
                console.log('received list:', msg);
                if (msg.type === 'list') onRequestHandler(msg.list, port);
            });
        }
    });
}]);