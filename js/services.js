app.service('searchService', function ($rootScope) {
    var searchString = {
        title: ''
    };

    return {
        searchString: searchString
    }
});