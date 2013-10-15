(function (document) {

    var pirateBayScript = function () {
        var rawMovieList = [];
        var movieListByName = [];

        var getRating = function () {
            if (movieListByName.length) {
                var port = chrome.runtime.connect({name: "getRating"});
                port.postMessage({type: 'list', list: movieListByName});
                port.onMessage.addListener(function (msg) {
                    if (msg.type === 'ratingResponse') {
                        if (typeof msg.index !== 'undefined') {
                            var a = document.createElement('a');
                            var linkText = document.createTextNode(msg.rating);
                            a.appendChild(linkText);
                            a.title = msg.title + ' - IMDB' || null;
                            a.href = "http://www.imdb.com/title/" + msg.id + '/';
                            a['data-title'] = msg.title;
                            a['data-id'] = msg.id;
                            a['data-text-to-search'] = msg.textToSearch;
                            rawMovieList[msg.index].querySelector('td.imdb').appendChild(a).onclick = function () {
                                port.postMessage({
                                    type: 'imdbLinkClick',
                                    item: {
                                        textToSearch: this['data-text-to-search'],
                                        href        : this['href']
                                    }
                                });
                            }
                        }
                    }
                });
            }
            else {
                console.log('[Pirateer] - No Videos in current page');
                var port = chrome.runtime.connect({name: "getRating"});
                port.postMessage({type: 'noVideo'});
            }
        };

        var appendChildToParent = function (header, td, node) {
            td.style.textAlign = 'center';
            td.appendChild(node);
            header.appendChild(td);
        };

        var applyHeader = function () {
            var _header = document.querySelector("tr.header");
            var _node = document.createTextNode("IMDB Rating");
            var _td = document.createElement("th");
            appendChildToParent(_header, _td, _node);
            return true;
        };

        var applyTD = function (element, movieObj) {
            rawMovieList.push(element);
            if (movieObj) movieListByName.push(movieObj);
            var _nodeRating = document.createTextNode('');
            var _tdRating = document.createElement("td");
            _tdRating.className = 'imdb';

            appendChildToParent(element, _tdRating, _nodeRating);
        };

        var isCategoryVideo = function (category) {
            return category && category[0] && category[0].innerText && category[0].innerText === 'Video';
        };

        var itemFound = false,
            _movieName = null,
            category,
            isVideo,
            movieObj;

        //allTrList will include all trs, except header
        var allTrList = document.querySelectorAll("tbody tr");

        //find all category==movie
        for (var i = 0; allTrList, i < allTrList.length; ++i) {
            category = allTrList[i].querySelectorAll('.vertTh a');
            isVideo = isCategoryVideo(category);
            //if it's a movie then get it's name
            _movieName = (isVideo) ? allTrList[i].querySelector('div.detName').innerText : null;
            //build movieObj if it's a movie
            movieObj = (_movieName) ? {name: _movieName, index: i} : null;
            if (!itemFound && isVideo) itemFound = true;
            applyTD(allTrList[i], movieObj);
        }

        if (itemFound) applyHeader();

        getRating();
    };

    var imdbScript = function () {
        var port = chrome.runtime.connect({name: "imdbReport"});
        port.postMessage({type: 'track', href: url});
    };

    var url = document.URL;

    if (/thepiratebay\.sx/.test(url)) {
        pirateBayScript();
    }
    else if (/www\.imdb\.com/.test(url)) {
        imdbScript();
    }

})(document);