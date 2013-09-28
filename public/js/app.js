_gaq.push(['_trackPageview']);

app.controller('MainCtrl', [
    '$scope', '$timeout', 'ptStorageService', function ($scope, $timeout, ptStorageService) {

        $scope.targetUrl = '';
        $scope.selectedCaching = {};

        $scope.cachingOptions = [
            { displayName : 'Comprehensive', value: 0, speedLabel: 'label label-warning',
                properties: [
                    'Searches names from scratch',
                    'Gets the most updated ratings',
                    'Slowest'
                ]},
            { displayName : 'Name Cache', value: 1, speedLabel: 'label label-success',
                properties: [
                    'Uses cached movie names to speed search (Recommended)',
                    'Gets the most updated ratings',
                    'Fast'
                ]},
            { displayName : 'Name & Ratings Cache', value: 2, speedLabel: 'label label-info',
                properties: [
                    'Caches names & ratings to speed search',
                    'Rating might not be up to date',
                    'Blazing Fast'
                ]
            }
        ];

        ptStorageService.getCacheOptionsFromStorage(function () {
            $scope.$apply(function () {
                $scope.selectedCaching.value = ptStorageService.getCacheOptionsAsValue();
            });
        });

        var openNewWindow = function () {
            window.open($scope.targetUrl);
        };

        $scope.cacheCleared = false;

        $scope.clearCache = function (e) {
            e.preventDefault();
            e.stopPropagation();

            chrome.storage.local.clear(function () {
                DEBUG && console.log('Cache Cleared');
                $scope.$apply(function () {
                    $scope.cacheCleared = true;
                });
                $timeout(function () {
                    $scope.cacheCleared = false;
                }, 1000);
            });
        };

        $scope.onChangeSelectedCaching = function (value) {
            ptStorageService.setCacheOptionsByValue(value);
        };

        $scope.searchIMDBFromPopup = function (searchTerm) {
            if (!searchTerm) return;
            $scope.targetUrl = 'http://thepiratebay.sx/search/' + encodeURIComponent(searchTerm) + '/0/99/0';
            if (_gaq) {
                _gaq.push(['_set', 'hitCallback', openNewWindow]);
                _gaq.push(['_trackEvent', 'Search', 'fromPopup', searchTerm]);
            } else {
                openNewWindow();
            }
            $timeout(openNewWindow, 500);
        }
    }
]);