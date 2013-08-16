var rawMovieList = [];
var movieListByName = [];

var getRating = function () {
    if (movieListByName.length) {
        var port = chrome.runtime.connect({name: "getRating"});
        port.postMessage({type: 'list', list: movieListByName});
        port.onMessage.addListener(function (msg) {
            if (msg.type === 'ratingResponse') {
                if (typeof msg.index !== 'undefined') {
                    rawMovieList[msg.index].querySelector('td.imdb').innerText = msg.rating;
                }
            }
        });
    }
    else {
        console.log('[Pirateer] - No Videos in current page');
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

var applyTD = function (element, isVideo, movieObj) {
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

(function () {
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
        applyTD(allTrList[i], isVideo, movieObj);
    }

    if (itemFound) applyHeader();

    getRating();

})();