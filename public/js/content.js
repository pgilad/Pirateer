/*!
 * content.js */
(function contentScript_main(document) {

    var pirateBayScript = function pirateBayScript() {
        var rawMovieList = [],
            movieListByName = [],
            movieFound = false;

        var getRatingFromBackground = function getRatingFromBackground() {
            var showSupportLink = true;

            if (!movieListByName.length) {
                console.log('[Pirateer] - No Videos in current page');
                var port = chrome.runtime.connect({name: "getRating"});
                port.postMessage({type: 'noVideo'});
                return;
            }

            var port = chrome.runtime.connect({name: "getRating"});
            port.postMessage({type: 'list', list: movieListByName});

            //add context menu to links
            $.contextMenu({
                selector: 'a.imdb-rating-link',
                trigger : 'hover',
                build   : function ($trigger, e) {

                    $trigger = $trigger[0];

                    var items = {
                        "title"     : {name: $trigger.dataset.title},
                        "year"      : {name: 'Year: ' + $trigger.dataset.year},
                        "imdbRating": {name: 'IMDB Rating: ' + $trigger.dataset.rating}
                    };

                    var ratingCount = $trigger.dataset.ratingCount;
                    if ($.isNumeric(ratingCount)) {
                        items['ratingCount'] = {name: 'Rating Count: ' + ratingCount};
                    }
                    var topRank = $trigger.dataset.topRank;
                    if ($.isNumeric(topRank)) {
                        items['topRank'] = {name: 'Highest Rank: ' + topRank};
                    }

                    items["sep1"] = "---------";
                    items["imdbLink"] = {
                        name    : 'See Movie On IMDB',
                        callback: function contextMenu_callback() {
                            port.postMessage({
                                type: 'imdbLinkClick',
                                item: {
                                    textToSearch: $trigger.dataset.textToSearch,
                                    href        : $trigger.dataset.href
                                }
                            });

                            window.open($trigger.dataset.href);

                        }};

                    /* NOT YET IMPLEMENTED
                     items["Amazon"] = {name: 'Buy on Amazon (Coming Soon)'};
                     */

                    return {
                        delay   : 500,
                        autoHide: true,
                        items   : items
                    }
                }
            });

            port.onMessage.addListener(function port_onMessage_addListener(msg) {

                if (msg.type === 'showSupportLink' && typeof msg.shouldShow !== 'undefined') {
                    showSupportLink = msg.shouldShow;
                    return;
                }
                else if (msg.type === 'endResponse') {

                    window.setTimeout(function window_setTimeout() {
                        rawMovieList = movieListByName = [];
                    }, 2000);

                    return;
                }
                else if (msg.type !== 'ratingResponse' || typeof msg.index === 'undefined') {
                    return;
                }

                if (!movieFound) {
                    movieFound = true;
                    helperFunctions.applyHeader();
                    helperFunctions.generateTds(rawMovieList);

                    if (showSupportLink) {
                        //compile support element
                        var $supportElement = $('<a target="_blank">Support Pirateer by rating on the Chrome Web Store</a>')
                            .attr('href', 'https://chrome.google.com/webstore/detail/pirateer/dleipnbkaniagkflpbhloiadkdooaacd/reviews')
                            .attr('title', 'Support Pirateer')
                            .attr('class', 'imdb-support-link')
                            .css('font-size', '13px')
                            .css('float', 'right')
                            .css('border-bottom-style', 'none')
                            .css('cursor', 'pointer')
                            .on('click', function () {
                                port.postMessage({
                                    type: 'imdbSupportClick',
                                    item: {
                                        url: document.URL
                                    }
                                });
                                this.innerText = 'Thank you for rating!';
                                this.off('click');
                            });

                        $supportElement.insertBefore($('table#searchResult'));
                    }
                }

                //compile element
                var $element = $('<a>' + msg.rating + '</a>')
                    .attr('title', msg.title + ' - IMDB' || null)
                    .css('cursor', 'pointer')
                    .attr('data-href', 'http://www.imdb.com/title/' + msg.id + '/')
                    .attr('class', 'imdb-rating-link')
                    .attr('data-title', msg.title)
                    .attr('data-rating-count', msg.ratingCount)
                    .attr('data-rating', msg.rating)
                    .attr('data-top-rank', msg.topRank)
                    .attr('data-year', msg.year)
                    .attr('target', '_blank')
                    .attr('data-id', msg.id)
                    .attr('data-text-to-search', msg.textToSearch);

                rawMovieList[msg.index].find('td.imdb').append($element);
            });
        };

        var helperFunctions = {
            /**
             * Apply a header to IMDB
             */
            applyHeader: function applyHeader() {
                $('tr.header').append('<th style="text-align:center;">IMDB Rating</th>');
            },

            /**
             * @param rawMovieList
             */
            generateTds: function generateTds(rawMovieList) {
                for (var i = 0; i < rawMovieList.length; ++i) {
                    rawMovieList[i].append('<td style="text-align:center;" class="imdb"></td>');
                }
            },

            isVideo: function isVideo(categoryFirstLine, categorySecondLine) {
                return categoryFirstLine === 'Video' && categorySecondLine.match(/movie/gi);
            }
        };

        var pirateBayMain = function pirateBayMain() {
            var $category,
                $currentTr,
                movieObj;

            //allTrList will include all trs, except header
            var allTrList = $('table#searchResult tbody tr');

            //find all category==movie
            for (var i = 0; allTrList, i < allTrList.length; ++i) {
                $currentTr = $(allTrList[i]);
                $category = $currentTr.find('.vertTh a');
                var categoryFirstLine = $category.eq(0).text();
                var categorySecondLine = $category.eq(1).text();

                //if it's a movie then get it's name
                if (helperFunctions.isVideo(categoryFirstLine, categorySecondLine)) {
                    movieObj = {
                        name : $currentTr.find('div.detName')[0].innerText,
                        index: i
                    };
                    movieListByName.push(movieObj);
                }
                //build movieObj if it's a movie
                rawMovieList.push($currentTr);
            }

            getRatingFromBackground();
        };

        pirateBayMain();
    };

    /**
     * Handle IMDB logic, will trigger if we get to IMDB pages
     */
    var imdbScript = function imdbScript(url) {
        var port = chrome.runtime.connect({name: "imdbReport"});
        port.postMessage({type: 'track', href: url});
    };

    var init = function main_init() {
        //get the url
        var url = document.URL;

        //if it's pirate bay - run the pirate bay script
        if (/thepiratebay\.sx/.test(url)) {
            pirateBayScript();
        }
        // if it's imdb - run the relevant script
        //relevant link to track for now:
        //http://www.imdb.com/title/tt2345567
        else if (/imdb\.com\/title\/(tt\d+)/g.test(url)) {
            imdbScript(url);
        }
    };

    init();

})(document);