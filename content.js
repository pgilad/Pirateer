var movieList = [];

var getRating = function () {
    console.log('Array after finish:', movieList);
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

var applyTD = function (element, isVideo) {
    movieList.push({item: element, video: isVideo});
    var _nodeRating = document.createTextNode((isVideo) ? '' : 'N/A');
    var _tdRating = document.createElement("td");
    appendChildToParent(element, _tdRating, _nodeRating);
};

var isCategoryVideo = function (category) {
    return category[0].innerText === 'Video';
};

(function () {
    var itemFound = false;
    //allTrList will include all trs, except header
    var allTrList = document.querySelectorAll("tbody tr");

    //narrow down list
    for (var i = 0; allTrList, i < allTrList.length; ++i) {
        var category = allTrList[i].querySelectorAll('.vertTh a');
        var isVideo = isCategoryVideo(category);
        if (!itemFound && isVideo) itemFound = true;
        applyTD(allTrList[i], isVideo);
    }

    if (itemFound) applyHeader();

    getRating();

})();