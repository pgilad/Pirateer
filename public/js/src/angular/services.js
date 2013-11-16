/*!
 * services.js */

angular.module('app').service('searchService', [
        '$http', '$q', 'ptStorageService', 'ptSearchHelpers', function ($http, $q, ptStorageService, ptSearchHelpers) {

            var helpers = ptSearchHelpers;

            var searchIMDB = function (movieObj) {
                var deferred = $q.defer();
                var textToSearch = movieObj.title;
                var yearToSearch = parseInt(movieObj.year) || null;
                var cacheOptions = ptStorageService.options.cacheOptions;

                //run the actual request to get movie name from string
                var runRequest = function () {
                    helpers.getMovieNameRequest(textToSearch, yearToSearch, function (err, movieFromImdb) {
                        if (err) return deferred.reject(err);

                        var selectedMovie = {};
                        selectedMovie[textToSearch] = movieFromImdb;
                        selectedMovie[textToSearch].textToSearch = textToSearch;

                        return helpers.getRatingOfMovie({
                            selectedMovie       : selectedMovie,
                            indexArr            : movieObj.indexArr,
                            deferred            : deferred,
                            originalSearchString: textToSearch,
                            cacheOptions        : cacheOptions
                        });
                    });
                };

                //use cached movie names
                if (cacheOptions.cacheNames) {

                    //try to find cached movie name
                    ptStorageService.get(textToSearch, 'local', function (item) {

                        //movie exists with at least an ID
                        if (item && item[textToSearch] && item[textToSearch].id) {
                            item[textToSearch].origin = 'storage';
                            item[textToSearch].textToSearch = textToSearch;

                            return helpers.getRatingOfMovie({
                                selectedMovie       : item,
                                indexArr            : movieObj.indexArr,
                                deferred            : deferred,
                                originalSearchString: textToSearch,
                                cacheOptions        : cacheOptions
                            });
                        }
                        else {
                            DEBUG && console.debug('Looking up name of movie in IMDB:', textToSearch);
                            return runRequest();
                        }
                    });
                }
                else runRequest();

                return deferred.promise;
            };

            return {
                searchIMDB: searchIMDB
            }
        }
    ]).service('ptSearchHelpers', [
        '$http', 'ptStorageService', '$rootScope', function ($http, ptStorageService, $rootScope) {

            return {
                baseQueries: {
                    getTitleURI : 'http://www.imdb.com/xml/find?json=1&nr=1&tt=on&mx=1&q=',
                    getRatingURI: 'http://p.media-imdb.com/static-content/documents/v1/title/AAA/ratings%3Fjsonp=imdb.rating.run:imdb.api.title.ratings/data.json'
                },

                fillDbWithData: function (db, data, yearToSearch) {

                    var imdbDataOptions = ['title_popular', 'title_substring', 'title_exact', 'title_approx'];

                    angular.forEach(imdbDataOptions, function (opt) {
                        db[opt] = [];
                    });

                    _.each(imdbDataOptions, function (curDataOption) {
                        if (!data[curDataOption] || !data[curDataOption].length) {
                            return;
                        }

                        _.each(data[curDataOption], function (item) {
                            var yearFromImdb = parseInt(item.description.substring(0, 4));
                            //check for year dif
                            if (angular.isNumber(yearToSearch) && angular.isNumber(yearFromImdb) && Math.abs(yearToSearch - yearFromImdb) > 1) {
                                return;
                            }

                            db[curDataOption].push({
                                id   : item.id,
                                title: item.title
                            });
                        });
                    })
                },

                getMovieFromDbLogic: function (db) {
                    var approxMovie = db['title_popular'] && db['title_popular'][0];
                    if (!approxMovie) approxMovie = db['title_exact'] && db['title_exact'][0];
                    if (!approxMovie) approxMovie = db['title_substring'] && db['title_substring'][0];
                    return approxMovie;
                },

                getRatingOfMovie: function (params) {

                    var selectedMovie = params.selectedMovie,
                        originalSearchString = params.originalSearchString,
                        indexArr = params.indexArr;

                    angular.extend(selectedMovie[originalSearchString], {indexArr: indexArr});
                    this.getRating(params);
                },

                getRating: function (params) {

                    //the original search string (used as key to store)
                    var originalSearchString = params.originalSearchString,
                    //deferred obj
                        deferred = params.deferred,

                    //item we use
                        workingItem = params.selectedMovie[originalSearchString],

                    //the rating URI
                        ratingURI = this.baseQueries.getRatingURI.replace('AAA', workingItem.id);

                    var isCacheSaveRequired = (workingItem.origin === 'fresh');

                    _.defer(function () {
                        $rootScope.$apply()
                    });

                    //check if options allow us to use ratings cache and we have it as well
                    if (params.cacheOptions.cacheRatings && workingItem.ratingData && workingItem.ratingData.rating && parseFloat(workingItem.ratingData.rating) > 0) {
                        return deferred.resolve(workingItem);
                    }

                    var cacheMovieObject = function (isCacheSaveRequired) {
                        if (isCacheSaveRequired) {
                            var _toSave = angular.copy(params.selectedMovie);
                            _toSave[originalSearchString].origin = 'storage';
                            _toSave[originalSearchString].indexArr = undefined;
                            ptStorageService.set(_toSave, 'local');
                        }
                    };

                    return $http.get(ratingURI)
                        .success(function (data) {
                            //comes in a format of "imdb.rating.run(JSON)"
                            var _ratingData = JSON.parse(data.substring('imdb.rating.run('.length, data.length - 1));

                            if (_ratingData['resource']) {
                                workingItem.ratingData = {
                                    rating     : _ratingData['resource'].rating || 'No Rating',
                                    year       : _ratingData['resource'].year,
                                    titleType  : _ratingData['resource'].titleType,
                                    ratingCount: _ratingData['resource'].ratingCount,
                                    topRank    : _ratingData['resource'].topRank,
                                    updatedAt  : Date.now()
                                };

                                cacheMovieObject(true);
                                deferred.resolve(workingItem);
                            }
                            else {
                                DEBUG && console.warn('IMDB rating response did not have "resource"', workingItem);
                                cacheMovieObject(isCacheSaveRequired);
                                deferred.reject();
                            }
                        })
                        .error(function (err) {
                            DEBUG && console.error('Failed to get IMDB rating from $http request', workingItem);
                            cacheMovieObject(isCacheSaveRequired);
                            deferred.reject(err);
                        })
                },

                getMovieNameRequest: function (textToSearch, yearToSearch, callback) {
                    var self = this;

                    _.defer(function () {
                        $rootScope.$apply()
                    });

                    $http.get(self.baseQueries.getTitleURI + encodeURI(textToSearch)).success(function (data) {
                            var db = {};

                            self.fillDbWithData(db, data, yearToSearch);
                            var movieFromImdb = self.getMovieFromDbLogic(db);

                            if (movieFromImdb) {
                                DEBUG && console.log('Found the movie in IMDB:', movieFromImdb.title);
                                //should store names
                                movieFromImdb.origin = 'fresh';
                                movieFromImdb.updatedAt = Date.now();
                                return callback(null, movieFromImdb);
                            }
                            else {
                                DEBUG && console.warn('Failed to find a relevant movie name from response', textToSearch, yearToSearch, data);
                                return callback('Failed to find a relevant movie name from response');
                            }
                        }
                    ).error(function (err) {
                            DEBUG && console.error('Failed to get movie name on $http request:', err);
                            callback(err);
                        });
                }
            }
        }
    ])
    .service('ptStorageService', function () {

        //default option values
        var options = {
            cacheOptions    : {
                cacheNames  : true,
                cacheRatings: false
            },
            supportLinkClick: false
        };

        var setCacheOptionsVar = function (value) {
            _gaq.push(['_setCustomVar', 5, 'cacheOptions', value.toString(), 1],
                ['_trackEvent', 'settings', 'cacheOptions', value.toString()]
            );
        };

        var setCacheOptionsByValue = function (value) {

            var cacheOptions;
            value = parseInt(value);

            cacheOptions = options.cacheOptions;

            //cacheOptions hasn't changed
            if (value === getCacheOptionsAsValue()) return;

            if (value === 2) {
                cacheOptions.cacheNames = cacheOptions.cacheRatings = true;
            }
            else if (value === 1) {
                cacheOptions.cacheNames = true;
                cacheOptions.cacheRatings = false;
            }
            else {
                cacheOptions.cacheNames = cacheOptions.cacheRatings = false;
            }

            DEBUG && console.log('sending GA event for settings');
            setCacheOptionsVar(value);

            set(options, 'sync');
        };

        var getCacheOptionsAsValue = function () {
            var cacheOptions = options.cacheOptions;
            if (cacheOptions.cacheNames && cacheOptions.cacheRatings) return 2;
            if (cacheOptions.cacheNames) return 1;
            else return 0;
        };

        /**
         * @param {String} storageType - use sync or local
         * @returns {chrome.storage.sync|chrome.storage.local} StorageType
         */
        var getStorageSystem = function (storageType) {
            /** @namespace chrome.storage */
            /** @namespace chrome.storage.sync */
            /** @namespace chrome.storage.local */
            return (storageType === 'sync') ? chrome.storage.sync : chrome.storage.local;
        };

        var getIfUserClickedSupport = function (callback) {
            get('supportLinkClick', 'sync', function (item) {
                options.supportLinkClick = item.supportLinkClick;
                callback(item);
            })
        };

        var getCacheOptionsFromStorage = function (callback) {
            get('cacheOptions', 'sync', function (item) {
                var cacheOptions = options.cacheOptions;

                //set with default values
                if (!item || !item.cacheOptions) {
                    set(options, 'sync');

                }
                else {
                    cacheOptions.cacheNames = item.cacheOptions.cacheNames || false;
                    cacheOptions.cacheRatings = item.cacheOptions.cacheRatings || false;
                }

                //if visitor level cacheOptions not set, set it (legacy mainly)
                _gaq.push(function () {
                    var pageTracker = _gat._getTrackerByName(); // Gets the default tracker.
                    var cacheTrack = pageTracker._getVisitorCustomVar(5);
                    if (typeof cacheTrack === 'undefined') {
                        setCacheOptionsVar(getCacheOptionsAsValue());
                    }
                });

                callback(cacheOptions);
            });
        };

        var get = function (keys, storageType, callback) {
            if (!angular.isFunction(callback)) callback = angular.noop();
            if (!keys || !keys.length) return callback();
            storageType = storageType || 'local';
            return getStorageSystem(storageType).get(keys, callback);
        };

        /**
         * Sets an item in chrome.storage
         * @param {Object} saveObj - object to save
         * @param {String} [storageType='local'] should set to chrome.storage.sync (false will mean chrome.storage.local)
         * @param {Function} [callback=] callback function
         * @returns {*}
         */
        var set = function (saveObj, storageType, callback) {
            if (!angular.isFunction(callback)) callback = angular.noop();
            if (!saveObj) return callback();

            storageType = storageType || 'local';
            return getStorageSystem(storageType).set(saveObj, callback);
        };

        return {
            get                       : get,
            set                       : set,
            getCacheOptionsFromStorage: getCacheOptionsFromStorage,
            getCacheOptionsAsValue    : getCacheOptionsAsValue,
            setCacheOptionsByValue    : setCacheOptionsByValue,
            getIfUserClickedSupport   : getIfUserClickedSupport,
            options                   : options
        }
    });