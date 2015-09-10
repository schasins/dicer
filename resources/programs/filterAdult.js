var func_a1 = function(url, origUrl){
  var anchors = $('a');
  var i = anchors.length;
  while (i--){
    var a = anchors[i];
    var href = a.href;
    if (href == 'http://www.alexa.com/topsites/category/Adult/'){
    	return;
    }
  }
  return origUrl;
};