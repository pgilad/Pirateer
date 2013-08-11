var app = angular.module('app', []);

app.run(['searchService', '$rootScope', function (searchService, $rootScope) {
    var prop = {
        id: 'getMovieData',
        title: 'IMDB rating for %s',
        contexts: ['selection']
    };

    //chrome.contextMenus.create(prop, function () {
    //});

    // The onClicked callback function.
    function onClickHandler(info, tab) {
        if (info && info.selectionText) {
            var _str = info.selectionText;
            //lose all dots
            _str = _str.replace(/\./g, ' ');
            //convert parenthesis to spaces
            _str = _str.replace(/\(/g, ' ');
            _str = _str.replace(/\)/g, ' ');
            //convert double spaces to 1 space
            _str = _str.replace(/  /g, ' ');

            var m = /\d{4}/g.exec(_str);

            if (m) {
                searchService.searchString.title = _str.substring(0, m.index - 1);
                searchService.searchString.year = parseInt(m[0]);
            }
            else {
                searchService.searchString.title = _str;
            }

            $rootScope.$broadcast('Search_Found');
        }
    }

    chrome.contextMenus.onClicked.addListener(onClickHandler);
}]);

app.service('searchService', function ($rootScope) {
    var searchString = {
        title: ''
    };

    return {
        searchString: searchString
    }
});

app.controller('FormCtrl', ['$scope', '$http', 'searchService', function ($scope, $http, searchService) {

    $scope.baseQueries = {};
    $scope.baseQueries.getTitleURI = 'http://www.imdb.com/xml/find?json=1&nr=1&tt=on&mx=1&q=';
    $scope.baseQueries.getRatingURI = 'http://p.media-imdb.com/static-content/documents/v1/title/AAA/ratings%3Fjsonp=imdb.rating.run:imdb.api.title.ratings/data.json';

    $scope.populars = [];
    $scope.subs = [];

    $scope.getRating = function (item) {
        var ratingURI = $scope.baseQueries.getRatingURI.replace('AAA', item.id);

        $http.get(ratingURI)
            .success(function (data) {
                console.log('Rating Data-', data);
                var _ratingData = data.substring('imdb.rating.run('.length);
                _ratingData = JSON.parse(_ratingData.substring(0, _ratingData.length - 1));
                item.rating = _ratingData['resource'] && +_ratingData['resource'].rating;
                item.year = _ratingData['resource'] && _ratingData['resource'].year;
                item.titleType = _ratingData['resource'] && _ratingData['resource'].titleType;

            })
            .error(function (err) {
                console.log('Rating Err-', err);
            })
    };

    $scope.$on('Search_Found', function () {
        console.log('got a change');
        $scope.$apply(function () {
            $scope.searchString = searchService.searchString.title;
            $scope.searchYear =  searchService.searchString.year;
            $scope.searchIMDB($scope.searchString);
        });
    });


    $scope.searchIMDB = function () {
        $scope.populars = [];
        $scope.subs = [];

        var textToSearch = $scope.searchString;
        var yearToSearch = parseInt($scope.searchYear) || null;


        $http.get($scope.baseQueries.getTitleURI + encodeURI(textToSearch))
            .success(function (data) {
                var i = 0, _year;

                console.log('Id Data - ', data);

                for (i = 0; data[ 'title_popular'] && i < data['title_popular'].length && i < 3; ++i) {
                    _year = parseInt(data['title_popular'][i].description.substring(0, 4));
                    //check for year dif
                    if (angular.isNumber(yearToSearch) && angular.isNumber(_year) && Math.abs(yearToSearch-_year)>1) continue;

                    $scope.populars.push({
                        id: data['title_popular'][i].id,
                        title: data['title_popular'][i].title
                    });

                    //now get the rating
                    $scope.getRating($scope.populars[i]);
                }

                for (i = 0; data['title_substring'] && i < data['title_substring'].length && i < 3; ++i) {
                    _year = parseInt(data['title_substring'][i].description.substring(0, 4));
                    //check for year dif
                    if (angular.isNumber(yearToSearch) && angular.isNumber(_year) && Math.abs(yearToSearch-_year)>1) continue;

                    $scope.subs.push({
                        id: data['title_substring'][i].id,
                        title: data['title_substring'][i].title
                    });
                    //now get the rating

                    $scope.getRating($scope.subs[i]);
                }
            }).error(function (err) {
                console.log('ID data-', err);
            });
    }
}]);