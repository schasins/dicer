/******* XPATH TO NODE code *********/

    // convert an xpath expression to an array of DOM nodes
	function xPathToNodes(xpath) {
	  try {
	    var q = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE,
		                      null);
	    var results = [];

	    var next = q.iterateNext();
	    while (next) {
	      results.push(next);
	      next = q.iterateNext();
	    }
	    return results;
	  } catch (e) {
	    return null;
	  }
	  return [];
	}

	function xPathToNode(xpath) {
	  var nodes = xPathToNodes(xpath);
	  //if we don't successfully find nodes, let's alert
	  if (nodes.length != 1)
	    return null;

	  if (nodes.length >= 1)
	    return nodes[0];
	  else
	    return null;
	}

/******* FILTERING code *********/

function simulateClick(node) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0,
        false, false, false, false, 0, null);

    node.dispatchEvent(evt);
}

var func1 = function(xpath,url1){
	var node = xPathToNode(xpath);
	if (node == null) { return; }
	simulateClick(node);
};

var func2 = function(xpath,url1){
	var url2 = window.location.href;
	if (url2 == url1){
		return;
	}
	return xpath+"<,>"+url1+"<,>"+url2;
};