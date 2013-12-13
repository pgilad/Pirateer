/*!
 * OptionsCtrl.js */

/** google plus 1 script **/
(function () {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://apis.google.com/js/plusone.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
})();
/** ENDOF google plus 1 script **/

angular.module('app').controller('OptionsCtrl',
    ['$scope', '$timeout', 'ptStorageService',
        function ($scope, $timeout, ptStorageService) {
            $scope.cachedItems = {};
            $scope.selectedCaching = {};
            $scope.panels = {};

            var reportPageView = function () {
                _gaq.push(['_trackPageview']);
            };

            var init = function () {
                if (window.location.search) {
                    var origin = window.location.search.split('=')[1];
                    //user first installed app
                    if (origin === 'welcome') {
                        $scope.panels.showUserWelcome = true;
                    }
                    else {
                        reportPageView();
                    }
                }
                else {
                    reportPageView();
                }

                chrome.storage.local.get(null, function (items) {
                    DEBUG && console.log('Got all items from storage', items);
                    $scope.cachedItems.items = items;
                    $scope.cachedItems.itemsLength = _.keys(items).length;
                });

                chrome.storage.local.getBytesInUse(null, function (bytes) {
                    DEBUG && console.log('got local storage usage', bytes);
                    $scope.cachedItems.size = convertBytes(bytes);
                });

                /**
                 * Get the cache options from storage space (sync)
                 */
                ptStorageService.getCacheOptionsFromStorage(function (data) {
                    $scope.$apply(function () {
                        DEBUG && console.log('got caching options from storage', data);
                        $scope.selectedCaching.value = ptStorageService.getCacheOptionsAsValue();
                    });
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

            /**
             * @type {*}
             */
            var reportOverDonations = _.debounce(function () {
                _gaq.push(['_trackEvent', 'donations', 'mouseover', 'optionsPage']);
            }, 1000);

            var submitForm = function () {
                DEBUG && console.log('Submitting paypal form');
                document.querySelector('#paypalForm').submit();
            };

            /**
             * Report a mouseover /click event on paypal
             * @param e
             * @param type
             */
            $scope.reportOver = function (e, type) {
                if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                }

                if (type === 'mouseEnter') {
                    reportOverDonations();
                }
                else if (type === 'submit') {
                    if (_gaq) {
                        DEBUG && console.log('Detected gaq - pushing submitForm to hitcallback');
                        _gaq.push([
                            '_set', 'hitCallback', function () {
                                submitForm();
                                _gaq.push(['_set', 'hitCallback', null]);
                            }
                        ]);
                        _gaq.push(['_trackEvent', 'donations', 'buttonClick', 'optionsPage']);
                    } else {
                        submitForm();
                    }
                }
            };

            /**
             * Open a new window
             * @param {string} url
             */
            var openNewWindow = function (url) {
                window.open(url);
            };

            /**
             * searchIMDBFromPopup - searches for a searchTerm in the piratebay
             * @param {String} searchTerm
             */
            $scope.searchIMDBFromPopup = function (searchTerm) {
                var hasOpened = false;
                if (!searchTerm) return;
                var targetUrl = 'http://thepiratebay.pe/search/' + encodeURIComponent(searchTerm) + '/0/99/0';
                if (_gaq) {
                    _gaq.push([
                        '_set', 'hitCallback', function () {
                            hasOpened = true;
                            openNewWindow(targetUrl);
                            _gaq.push(['_set', 'hitCallback', null]);
                        }
                    ]);
                    _gaq.push(['_trackEvent', 'Search', 'fromOptions', searchTerm]);
                } else {
                    hasOpened = true;
                    openNewWindow(targetUrl);
                }
                //open the window anyway if the callback wasn't called
                $timeout(function () {
                    if (!hasOpened) {
                        openNewWindow();
                    }
                }, 1000);
            }
        }]);