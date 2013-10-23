//globals
var app = angular.module('app', []);
if (typeof DEBUG === 'undefined') DEBUG = true;

/** @global **/
var _gaq = _gaq || [];

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);

    if (!chrome.runtime.getManifest().update_url) {
        DEBUG && console.log('Setting up local analytics ID of UA-99999999-X');
        _gaq.push(['_setAccount', 'UA-99999999-X'])
    } else {
        DEBUG && console.log('Setting up online analytics ID of UA-43678943-3');
        _gaq.push(['_setAccount', 'UA-43678943-3']);
    }
})();