app.service('searchService', ['$http', '$rootScope', '$q', function ($http, $rootScope, $q) {

    var baseQueries = {};
    baseQueries.getTitleURI = 'http://www.imdb.com/xml/find?json=1&nr=1&tt=on&mx=1&q=';
    baseQueries.getRatingURI = 'http://p.media-imdb.com/static-content/documents/v1/title/AAA/ratings%3Fjsonp=imdb.rating.run:imdb.api.title.ratings/data.json';

    var populars = [];
    var subs = [];


    var searchIMDB = function (firstRun, textToSearch, yearToSearch) {
        populars = [];
        subs = [];
        var deferred = $q.defer();

        yearToSearch = parseInt(yearToSearch) || null;

        $http.get(baseQueries.getTitleURI + encodeURI(textToSearch))
            .success(function (data) {
                var i = 0, _year;

//                console.log('Id Data - ', data);

                for (i = 0; data[ 'title_popular'] && i < data['title_popular'].length && i < 3; ++i) {
                    _year = parseInt(data['title_popular'][i].description.substring(0, 4));
                    //check for year dif
                    if (angular.isNumber(yearToSearch) && angular.isNumber(_year) && Math.abs(yearToSearch - _year) > 1) continue;

                    populars.push({
                        id: data['title_popular'][i].id,
                        title: data['title_popular'][i].title
                    });
                }

                for (i = 0; data['title_substring'] && i < data['title_substring'].length && i < 3; ++i) {
                    _year = parseInt(data['title_substring'][i].description.substring(0, 4));
                    //check for year dif
                    if (angular.isNumber(yearToSearch) && angular.isNumber(_year) && Math.abs(yearToSearch - _year) > 1) continue;

                    subs.push({
                        id: data['title_substring'][i].id,
                        title: data['title_substring'][i].title
                    });
                    //now get the rating
                }

                //TODO begin logic for choosing the best movie id to search
                if (populars[0]) {
                    getRating(populars[0], deferred);
                }
                else {
//                    console.log('no populars[0] for', textToSearch);
                    deferred.reject();
                }
                /*End of Logic*/
            })
            .error(function (err) {
//                console.log('ID data-', err);
                deferred.reject();
            });

        if (firstRun) $rootScope.$apply();

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
//                console.log('got item rating:', item);
                deferred.resolve(item);

            })
            .error(function (err) {
//                console.log('Rating Err-', err);
                deferred.reject();
            })
    };

    return {
        searchIMDB: searchIMDB,
        getRating: getRating
    }
}]);