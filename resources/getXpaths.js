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

  saveTargetInfo = function _saveTargetInfo(target) {
    var targetInfo = {};
    targetInfo.xpath = nodeToXPath(target);
    targetInfo.snapshot = snapshotNode(target);
    targetInfo.branch = snapshotBranch(target);
    return JSON.stringify(targetInfo);
  }

})()

/******* TRAVERSAL code *********/

var output = "";
var url = "";
var first = true;
var actualUrl = window.location.href;

function walkTheDOM(node, xpath) {

    if (!first){
    	output+=("@#@"+url+"<,>"+xpath+"<,>"+actualUrl+"<,>"+saveTargetInfo(node));
    	}
    else {
       first = false;
       output+=(url+"<,>"+xpath);
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

var func1 = function(urlArg){
  url = urlArg;
  var element = document.body;
  walkTheDOM(element,"BODY");
  return output;
};
