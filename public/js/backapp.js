//TODO series ratings
//TODO amazon affiliates
//TODO IMDB cross site search to pirate bay

/*!
 * backapp.js */
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

                var possibleYear = /\d{4}(?!p)/g.exec(_movieString);

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
                searchService.searchIMDB(movie).then(function (item) {
                    if (!shouldQuery) {
                        onRequestHandler(movieList, port);
                        return;
                    }

                    _.each(item.indexArr, function (sendItem) {
                        try {
                            port.postMessage({
                                type        : 'ratingResponse',
                                title       : item.title,
                                index       : sendItem,
                                rating      : item.ratingData.rating,
                                ratingCount : item.ratingData.ratingCount,
                                topRank     : item.ratingData.topRank,
                                year        : item.ratingData.year,
                                id          : item.id,
                                textToSearch: item.textToSearch
                            });
                        }
                        catch (e) {
                            DEBUG && console.log('error posting response back:', e);
                        }
                    });

                    //goto next movie item
                    onRequestHandler(movieList, port);

                }, function noMovieFound(err) {
                    onRequestHandler(movieList, port);
                });
            }
            else {
                try {
                    port.postMessage({type: 'endResponse'});
                }
                catch (e) {
                    DEBUG && console.log('error posting response back:', e);
                }
            }
        }

        chrome.runtime.onConnect.addListener(function (port) {

                port.onDisconnect.addListener(function () {
                    DEBUG && console.log('Disconnected!');
                    shouldQuery = false;
                    port.onMessage.removeListener();
                });

                if (port.name === 'getRating') {

                    port.onMessage.addListener(function (msg) {
                            if (msg.type === 'list') {

                                _gaq.push(['_trackPageview', decodeURI(port.sender.url)]);
                                _gaq.push(['_trackEvent', 'Search', 'fromPirateBay', decodeURI(port.sender.url)]);

                                ptStorageService.getIfUserClickedSupport(function (response) {
                                    DEBUG && console.debug('Checked if user has clicked support and got', response.supportLinkClick);
                                    var showSupportLink = response.supportLinkClick ? false : true;
                                    port.postMessage({type: 'showSupportLink', shouldShow: showSupportLink});
                                });

                                shouldQuery = true;
                                movieArray = [];
                                prepareList(msg.list);

                                DEBUG && console.log('Got list from content script, getting cache options');
                                ptStorageService.getCacheOptionsFromStorage(function () {
                                    DEBUG && console.log('Got cache options, starting request sequence');
                                    onRequestHandler(angular.copy(movieArray, []), port);
                                });
                            }
                            else if (msg.type === 'noVideo') {
                                _gaq.push(['_trackPageview', decodeURI(port.sender.url)]);
                                _gaq.push([
                                    '_trackEvent', 'Search', 'fromPirateBay-noVideo', decodeURI(port.sender.url)
                                ]);
                            }
                            else if (msg.type === 'imdbLinkClick') {
                                DEBUG && console.log('Got follow up links from Piratebay:', msg.item);
                                _gaq.push(['_trackEvent', 'LinkClick', 'fromPirateBay', msg.item.href]);
                            }
                            else if (msg.type === 'imdbSupportClick') {
                                DEBUG && console.log('Got support link click:', msg.item);
                                _gaq.push(['_trackEvent', 'reviewLinkClick', 'fromPirateBay', msg.item.url]);
                                ptStorageService.options.supportLinkClick = true;
                                ptStorageService.set(ptStorageService.options, 'sync');
                            }
                        }
                    );
                }
                else if (port.name === 'imdbReport') {
                    port.onMessage.addListener(function (msg) {
                        if (msg.type === 'track') {
                            DEBUG && console.log('Got IMDB site track');
                            _gaq.push(['_trackPageview', msg.href]);
                        }
                        else if (msg.type === 'imdbSearchPirateBay') {
                            DEBUG && console.log('User clicked on Search Pirate Bay from IMDB link', msg.item.url);
                            _gaq.push(['_trackEvent', 'Search', 'fromIMDB', msg.item.url || msg.item.title]);
                        }
                    });
                }
            }
        );

        chrome.runtime.onInstalled.addListener(function (details) {
            var currentVersion = chrome.runtime.getManifest().version || 'Unknown';
            _gaq.push(['_trackEvent', 'App_Load', details.reason, currentVersion]);
        });
    }
]);