_gaq.push(['_trackPageview']);

app.controller('MainCtrl', [
    '$scope', '$timeout', 'ptStorageService', function ($scope, $timeout, ptStorageService) {

        $scope.targetUrl = '';
        $scope.selectedCaching = {};

        /**
         * CachingOptions
         * @type {Array}
         */
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

        var reportOverDonations = _.debounce(function () {
            _gaq.push(['_trackEvent', 'Donations', 'fromPopup', 'mouseOver']);
        }, 1000);

        var submitForm = function () {
            document.querySelector('#paypalForm').submit();
        };

        var reportClickDonations = _.debounce(function () {

            if (_gaq) {
                _gaq.push(['_set', 'hitCallback', submitForm]);
                _gaq.push(['_trackEvent', 'Donations', 'fromPopup', 'submitForm']);
            } else {
                submitForm();
            }
        }, 100);

        $scope.reportOver = function (e, type) {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }

            if (type === 'mouseEnter') {
                reportOverDonations();
            }
            else if (type === 'submit') {
                reportClickDonations(type);
            }
        };

        ptStorageService.getCacheOptionsFromStorage(function () {
            $scope.$apply(function () {
                $scope.selectedCaching.value = ptStorageService.getCacheOptionsAsValue();
            });
        });

        /** Open a new window *
         * @param {string} url
         */
        var openNewWindow = function (url) {
            url = url || $scope.targetUrl;
            window.open(url);
        };

        $scope.cacheClearedLabelShow = false;

        /**
         * Clears the cache for local storage
         * @param {Event} e
         */
        $scope.clearCache = function (e) {
            e.preventDefault();
            e.stopPropagation();

            chrome.storage.local.clear(function () {
                DEBUG && console.log('Cache Cleared');
                $scope.$apply(function () {
                    $scope.cacheClearedLabelShow = true;
                });

                $timeout(function () {
                    $scope.cacheClearedLabelShow = false;
                }, 1000);
            });
        };

        /**
         * Set the value of cacheOptions in storage according to value passed in
         * @param {number} value
         */
        $scope.onChangeSelectedCaching = function (value) {
            ptStorageService.setCacheOptionsByValue(value);
        };
        /**
         * searchIMDBFromPopup - searches for a searchTerm in the piratebay
         * @param {String} searchTerm
         */
        $scope.searchIMDBFromPopup = function (searchTerm) {
            if (!searchTerm) return;
            var targetUrl = 'http://thepiratebay.sx/search/' + encodeURIComponent(searchTerm) + '/0/99/0';
            if (_gaq) {
                _gaq.push([
                    '_set', 'hitCallback', function () {
                        openNewWindow(targetUrl)
                    }
                ]);
                _gaq.push(['_trackEvent', 'Search', 'fromPopup', searchTerm]);
            } else {
                openNewWindow(targetUrl);
            }
            //open the window anyway if the callback wasn't called
            $timeout(openNewWindow, 500);
        }
    }
]);