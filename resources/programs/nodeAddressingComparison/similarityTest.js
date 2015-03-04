/******* SNAPSHOT code *********/

var snapshot = null;
var snapshotNode = null;
var snapshotBranch = null;

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

(function() {
  var ignoreTags = {'script': true, 'style': true};

  function getProperties(node, props) {
    if (props == 'all')
      props = Object.keys(node)
    else if (!props)
      props = []
    
    var mapping = {};
    for (var i = 0, ii = props.length; i < ii; ++i) {
      var prop = props[i];
      try {
        var firstChar = prop.charCodeAt(0);
        if (firstChar >= 65 && firstChar <= 90) {
          continue;
        }
        var val = node[prop];
        var type = typeof val;
        if (type == 'string' || type == 'number' || type == 'boolean') {
          mapping[prop] = val;
        }
      } catch (e) {
        // do nothing
      }
    }
    return mapping;
  }

  function cloneNode(node, xpath, childTags, props) {
    xpath = xpath.toLowerCase();

    var nodeName = node.nodeName.toLowerCase();
    var returnVal = {type: 'DOM'};

    // possible failure due to cross-domain browser restrictions
    if (nodeName == 'iframe')
      returnVal.prop = {};
    else
      returnVal.prop = getProperties(node, props);

    returnVal.prop['nodeName'] = nodeName;
    returnVal.prop['xpath'] = xpath;

    if (childTags) {
      var childNodes = node.children;
      var children = [];
      returnVal.children = children;
      var childrenTags = {};

      for (var i = 0, ii = childNodes.length; i < ii; ++i) {
        var child = childNodes.item(i);
        var nodeType = child.nodeType;

        //let's track the number of tags of this kind we've seen in the
        //children so far, to build the xpath
        var childNodeName = child.nodeName.toLowerCase();
        if (!(childNodeName in childrenTags))
          childrenTags[childNodeName] = 1;
        else
          childrenTags[childNodeName] += 1;

        if (nodeType === 1) { // nodeType is "Element" (1)
          if (!(childNodeName in ignoreTags)) {
            var newPath = xpath + '/' + childNodeName + '[' +
                          childrenTags[childNodeName] + ']';
            var child = cloneNode(child, newPath, false, []); 
            children.push(child);
          }
        }
      }
    }
    return returnVal;
  }

  function cloneBranch(node) {
    var path = [];
    var props = ['className', 'id'] 
    while (node != null) {
      path.push(cloneNode(node, nodeToXPath(node), true, props));
      node = node.parentElement;
    }
    return path.reverse();
  }

  function cloneSubtree(node, xpath) {
    var nodeName = node.nodeName.toLowerCase();
    var returnVal = cloneNode(node, xpath, false, 'all');

    var childNodes = node.childNodes;
    var children = [];
    returnVal.children = children;

    var childrenTags = {};
    for (var i = 0, ii = childNodes.length; i < ii; ++i) {
      var child = childNodes.item(i);
      var nodeType = child.nodeType;

      //let's track the number of tags of this kind we've seen in the
      //children so far, to build the xpath
      var childNodeName = child.nodeName.toLowerCase();
      if (!(childNodeName in childrenTags))
        childrenTags[childNodeName] = 1;
      else
        childrenTags[childNodeName] += 1;

      if (nodeType === 3) { // nodeType is "Text" (3)
        var value = child.nodeValue.trim();
        if (value)
          children.push({text: value, type: 'text'});
      } else if (nodeType === 1) { // nodeType is "Element" (1)
        if (!(childNodeName in ignoreTags) &&
            !child.classList.contains('replayStatus')) {

          var newPath = xpath + '/' + childNodeName + '[' +
                        childrenTags[childNodeName] + ']';
          var child = cloneSubtree(child, newPath);
          children.push(child);
        }
      }
    }

    return returnVal;
  }

  function findCloneBody(node) {
    var nodeName = node.nodeName.toLowerCase();
    if (nodeName == 'body') {
      var objTree = cloneSubtree(node, 'html/body[1]');
      return objTree;
    }

    if (node.hasChildNodes()) {
      var childNodes = node.childNodes;
      for (var i = 0, ii = childNodes.length; i < ii; ++i) {
        var child = childNodes.item(i);
        var ret = findCloneBody(child);
        if (ret)
          return ret;
      }
    }
    return null;
  }

  snapshot = function() {
    return findCloneBody(document);
  };

  snapshotNode = function(node) {
    if (!node)
      return null;

    var objTree = cloneNode(node, nodeToXPath(node), false, 'all');
    return objTree;
  };

  snapshotBranch = cloneBranch;

})();

/******* TARGET SAVING code *********/

var saveTargetInfo;

