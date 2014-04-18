/*!
 * OptionsCtrl.js */

/** google plus 1 script **/
(function() {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://apis.google.com/js/plusone.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
})();
/** ENDOF google plus 1 script **/

angular.module('app').controller('OptionsCtrl', ['$scope', '$timeout', 'ptStorageService',
    function($scope, $timeout, ptStorageService) {
        $scope.cachedItems = {};
        $scope.selectedCaching = {};
        $scope.panels = {};

        var reportPageView = function() {
            _gaq.push(['_trackPageview']);
        };

        var init = function() {
            if (window.location.search) {
                var origin = window.location.search.split('=')[1];
                //user first installed app
                if (origin === 'welcome') {
                    $scope.panels.showUserWelcome = true;
                } else {
                    reportPageView();
                }
            } else {
                reportPageView();
            }

            chrome.storage.local.get(null, function(items) {
                DEBUG && console.log('Got all items from storage', items);
                $scope.cachedItems.items = items;
                $scope.cachedItems.itemsLength = _.keys(items).length;
            });

            chrome.storage.local.getBytesInUse(null, function(bytes) {
                DEBUG && console.log('got local storage usage', bytes);
                $scope.cachedItems.size = convertBytes(bytes);
            });

            /**
             * Get the cache options from storage space (sync)
             */
            ptStorageService.getCacheOptionsFromStorage(function(data) {
                $scope.$apply(function() {
                    DEBUG && console.log('got caching options from storage', data);
                    $scope.selectedCaching.value = ptStorageService.getCacheOptionsAsValue();
                });
            });
        };

        init();

        var convertBytes = function formatSizeUnits(bytes) {
            if (bytes >= 1000000000) {
                bytes = (bytes / 1000000000).toFixed(2) + ' GB';
            } else if (bytes >= 1000000) {
                bytes = (bytes / 1000000).toFixed(2) + ' MB';
            } else if (bytes >= 1000) {
                bytes = (bytes / 1000).toFixed(2) + ' KB';
            } else if (bytes > 1) {
                bytes = bytes + ' bytes';
            } else if (bytes == 1) {
                bytes = bytes + ' byte';
            } else {
                bytes = '0 byte';
            }
            return bytes;
        };

        $scope.toggleCachedItemsDisplay = function() {
            $scope.showCachedItems = !$scope.showCachedItems;
        };

        /**
         * CachingOptions
         * @type {Array}
         */
        $scope.cachingOptions = [{
            displayName: 'Comprehensive',
            value: 0,
            speedLabel: 'label label-warning',
            properties: [
                'Searches names from scratch',
                'Gets the most updated ratings',
                'Slowest'
            ]
        }, {
            displayName: 'Name Cache',
            value: 1,
            speedLabel: 'label label-success',
            properties: [
                'Uses cached movie names to speed search (Recommended)',
                'Gets the most updated ratings',
                'Fast'
            ]
        }, {
            displayName: 'Name & Ratings Cache',
            value: 2,
            speedLabel: 'label label-info',
            properties: [
                'Caches names & ratings to speed search',
                'Rating might not be up to date',
                'Blazing Fast'
            ]
        }];

        /**
         * Clears the cache for local storage
         * @param {Event} e
         */
        $scope.clearCache = function(e) {
            e.preventDefault();
            e.stopPropagation();

            chrome.storage.local.clear(function() {
                DEBUG && console.log('Cache Cleared');
                $scope.$apply(function() {
                    $scope.cacheClearedLabelShow = true;
                    init();
                });

                //clear label after a bit
                $timeout(function() {
                    $scope.cacheClearedLabelShow = false;
                }, 1000);
            });
        };

        /**
         * Set the value of cacheOptions in storage according to value passed in
         * @param {number} value
         */
        $scope.onChangeSelectedCaching = function(value) {
            ptStorageService.setCacheOptionsByValue(value);
        };

        $scope.submitForm = function(e) {
            e.stopPropagation();
            e.preventDefault();
            DEBUG && console.log('Submitting paypal form');
            document.querySelector('#paypalForm').submit();
        };

        /**
         * Open a new window
         * @param {string} url
         */
        var openNewWindow = function(url) {
            window.open(url);
        };

        /**
         * searchIMDBFromPopup - searches for a searchTerm in the piratebay
         * @param {String} searchTerm
         */
        $scope.searchIMDBFromPopup = function(searchTerm) {
            var hasOpened = false;
            if (!searchTerm) return;
            var targetUrl = 'http://thepiratebay.se/search/' + encodeURIComponent(searchTerm) + '/0/99/0';
            openNewWindow(targetUrl);
        };
    }
]);
