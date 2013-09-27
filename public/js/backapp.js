app.run([
    'searchService', '$rootScope', 'ptStorageService', function (searchService, $rootScope, ptStorageService) {

        var shouldQuery = false;
        var movieArray = [];

        var prepareList = function (list) {
            var title, year;
            for (var i = 0; i < list.length; ++i) {
                var _movieString = list[i].name;

                _movieString = _movieString
                    //lose all dots
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

                                DEBUG && console.log('Got list from content script, starting lookup');
                                $rootScope.$apply(function () {
                                    ptStorageService.getCacheOptionsFromStorage(function () {
                                        $rootScope.$apply(function () {
                                            onRequestHandler(angular.copy(movieArray, []), port);
                                        });
                                    });
                                });
                            }
                            else if (msg.type === 'noVideo') {
                                _gaq.push(['_trackPageview']);
                                _gaq.push(['_trackEvent', 'Search', 'fromIMDB-noVideo', decodeURI(port.sender.url)]);
                            }
                        }
                    );
                }
            }
        );

        chrome.runtime.onInstalled.addListener(function (details) {
            var currentVersion = chrome.runtime.getManifest().version || 'Unknown';
            _gaq.push(['_trackEvent', 'App_Load', details.reason, currentVersion]);
        });
    }
]);