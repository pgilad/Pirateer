app.service("searchService",["$http","$rootScope","$q",function(a,b,c){var d={};d.getTitleURI="http://www.imdb.com/xml/find?json=1&nr=1&tt=on&mx=1&q=",d.getRatingURI="http://p.media-imdb.com/static-content/documents/v1/title/AAA/ratings%3Fjsonp=imdb.rating.run:imdb.api.title.ratings/data.json";var e=[],f=[],g=function(g,i,j){e=[],f=[];var k=c.defer();return j=parseInt(j)||null,a.get(d.getTitleURI+encodeURI(i)).success(function(a){var b,c=0;for(c=0;a.title_popular&&c<a.title_popular.length&&3>c;++c)b=parseInt(a.title_popular[c].description.substring(0,4)),angular.isNumber(j)&&angular.isNumber(b)&&Math.abs(j-b)>1||e.push({id:a.title_popular[c].id,title:a.title_popular[c].title});for(c=0;a.title_substring&&c<a.title_substring.length&&3>c;++c)b=parseInt(a.title_substring[c].description.substring(0,4)),angular.isNumber(j)&&angular.isNumber(b)&&Math.abs(j-b)>1||f.push({id:a.title_substring[c].id,title:a.title_substring[c].title});e[0]?h(e[0],k):k.reject()}).error(function(){k.reject()}),g&&b.$apply(),k.promise},h=function(b,c){var e=d.getRatingURI.replace("AAA",b.id);a.get(e).success(function(a){var d=a.substring("imdb.rating.run(".length);d=JSON.parse(d.substring(0,d.length-1)),d.resource&&(b.rating=d.resource.rating,b.year=d.resource.year,b.titleType=d.resource.titleType,b.ratingCount=d.resource.ratingCount,b.topRank=d.resource.topRank),c.resolve(b)}).error(function(){c.reject()})};return{searchIMDB:g,getRating:h}}]);