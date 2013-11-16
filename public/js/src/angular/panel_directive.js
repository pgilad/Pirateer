/**
 * Created by GiladP on 16/11/13.
 */


angular.module('app').directive('ptOptionsPanel', function () {

    return {
        replace   : false,
        scope     : {
            panelTitleText: '@'
        },
        transclude: true,
        restrict  : 'E',
        template  : '<div>\n    <div class="panel panel-default">\n        <div class="panel-heading">\n            <h3 class="panel-title">\n                {{ panelTitleText }}\n            </h3>\n        </div>\n        <div class="panel-body">\n            <div ng-transclude=""></div>\n        </div>\n    </div>\n</div>'
    };
});