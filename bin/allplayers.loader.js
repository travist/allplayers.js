/*! allplayers.js 2014-04-14 */
var allplayers=allplayers||{};allplayers.loader=function(a){for(var b="",c=document.scripts.length;c--;){var d=document.scripts[c].getAttribute("src"),e=d.search(/(src|bin)\/allplayers\.loader\.js$/);if(e>=0){b=d.substr(0,e);break}}var f=function(a){for(var b=null,c=a.scripts.length;c--;)if(!a.tests[c]()){b=document.createElement("script"),b.src=a.script;var d=document.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}};f({scripts:["http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js","lib/"+a+"/bin/allplayers."+a+".compressed.js"],tests:[function(){return"undefined"!=typeof jQuery},function(){return"undefined"!=typeof jQuery.fn[a]}]})};