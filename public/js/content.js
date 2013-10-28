(function (document) {

    var pirateBayScript = function () {
        var rawMovieList = [],
            movieListByName = [],
            movieFound = false;

        var getRatingFromBackground = function () {
            if (!movieListByName.length) {
                console.log('[Pirateer] - No Videos in current page');
                var port = chrome.runtime.connect({name: "getRating"});
                port.postMessage({type: 'noVideo'});
                return;
            }

            var port = chrome.runtime.connect({name: "getRating"});
            port.postMessage({type: 'list', list: movieListByName});
            port.onMessage.addListener(function (msg) {

                if (msg.type !== 'ratingResponse' || typeof msg.index === 'undefined') {
                    return;
                }

                if (!movieFound) {
                    movieFound = true;
                    helperFunctions.applyHeader();
                    helperFunctions.generateTds(rawMovieList);
                }

                //compile element
                var $element = $('<a>' + msg.rating + '</a>')
                    .attr('title', msg.title + ' - IMDB' || null)
                    .attr('href', 'http://www.imdb.com/title/' + msg.id + '/')
                    .attr('data-title', msg.title)
                    .attr('data-id', msg.id)
                    .attr('data-text-to-search', msg.textToSearch);

                rawMovieList[msg.index].find('td.imdb').append($element).onclick = function () {
                    port.postMessage({
                        type: 'imdbLinkClick',
                        item: {
                            textToSearch: this['data-text-to-search'],
                            href        : this['href']
                        }
                    });
                }

            });
        };

        var helperFunctions = {
            /**
             * Apply a header to IMDB
             */
            applyHeader: function () {
                $('tr.header').append('<th style="text-align:center;">IMDB Rating</th>');
            },

            /**
             * @param rawMovieList
             */
            generateTds: function (rawMovieList) {
                for (var i = 0; i < rawMovieList.length; ++i) {
                    rawMovieList[i].append('<td style="text-align:center;" class="imdb"></td>');
                }
            },

            isVideo: function (categoryFirstLine, categorySecondLine) {
                return categoryFirstLine === 'Video' && categorySecondLine.match(/movie/gi);
            }
        };

        var pirateBayMain = function () {
            var itemFound = false,
                $category,
                $currentTr,
                movieObj;

            //allTrList will include all trs, except header
            var allTrList = $('tbody tr');

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
    var imdbScript = function (url) {
        var port = chrome.runtime.connect({name: "imdbReport"});
        port.postMessage({type: 'track', href: url});
    };

    var init = function () {
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

})
    (document);