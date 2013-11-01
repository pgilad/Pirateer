/*!
 * content-helpers.js */
(function (window) {

    //define helpers object
    window.Pirateer = window.Pirateer || {};
    window.Pirateer.helpers = window.Pirateer.helpers || {};
    var helpers = window.Pirateer.helpers;

    helpers.helperFunctions = {
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
        },

        reportNoMovies: function () {
            console.log('[Pirateer] - No Videos in current page');
            helpers.port = chrome.runtime.connect({name: "getRating"});
            helpers.port.postMessage({type: 'noVideo'});
        },

        /**
         *
         * @param {Array} movieListByName
         * @param {Array} rawMovieList
         */
        fillArraysWithMovies: function (movieListByName, rawMovieList) {
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
                if (helpers.helperFunctions.isVideo(categoryFirstLine, categorySecondLine)) {
                    movieObj = {
                        name : $currentTr.find('div.detName')[0].innerText,
                        index: i
                    };
                    movieListByName.push(movieObj);
                }
                //build movieObj if it's a movie
                rawMovieList.push($currentTr);
            }
        },

        getCompiledTdElement: function (msg) {
            //compile element
            return $('<a>' + msg.rating + '</a>')
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
        },

        insertSupportLink: function () {
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
                    helpers.port.postMessage({
                        type: 'imdbSupportClick',
                        item: {
                            url: document.URL
                        }
                    });
                    this.innerText = 'Thank you for rating!';
                    this.off('click');
                });

            $supportElement.insertBefore($('table#searchResult'));
        },

        addContextMenu: function () {
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
                            helpers.port.postMessage({
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
        }
    };

    helpers.handleFirstMovieFound = function (rawMovieList, showSupportLink) {
        helpers.helperFunctions.applyHeader();
        helpers.helperFunctions.generateTds(rawMovieList);

        //short circuit insert support link
        showSupportLink && helpers.helperFunctions.insertSupportLink();
    };

    helpers.handleEndResponse = function (movieListByName, rawMovieList) {
        window.setTimeout(function window_setTimeout() {
            rawMovieList = movieListByName = [];
        }, 2000);
    };

    /**
     *
     * @param movieListByName
     * @param rawMovieList
     */
    helpers.getRatingFromBackground = function (movieListByName, rawMovieList) {
        var showSupportLink = true,
            movieFound = false;

        helpers.port = chrome.runtime.connect({name: "getRating"});
        helpers.port.postMessage({type: 'list', list: movieListByName});
        helpers.helperFunctions.addContextMenu();

        helpers.port.onMessage.addListener(function port_onMessage_addListener(msg) {

            if (msg.type === 'ratingResponse' && typeof msg.index !== 'undefined') {

                if (!movieFound) {
                    movieFound = true;
                    helpers.handleFirstMovieFound(rawMovieList, showSupportLink);
                }

                //get compiled td element
                var $element = helpers.helperFunctions.getCompiledTdElement(msg);
                //append element to td
                rawMovieList[msg.index].find('td.imdb').append($element);
            }
            //get settings
            else if (msg.type === 'showSupportLink' && typeof msg.shouldShow !== 'undefined') {
                showSupportLink = msg.shouldShow;
            }
            //finished receiving
            else if (msg.type === 'endResponse') {
                helpers.handleEndResponse(movieListByName, rawMovieList);
            }
            //unknown response
            else {

            }
        });
    };

    helpers.pirateBayScript = function (url) {
        var rawMovieList = [], movieListByName = [];

        helpers.helperFunctions.fillArraysWithMovies(movieListByName, rawMovieList);
        if (!movieListByName.length) {
            helpers.helperFunctions.reportNoMovies();
            rawMovieList.length = movieListByName.length = 0;
            return;
        }

        //if we found at least 1 movie
        helpers.getRatingFromBackground(movieListByName, rawMovieList);

    };

    /**
     * Handle IMDB logic, will trigger if we get to IMDB pages
     */
    helpers.imdbScript = function imdbScript(url) {
        helpers.port = chrome.runtime.connect({name: "imdbReport"});
        helpers.port.postMessage({type: 'track', href: url});
    };

})(window);