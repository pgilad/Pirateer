var app=angular.module("app",[]),_gaq=_gaq||[];!function(){var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src="https://ssl.google-analytics.com/ga.js";var b=document.getElementsByTagName("script")[0];b.parentNode.insertBefore(a,b)}(),app.run(["searchService","$rootScope",function(a,b){function c(b,d){var f;b.length&&e&&(f=b.shift(),a.searchIMDB(f).then(function(a){if(e){for(var f=0;f<a.indexArr.length;++f)try{d.postMessage({type:"ratingResponse",title:a.title,index:a.indexArr[f],rating:a.rating,id:a.id})}catch(g){}c(b,d)}},function(){c(b,d)}))}var d=!1,e=!1,f=[],g=function(a){for(var b,c,d=0;d<a.length;++d){var e=a[d].name;e=e.replace(/\./g," ").replace(/\-/g," ").replace(/_/g," ").replace(/\(/g," ").replace(/\)/g," ").replace(/\[/g," ").replace(/\]/g," ").replace(/\s\s+/g," ").replace(/\s$/,"");var g=/\d{4}/g.exec(e);g?(b=e.substring(0,g.index-1),c=parseInt(g[0])):(b=e,c=null);var h=_.find(f,{title:b,year:c});h?h.indexArr.push(a[d].index):f.push({title:b,year:c,indexArr:[a[d].index]})}};chrome.runtime.onConnect.addListener(function(a){a.onDisconnect.addListener(function(){e=!1,a.onMessage.removeListener()}),"getRating"===a.name&&a.onMessage.addListener(function(h){"list"===h.type&&(d||(_gaq.push(["_setAccount","UA-43678943-3"]),d=!0),_gaq.push(["_trackPageview"]),_gaq.push(["_trackEvent","Search","fromIMDB",decodeURI(a.sender.url)]),e=!0,f=[],g(h.list),b.$apply(function(){c(angular.copy(f,[]),a)}))})})}]);