(function() {

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

  saveTargetInfo = function _saveTargetInfo(target) {
    var targetInfo = {};
    targetInfo.xpath = nodeToXPath(target);
    targetInfo.snapshot = snapshotNode(target);
    //targetInfo.branch = snapshotBranch(target);
    return JSON.stringify(targetInfo);
  };

})()

//iMacros

var saveTargetInfoForIMacros = function(target){
    var targetInfo = {};
    targetInfo.nodeName = target.nodeName;
    targetInfo.textContent = target.textContent;
    var ls = document.querySelectorAll(targetInfo.nodeName);
    var textMatchCount = 0;
    for (var i = 0; i<ls.length; i++){
        var node = ls[i];
        if (node.textContent == targetInfo.textContent){
           textMatchCount ++;
           if (node == target){
              targetInfo.pos = textMatchCount;
              break;
           }
        }
    }
    return JSON.stringify(targetInfo);
};

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
	  if (nodes == null){
	     return null;
	  }
	  //if we don't successfully find nodes, let's alert
	  if (nodes.length != 1)
	    return null;

	  if (nodes.length >= 1)
	    return nodes[0];
	  else
	    return null;
	}

 var all_features = ["tag", "class", "id",
 "left", "top", "width", "height",
 "font-size", "font-family", "font-style", "font-weight", "color",
 "background-color", "background-image", "opacity", "z-index",
 "preceding-text",
 "xpath"];

 function getFeature(element, feature){
  if (feature === "xpath"){
    return nodeToXPath(element);
  }
  else if (feature === "id"){
    return element.id;
  }
  else if (feature === "preceding-text"){
    return $(element).prev().text();
  }
  else if (_.contains(["tag","class"],feature)){
    return element[feature+"Name"];
  }
  else if (_.contains(["top", "right", "bottom", "left", "width", "height"], feature)){
    var rect = element.getBoundingClientRect();
    return rect[feature];
  }
  else{
    var style = window.getComputedStyle(element, null);
    return style.getPropertyValue(feature);
  }
}

 function getFeatures(element){
   	var info = {};
   	info.xpath = nodeToXPath(element);
	for (var prop in element) {
	  if (element.hasOwnProperty(prop)) {
	    info[prop] = element.prop;
	  }
	}
	var prev = element.previousElementSibling;
	if (prev){
		info.previousElementSiblingText = prev.innerText;
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


function saveTargetInfoForSimilarityApproach(node){
    var targetInfo = {};
    for (var feature in all_features){
      var value = getFeature(node,feature);
      targetInfo[feature] = value;
    }
    return JSON.stringify(targetInfo);
}

function saveTargetInfoForSimilarityApproach2(node){
    var targetInfo = getFeatures(node);
    return JSON.stringify(targetInfo);
}

function getAllCandidates(){
  return document.getElementsByTagName("*");
}

 function getFeatures(element){
   	var info = {};
   	info.xpath = nodeToXPath(element);
	for (var prop in element) {
	  if (element.hasOwnProperty(prop)) {
	    info[prop] = element.prop;
	  }
	}
	var prev = element.previousElementSibling;
	if (prev){
		info.previousElementSiblingText = prev.innerText;
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

  getTargetForSimilarity = function(targetInfo) {
    var candidates = getAllCandidates();
    var bestScore = -1;
    var bestNode = null;
    for (var i = 0; i<candidates.length; i++){
	var info = getFeatures(candidates[i]);
	var similarityCount = 0;
	for (var prop in targetInfo) {
	  if (targetInfo.hasOwnProperty(prop)) {
	    if (targetInfo[prop] === info[prop]){
              similarityCount += 1;
	    }
	  }
	}
	if (similarityCount > bestScore){
	  bestScore = similarityCount;
	  bestNode = candidates[i];
	}
    }
    return bestNode;
  };

var func_d1 = function(url,xpath,url1,url2,targetInfoString,iMacrosTargetInfoString,similarityInfoString){
	var targetInfo = JSON.parse(similarityInfoString);
	var target = getTargetForSimilarity(targetInfo);
	if (target == null) { return; } //won't click, so we'll get that the url is the same as the original
	simulateClick(target);
};

var getInfo = function(event){
    var node = event.target;
	useInfo(saveTargetInfoForSimilarityApproach2(node));
};

var elements = document.getElementsByTagName("*");
for (var i = 0; i<elements.length; i++){
  var element = elements[i];
  element.addEventListener("click", getInfo);
}

var useInfo = function(similarityInfoString){
    console.log(similarityInfoString);
	var targetInfo = JSON.parse(similarityInfoString);
	var target = getTargetForSimilarity(targetInfo);
	console.log(target);
};