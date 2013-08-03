var app = angular.module('app', []);

app.run(['searchService', '$rootScope', function (searchService, $rootScope) {
    var prop = {
        id: 'getMovieData',
        title: 'IMDB rating for %s',
        contexts: ['selection']
    };

    chrome.runtime.onInstalled.addListener(function () {
        chrome.contextMenus.create(prop, function () {
        });
    });

    // The onClicked callback function.
    function onClickHandler(info, tab) {
        if (info && info.selectionText) {
            searchService.updateTitle(info.selectionText);
            console.log('searching for', info.selectionText);
        }
    }

    chrome.contextMenus.onClicked.addListener(onClickHandler);
}]);

app.service('searchService', function ($rootScope) {
    var title = '';

    var updateTitle = function (_withWhat) {
        $rootScope.$apply(function () {
            title = _withWhat;
        })
    };

    return {
        title: title,
        updateTitle: updateTitle
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
            })
            .error(function (err) {
                console.log('Rating Err-', err);
            })
    };

    $scope.text = function () {
        return searchService.title;
    };

    $scope.$watch(searchService.title, function (newval, oldval) {
        console.log(searchService.title);
    });


    $scope.searchIMDB = function (textToSearch) {
        $scope.populars = [];
        $scope.subs = [];

        $http.get($scope.baseQueries.getTitleURI + encodeURI(textToSearch))
            .success(function (data) {
                var i = 0;

                console.log('Id Data - ', data);

                for (i = 0; data['title_popular'] && i < data['title_popular'].length && i < 3; ++i) {
                    $scope.populars.push({
                        id: data['title_popular'][i].id,
                        title: data['title_popular'][i].title
                    });

                    //now get the rating
                    $scope.getRating($scope.populars[i]);
                }

                for (i = 0; data['title_substring'] && i < data['title_substring'].length && i < 3; ++i) {
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