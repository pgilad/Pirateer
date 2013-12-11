/*!
 * app.js */
_gaq.push(['_trackPageview']);

(function () {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://apis.google.com/js/plusone.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
})();

angular.module('app').controller('MainCtrl', [
    '$scope', '$timeout', function ($scope, $timeout) {

        $scope.openOptionsPage = function () {
            chrome.tabs.create({url: 'options.html?origin=popup'});
        };

        /**
         * @type {*}
         */
        var reportOverDonations = _.debounce(function () {
            _gaq.push(['_trackEvent', 'Donations', 'fromPopup', 'mouseOver']);
        }, 1000);

        /**
         *
         */
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
                    _gaq.push(['_trackEvent', 'Donations', 'fromPopup', 'submitForm']);
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
            if (!searchTerm) return;
            var targetUrl = 'http://thepiratebay.ac/search/' + encodeURIComponent(searchTerm) + '/0/99/0';
            if (_gaq) {
                _gaq.push([
                    '_set', 'hitCallback', function () {
                        openNewWindow(targetUrl);
                        _gaq.push(['_set', 'hitCallback', null]);
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