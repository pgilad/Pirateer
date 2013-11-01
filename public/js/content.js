/*!
 * content.js */
(function contentScript_main(document) {

    var helpers = window.Pirateer.helpers;

    /**
     * Main INIT
     */
    var init = function main_init() {
        //get the url
        var url = document.URL;

        //if it's pirate bay - run the pirate bay script
        if (/thepiratebay\.sx/.test(url)) {
            helpers.pirateBayScript(url);
        }
        // if it's imdb - run the relevant script
        //relevant link to track for now:
        //http://www.imdb.com/title/tt2345567
        else if (/imdb\.com\/title\/(tt\d+)/g.test(url)) {
            helpers.imdbScript(url);
        }
    };

    init();

})(document);