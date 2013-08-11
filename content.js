var getRating = function (arr) {
    console.log('Array after finish:', arr);
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

var applyTD = function (element) {
    var _nodeRating = document.createTextNode("");
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
    var movieList = [];

    //narrow down list
    for (var i = 0; allTrList, i < allTrList.length; ++i) {
        var category = allTrList[i].querySelectorAll('.vertTh a');
        var isVideo = isCategoryVideo(category);
        if (!itemFound && isVideo) itemFound = true;
        movieList.push({item: allTrList[i], video: isVideo});
    }


    forEach(function (element, index, arr) {
        //add header to table if it wasn't added already
        if (!headerWasAdded) headerWasAdded = applyHeader();

        applyTD(element);
        //check if we reached last element
        if (index === arr.length - 1) {
            getRating(arr);
        }
    });
})();

