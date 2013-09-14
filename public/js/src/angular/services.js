app.service('searchService', ['$http', '$q', function ($http, $q) {

    var baseQueries = {
        getTitleURI: 'http://www.imdb.com/xml/find?json=1&nr=1&tt=on&mx=1&q=',
        getRatingURI: 'http://p.media-imdb.com/static-content/documents/v1/title/AAA/ratings%3Fjsonp=imdb.rating.run:imdb.api.title.ratings/data.json'
    };

    var populars = [];
    var subs = [];

    var db = {};
    var imdbDataOptions = ['title_popular', 'title_substring', 'title_exact'];

    var searchIMDB = function (movieObj) {
        populars = [];
        subs = [];
        var deferred = $q.defer();

        var textToSearch = movieObj.title;
        var yearToSearch = movieObj.year;

        yearToSearch = parseInt(yearToSearch) || null;

        $http.get(baseQueries.getTitleURI + encodeURI(textToSearch))
            .success(function (data) {
                var i = 0, j = 0, _year;

                angular.forEach(imdbDataOptions, function (opt) {
                    db[opt] = [];
                });

                for (j = 0; j < imdbDataOptions.length; ++j) {
                    var curDataOption = imdbDataOptions[j];

                    for (i = 0; data[curDataOption] && i < data[curDataOption].length && i < 3; ++i) {
                        _year = parseInt(data[curDataOption][i].description.substring(0, 4));
                        //check for year dif
                        if (angular.isNumber(yearToSearch) && angular.isNumber(_year) && Math.abs(yearToSearch - _year) > 1) continue;

                        db[curDataOption].push({
                            id: data[curDataOption][i].id,
                            title: data[curDataOption][i].title
                        });
                    }
                }

                //TODO begin logic for choosing the best movie id to search
                var approxMovie = db['title_popular'] && db['title_popular'][0];
                if (!approxMovie) approxMovie = db['title_substring'] && db['title_substring'][0];
                if (!approxMovie) approxMovie = db['title_exact'] && db['title_exact'][0];

                if (approxMovie) {
                    angular.extend(approxMovie, {indexArr: movieObj.indexArr});
                    getRating(approxMovie, deferred);
                }
                else {
                    //console.log('no movie found for', textToSearch, yearToSearch, angular.copy(db));
                    deferred.reject();
                }
                /*End of Logic*/
            })
            .error(function (err) {
                //console.log('ID data-', err);
                deferred.reject();
            });

        return deferred.promise;
    };

    /**
     * @param item
     * @param deferred
     */
    var getRating = function (item, deferred) {
        var ratingURI = baseQueries.getRatingURI.replace('AAA', item.id);

        $http.get(ratingURI)
            .success(function (data) {

                var _ratingData = data.substring('imdb.rating.run('.length);
                _ratingData = JSON.parse(_ratingData.substring(0, _ratingData.length - 1));

                if (_ratingData['resource']) {
                    item.rating = _ratingData['resource'].rating;
                    item.year = _ratingData['resource'].year;
                    item.titleType = _ratingData['resource'].titleType;
                    item.ratingCount = _ratingData['resource'].ratingCount;
                    item.topRank = _ratingData['resource'].topRank;
                }
                //console.log('got item rating:', item);
                deferred.resolve(item);

            })
            .error(function (err) {
                //console.log('Rating Err-', err);
                deferred.reject();
            })
    };

    return {
        searchIMDB: searchIMDB,
        getRating: getRating
    }
}]);