var app = angular.module('app', []);

var _gaq = _gaq || [];
(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
    _gaq.push(['_setAccount', 'UA-43678943-3']);
    _gaq.push(['_trackPageview']);
})();