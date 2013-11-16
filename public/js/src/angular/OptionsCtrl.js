/*!
 * OptionsCtrl.js */
_gaq.push(['_trackPageview']);

angular.module('app').controller('OptionsCtrl', ['$scope', '$timeout', 'ptStorageService', function ($scope, $timeout, ptStorageService) {
    $scope.cachedItems = {};

    var init = function () {
        chrome.storage.local.get(null, function (items) {
            DEBUG && console.log('Got all items from storage', items);
            $scope.cachedItems.items = items;
            $scope.cachedItems.itemsLength = _.keys(items).length;
        });

        chrome.storage.local.getBytesInUse(null, function (bytes) {
            DEBUG && console.log('got local storage usage', bytes);
            $scope.cachedItems.size = convertBytes(bytes);
        });
    };

    init();

    var convertBytes = function formatSizeUnits(bytes) {
        if (bytes >= 1000000000) {
            bytes = (bytes / 1000000000).toFixed(2) + ' GB';
        }
        else if (bytes >= 1000000) {
            bytes = (bytes / 1000000).toFixed(2) + ' MB';
        }
        else if (bytes >= 1000) {
            bytes = (bytes / 1000).toFixed(2) + ' KB';
        }
        else if (bytes > 1) {
            bytes = bytes + ' bytes';
        }
        else if (bytes == 1) {
            bytes = bytes + ' byte';
        }
        else {
            bytes = '0 byte';
        }
        return bytes;
    };

    $scope.toggleCachedItemsDisplay = function () {
        $scope.showCachedItems = !$scope.showCachedItems;
        if ($scope.showCachedItems) {
            _gaq.push(['_trackEvent', 'settings', 'cachedItems', 'show'])
        }

    };

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

    /**
     * Get the cache options from storage space (sync)
     */
    ptStorageService.getCacheOptionsFromStorage(function () {
        $scope.$apply(function () {
            $scope.selectedCaching.value = ptStorageService.getCacheOptionsAsValue();
        });
    });

    /**
     * Clears the cache for local storage
     * @param {Event} e
     */
    $scope.clearCache = function (e) {
        e.preventDefault();
        e.stopPropagation();

        chrome.storage.local.clear(function () {
            DEBUG && console.log('Cache Cleared');

            _gaq.push(['_trackEvent', 'settings', 'cachedItems', 'clear']);
            
            $scope.$apply(function () {
                $scope.cacheClearedLabelShow = true;
                init();
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
}
]);