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
        if (/imdb\.com\/title\/(tt\d+)/g.test(url)) {
            helpers.imdbScript(url);
        }
        else {
            helpers.pirateBayScript(url);
        }
    };

    init();

})(document);
