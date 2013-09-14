var app = angular.module('app', []);

var _gaq = _gaq || [];
(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
    _gaq.push(['_setAccount', 'UA-43678943-3']);
})();

app.run(['searchService', '$rootScope', function (searchService, $rootScope) {
    var shouldQuery = false;
    var movieArray = [];

    var prepareList = function (list) {
        var title, year;
        for (var i = 0; i < list.length; ++i) {
            var _movieString = list[i].name;

            //lose all dots
            _movieString = _movieString
                .replace(/\./g, ' ')
                //lose all dashes
                .replace(/\-/g, ' ')
                .replace(/_/g, ' ')
                //convert parenthesis to spaces
                .replace(/\(/g, ' ')
                .replace(/\)/g, ' ')
                .replace(/\[/g, ' ')
                .replace(/\]/g, ' ')
                //convert double spaces to 1 space
                .replace(/\s\s+/g, ' ')
                //trim ending spaces
                .replace(/\s$/, '');

            var possibleYear = /\d{4}/g.exec(_movieString);

            if (possibleYear) {
                title = _movieString.substring(0, possibleYear.index - 1);
                year = parseInt(possibleYear[0]);
            }
            else {
                title = _movieString;
                year = null;
            }

            //if movie not found
            var _movie = _.find(movieArray, {title: title, year: year});
            if (!_movie) movieArray.push({title: title, year: year, indexArr: [list[i].index]});
            else _movie.indexArr.push(list[i].index);
        }
    };

    function onRequestHandler(movieList, port) {
        var movie;
        if (movieList.length && shouldQuery) {
            movie = movieList.shift();
            searchService.searchIMDB(movie)
                .then(function (item) {
                    if (shouldQuery) {
                        for (var j = 0; j < item.indexArr.length; ++j) {
                            try {
                                port.postMessage({type: 'ratingResponse', title: item.title, index: item.indexArr[j], rating: item.rating, id: item.id});
                            }
                            catch (e) {
                            }
                        }
                        onRequestHandler(movieList, port);
                    }

                }, function (err) {
                    onRequestHandler(movieList, port);
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

                    _gaq.push(['_trackPageview']);
                    _gaq.push(['_trackEvent', 'Search', 'fromIMDB', decodeURI(port.sender.url)]);

                    shouldQuery = true;
                    movieArray = [];
                    prepareList(msg.list);
                    $rootScope.$apply(function () {
                        onRequestHandler(angular.copy(movieArray, []), port);
                    });
                }
            });
        }
    });

    chrome.runtime.onInstalled.addListener(function (details) {
        var currentVersion = chrome.runtime.getManifest().version || 'Unknown';
        _gaq.push(['_trackEvent', 'App_Load', details.reason, currentVersion]);
    });
}]);