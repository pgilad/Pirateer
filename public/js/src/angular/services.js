app.service('searchService', [
        '$http', '$q', 'ptStorageService', 'ptSearchHelpers', function ($http, $q, ptStorageService, ptSearchHelpers) {

            var helpers = ptSearchHelpers;

            var searchIMDB = function (movieObj) {
                var deferred = $q.defer();
                var textToSearch = movieObj.title;
                var yearToSearch = parseInt(movieObj.year) || null;
                var cacheOptions = ptStorageService.options.cacheOptions;

                //run the actual request to get movie name from string
                var runRequest = function () {
                    helpers.getMovieNameRequest(textToSearch, yearToSearch, cacheOptions, movieObj, deferred);
                };

                //use cached movie names
                if (cacheOptions.cacheNames) {

                    //try to find cached movie name
                    ptStorageService.get(textToSearch, false, function (item) {

                        //movie exists with at least an ID
                        if (item && item[textToSearch] && item[textToSearch].id) {
                            var _item = item[textToSearch];
                            helpers.getRatingOfMovie(_item, movieObj, deferred);
                        }
                        else runRequest();
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

                    var imdbDataOptions = ['title_popular', 'title_substring', 'title_exact'];
                    angular.forEach(imdbDataOptions, function (opt) {
                        db[opt] = [];
                    });

                    for (var j = 0; j < imdbDataOptions.length; ++j) {
                        var curDataOption = imdbDataOptions[j];

                        if (!data[curDataOption] || !data[curDataOption].length) continue;

                        for (var i = 0; i < data[curDataOption].length && i < 3; ++i) {
                            var _year = parseInt(data[curDataOption][i].description.substring(0, 4));
                            //check for year dif
                            if (angular.isNumber(yearToSearch) && angular.isNumber(_year) && Math.abs(yearToSearch - _year) > 1) continue;

                            db[curDataOption].push({
                                id   : data[curDataOption][i].id,
                                title: data[curDataOption][i].title
                            });
                        }
                    }
                },

                getMovieFromDbLogic: function (db) {
                    var approxMovie = db['title_popular'] && db['title_popular'][0];
                    if (!approxMovie) approxMovie = db['title_substring'] && db['title_substring'][0];
                    if (!approxMovie) approxMovie = db['title_exact'] && db['title_exact'][0];
                    return approxMovie;
                },

                cacheMovieName: function (textToSearch, yearToSearch, approxMovie) {
                    var objToStore = {};
                    objToStore[textToSearch] = angular.copy(approxMovie);
                    objToStore[textToSearch].year = yearToSearch || null;
                    ptStorageService.set(objToStore, false);
                },

                getRatingOfMovie: function (selectedMovie, movieObj, deferred) {
                    angular.extend(selectedMovie, {indexArr: movieObj.indexArr});
                    this.getRating(selectedMovie, deferred);
                },

                getRating: function (item, deferred) {
                    var ratingURI = this.baseQueries.getRatingURI.replace('AAA', item.id);

                    $http.get(ratingURI)
                        .success(function (data) {
                            var _ratingData = data.substring('imdb.rating.run('.length, data.length - 1);
                            _ratingData = JSON.parse(_ratingData);

                            if (_ratingData['resource']) {
                                item.rating = _ratingData['resource'].rating;
                                item.year = _ratingData['resource'].year;
                                item.titleType = _ratingData['resource'].titleType;
                                item.ratingCount = _ratingData['resource'].ratingCount;
                                item.topRank = _ratingData['resource'].topRank;
                                deferred.resolve(item);
                            }
                            else {
                                DEBUG && console.log('IMDB rating response did not have "resource"', item);
                                deferred.reject();
                            }

                        })
                        .error(function (err) {
                            DEBUG && console.log('Failed to get IMDB rating from $http request', item);
                            deferred.reject(err);
                        })
                },

                getMovieNameRequest: function (textToSearch, yearToSearch, cacheOptions, movieObj, deferred) {
                    var self = this;

                    $http.get(self.baseQueries.getTitleURI + encodeURI(textToSearch)).success(function (data) {
                            var db = {};
                            self.fillDbWithData(db, data, yearToSearch);

                            //TODO begin logic for choosing the best movie id to search
                            var movieFromImdb = self.getMovieFromDbLogic(db);

                            if (movieFromImdb) {
                                //should store names
                                self.cacheMovieName(textToSearch, yearToSearch, movieFromImdb);
                                //now get rating
                                self.getRatingOfMovie(movieFromImdb, movieObj, deferred);
                            }
                            else {
                                DEBUG && console.log('Failed to find a relevant movie name from response', textToSearch, yearToSearch);
                                deferred.reject();
                            }
                        }
                    ).error(function (err) {
                            DEBUG && console.log('Failed to get movie name on $http request:', err);
                            deferred.reject();
                        });
                }
            }
        }
    ])
    .service('ptStorageService', function () {

        var options = {
            cacheOptions: {
                cacheNames  : false,
                cacheRatings: false
            }
        };

        var setCacheOptionsByValue = function (value) {

            value = parseInt(value);

            var cacheOptions = options.cacheOptions;

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

            set(options, true);

        };

        var getCacheOptionsAsValue = function () {
            var cacheOptions = options.cacheOptions;
            if (cacheOptions.cacheNames && cacheOptions.cacheRatings) return 2;
            if (cacheOptions.cacheNames) return 1;
            else return 0;
        };

        var getStorageSystem = function (sync) {
            return (sync) ? chrome.storage.sync : chrome.storage.local;
        };

        var getCacheOptionsFromStorage = function (callback) {
            get('cacheOptions', true, function (item) {
                var cacheOptions = options.cacheOptions;

                //set with default values
                if (!item || !item.cacheOptions) set(options, true);
                else {
                    cacheOptions.cacheNames = item.cacheOptions.cacheNames || false;
                    cacheOptions.cacheRatings = item.cacheOptions.cacheRatings || false;
                }
                callback(cacheOptions);
            });
        };

        var get = function (keys, sync, callback) {
            callback = callback || angular.noop();
            if (!keys || !keys.length) return callback();

            if (!angular.isDefined(sync)) sync = true;
            return getStorageSystem(sync).get(keys, callback);
        };

        var set = function (saveObj, sync, callback) {
            callback = callback || angular.noop();
            if (!saveObj) return callback();

            sync = sync || false;
            return getStorageSystem(sync).set(saveObj, callback);
        };

        return {
            get                       : get,
            set                       : set,
            getCacheOptionsFromStorage: getCacheOptionsFromStorage,
            getCacheOptionsAsValue    : getCacheOptionsAsValue,
            setCacheOptionsByValue    : setCacheOptionsByValue,
            options                   : options
        }
    });