/**
 * Created by GiladP on 16/11/13.
 */

angular.module('app').directive('ptOptionsPanel', function() {

    return {
        replace: true,
        scope: {
            panelTitleText: '@',
            panelClass: '@'
        },
        transclude: true,
        restrict: 'E',
        template: '<div class="panel {{ panelClass }}">\n    <div class="panel-heading">\n        <h3 class="panel-title">\n            {{ panelTitleText }}\n        </h3>\n    </div>\n    <div class="panel-body">\n        <div ng-transclude=""></div>\n    </div>\n</div>',
        link: function(scope, element, attrs) {

            attrs.$observe('panelClass', function(newVal) {
                scope.panelClass = newVal || 'panel-default';
            });
        }
    };
});
