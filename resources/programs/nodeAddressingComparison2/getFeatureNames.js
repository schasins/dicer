/******* TRAVERSAL code *********/

var output = "";
var url = "";
var first = true;
var actualUrl = window.location.href;

function nodeToXPath(element) {
	//  we want the full path, not one that uses the id since ids can change
	//  if (element.id !== '')
	//    return 'id("' + element.id + '")';
	  if (element.tagName.toLowerCase() === 'html')
	    return element.tagName;

	  // if there is no parent node then this element has been disconnected
	  // from the root of the DOM tree
	  if (!element.parentNode)
	    return '';

	  var ix = 0;
	  var siblings = element.parentNode.childNodes;
	  for (var i = 0, ii = siblings.length; i < ii; i++) {
	    var sibling = siblings[i];
	    if (sibling === element)
	      return nodeToXPath(element.parentNode) + '/' + element.tagName +
		     '[' + (ix + 1) + ']';
	    if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
	      ix++;
	  }
}

function getFeatures(element){
  var info = {};
  info.xpath = nodeToXPath(element);
  for (var prop in element) {
      console.log(prop);
	  var val = element[prop];
	  if (val !== null && typeof val === 'object'){
	    val = val.toString();
	  }
    else if (typeof val === 'function'){
      continue;
    }
	  info[prop] = val;
  } //test

  var text = element.textContent;
  info.textContent = text;
  var trimmedText = text.trim();
  info.firstWord = trimmedText.slice(0,trimmedText.indexOf(" "));
  info.lastWord = trimmedText.slice(trimmedText.lastIndexOf(" "),trimmedText.length);
  var colonIndex = trimmedText.indexOf(":")
  if (colonIndex > -1){
    info.preColonText = trimmedText.slice(0,colonIndex);
  }
  var children = element.childNodes;
  var l = children.length;
  for (var i = 0; i< l; i++){
    var childText = children[i].textContent;
    info["child"+i+"text"] = childText;
    info["lastChild"+(l-i)+"text"] = childText;
  }

  var prev = element.previousElementSibling;
  if (prev !== null){
    info.previousElementSiblingText = prev.textContent;
  }

  var boundingBox = element.getBoundingClientRect();
  for (var prop in boundingBox) {
    if (boundingBox.hasOwnProperty(prop)) {
      info[prop] = boundingBox.prop;
    }
  }
  var style = window.getComputedStyle(element, null);
  for (var i = 0; i < style.length; i++) {
    var prop = style[i];
    info[prop] = style.getPropertyValue(prop);
  }
  return info;
}

function walkTheDOM(node, xpath) {

	var features = getFeatures(node);
	for (var feature in features){
		output += feature + "@#@";
	}
    
    node = node.firstChild;
    var tags = {};
    while (node) {
        var tag = node.tagName;
        if (!tag){
           node = node.nextSibling;
           continue;
        }
        tags[tag] = (tags[tag]) ? tags[tag]+1 : 1;
        var xpathChild = xpath+"/"+tag+"["+tags[tag]+"]";
        walkTheDOM(node,xpathChild);
        node = node.nextSibling;
    }
}

var func_a1 = function(urlArg){
  url = urlArg;
  var element = document.body;
  walkTheDOM(element,"HTML/BODY");
  return output;
};
