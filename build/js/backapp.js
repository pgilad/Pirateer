var app=angular.module("app",[]);app.run(["searchService","$q",function(a){function b(b,e,f){if(c&&b&&b.length>0){var g,h,i=b[0].name;i=i.replace(/\./g," "),i=i.replace(/\(/g," "),i=i.replace(/\)/g," "),i=i.replace(/  /g," ");var j=/\d{4}/g.exec(i);j?(g=i.substring(0,j.index-1),h=parseInt(j[0])):g=i,a.searchIMDB(f,g,h).then(function(a){c&&(e.postMessage({type:"ratingResponse",index:b[0].index,rating:a.rating}),d(b,e))},function(){c&&(console.log("error with this",b[0]),d(b,e))})}}var c=!1,d=function(a,c){a.shift(),b(a,c,!1)};chrome.runtime.onConnect.addListener(function(a){a.onDisconnect.addListener(function(){c=!1,a.onMessage.removeListener()}),"getRating"===a.name&&a.onMessage.addListener(function(d){"list"===d.type&&(c=!0,b(d.list,a,!0))})})}]);