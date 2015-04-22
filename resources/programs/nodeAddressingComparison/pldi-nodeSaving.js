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

//ATA-QV

var saveTargetInfoForATAQV = function(target){
	//console.log("saveTargetInfoForATAQV");
    var label = getLabel(target);
    ////////console.log("label", label);

    var nodes = getnodesWithLabelInSubtree(label,$("html"));
    ////console.log("*******************");
    ////console.log(nodes);
    ////console.log("*******************");

    if (nodes.length === 1){
    	////////console.log("just one node with this label!");
    	return JSON.stringify({"l":label,"a":[]});
    }
    ////////console.log(nodes.length, "nodes with this label");
    
    //must find anchors

    
    var t_i = subtreeThatLacksOtherInstancesOfNodeLabel(target);
    var t_others = [];
    for (var i = 0; i <nodes.length; i++){
    	if(nodes[i] === target){
    		////console.log("Good, we found the original node using our label.");
    	}
    	else{
    		var new_t_other = subtreeThatHasNodeLacksNode(nodes[i],target);
    		t_others.push(new_t_other);
    		////console.log("new t_other", new_t_other, "for nodes[i]", nodes[i]);
    	}
    }
    
    var anchors = [];
    while (t_others.length > 0){
    	var distinguishing_label = getDistinguishingLabel(t_i,t_others);
    	if (distinguishing_label !== null){
    		anchors.push(distinguishing_label);
    		return JSON.stringify({"l":label,"a":anchors});
    	}
    	
    	//didn't find anchor.  must continue
    	var dict = findClosestSubtrees(t_i, t_others); //multiple subtrees
    	var t_cl = dict.subtrees;
    	distinguishing_label = getDistinguishingLabel(t_i,t_cl);
    	if (distinguishing_label === null){
    		//give up
    		////console.log("weren't able to find a label that distinguishes t_i from t_cl");
    		////console.log("t_i", t_i);
    		////console.log("t_cl", t_cl);
    		return JSON.stringify({"l":label,"a":null});
    	}
    	////////console.log("found a distinguishing label for t_cl", distinguishing_label);
    	////////console.log("t_i", t_i);
    	////////console.log("t_cl", t_cl);
    	anchors.push(distinguishing_label);
    	
    	t_i = dict.parent;
    	var new_t_others = [];
    	for (var j = 0; j<t_others.length; j++){
    		var include = true;
	    	for (var i = 0; i<t_cl.length; i++){
	    		if (t_others[j].is(t_cl[i])){
	    			include = false;
	    		}
	    	}
	    	if (include){
	    		new_t_others.push(t_others[j]);
	    	}
	    }
	    t_others = new_t_others;
	    ////////console.log("new_t_others", new_t_others);
    	
    }
    
    ////console.log("t_others empty and still no luck");
    return JSON.stringify({"l":label,"a":null});
};

var findClosestSubtrees = function(t_i, t_others){
	////////console.log("findClosestSubtrees");
	var currentNode = t_i;
	while(true){
		var parent = currentNode.parent();
		var descendants = parent.find("*");
		descendants.push(parent);
		var subtrees = [];
		for (var i = 0; i<descendants.length; i++){
			var d = descendants[i];
			for (var j = 0; j<t_others.length; j++){
				if (t_others[j].is(d)){
					subtrees.push(d);
				}
			}
		}
		if (subtrees.length > 0){
			return {"parent":parent,"subtrees":subtrees};
		}
		currentNode = parent;
	}
};

var getDistinguishingLabel = function(t_i,t_others){
	////////console.log(getDistinguishingLabel);
	var nodes = $.makeArray(t_i.find("*"));
	nodes.push(t_i.get(0));
	var candidates = [];
	for (var i = 0; i<nodes.length; i++){
		//console.log("nodes[i]", nodes[i]);
		candidates.push(getLabel(nodes[i]));
	}
	////console.log("candidates", candidates);
	
	labels_to_avoid = [];
	////////console.log("t_others", t_others);
	for (var i = 0; i<t_others.length; i++){
		//////////console.log(t_others[i]);
		var bad_nodes = $.makeArray($(t_others[i]).find("*"));
		//////console.log(t_others);
		if (t_others[i].get){bad_nodes.push(t_others[i].get(0));} else {bad_nodes.push(t_others[i]);}
		//////////console.log("bad_nodes", bad_nodes);
		for (var j = 0; j<bad_nodes.length; j++){
			//console.log("bad_nodes[j]", bad_nodes[j]);
			var lta = getLabel(bad_nodes[j]);
			labels_to_avoid.push(lta);
		}
	}
	////console.log("labels_to_avoid", labels_to_avoid);
	
	filtered_candidates = [];
	for (var i = 0; i<candidates.length; i++){
		if (labels_to_avoid.indexOf(candidates[i]) === -1){
			filtered_candidates.push(candidates[i]);
		}
	}
	if (filtered_candidates.length === 0){
		return null;
	}
	for (var i = 0; i<filtered_candidates.length; i++){
		var c = filtered_candidates[i];
		if (c.indexOf("textContent") > -1){ //prefer ones that are text content instead of node name
			return c;
		}
	}
	return filtered_candidates[0];
};


var subtreeThatHasNodeLacksNode = function(node1,node2){
	////////console.log("subtreeThatHasNodeLacksNode");
    var currentSubtree = $(node1);
    var $node2 = $(node2)
    counter = 0;
	while(counter < 50 && true){
		counter ++;
		var parent = currentSubtree.parent();
		////////console.log("parent in subtreeThatHasNodeLacksNode", parent);
		var descendants = parent.find("*");
		for (var i = 0; i< descendants.length ; i++){
			if ($node2.is(descendants[i])){
				////////console.log("Good, we found the other label.");
				return currentSubtree;
			}
		}
		currentSubtree  = parent;
	}
};

var subtreeThatLacksOtherInstancesOfNodeLabel = function(node){
	var $body = $("body");
	//console.log("subtreeThatLacksOtherInstancesOfNodeLabel");
	var l = getLabel(node);
	var currentSubtree = $(node);
	counter = 0;
	while(true){
		counter ++;
		var parent = currentSubtree.parent();
		if (parent.is($body)){
			return parent;
		}
		////////console.log("parent in subtreeThatLacksOtherInstancesOfNodeLabel", parent);
		var descendants = parent.find("*");
		var l_count = 0;
		for (var i = 0; i<descendants.length; i++){
			//console.log("descendants[i]");
			if (getLabel(descendants[i])===l){
				l_count += 1;
				if (l_count > 1){
					return currentSubtree;
				}
			}
		}
		currentSubtree = parent;
	}
};

var getLabel = function(node){
	//////console.log(node);
    var numChildren = node.childNodes.length;
    var label = node.nodeName+"*****nodeName";
    //if no children, we can use the text content...
    if (numChildren === 1 && node.childNodes[0].nodeName === "#text"){
	    var text = node.textContent;
	    if (text !== "" && text !== undefined){
	    	label = text+"*****textContent";
	    }
    }
    return label;
};

var getnodesWithLabelInSubtree = function(label,root){
	////////console.log("getnodesWithLabelInSubtree");
	var ls = [];
	var arr = label.split("*****");
	var finder = arr[0];
	var tp = arr[1];
	////////console.log("finder", finder);
	if (tp === "nodeName"){
		////////console.log("using nodeName");
		ls = root.find(finder);
		////////console.log(ls);
	}
	else{
		////////console.log("using textContent");
		var nodes = root.find("*");
      nodes.push(root.get(0)); //also include the root itself
    	for (var i = 0; i< nodes.length; i++){
    		//console.log("in getNodesWithLabelInSubtree", nodes[i]);
    		if (getLabel(nodes[i]) === label){
    			ls.push(nodes[i]);
    		}
    	}
	}
	////////console.log("ls", ls);
	return ls;
};

var getTargetForATAQV = function(targetInfo){
	////////console.log("getTargetForATAQV");
	////////console.log(targetInfo);
	var label = targetInfo.l;
	var anchors = targetInfo.a;
	////////console.log("anchors", anchors);
	var currentNode = $("html");
	while(true){
	
		//first let's short circuit this if the current node has 0 or 1 possible options for us
		var candidates = getnodesWithLabelInSubtree(label,currentNode);
		if (candidates.length === 0){
			return null;
		}
		if (candidates.length === 1 || anchors === null){
			return candidates[0];
		}
	
		var children = currentNode.children();
		var foundChild = false;
		for (var i = 0; i<children.length; i++){
			var child = children[i];
			////////console.log(child);
			var descendants = $(child).find("*");
			descendants.push(child);
			var labels = [];
			for (var j = 0; j<descendants.length; j++){
				//console.log("descendants[j]");
				var l1 = getLabel(descendants[j]);
				labels.push(l1);
			}

			if (labels.indexOf(label) === -1){
				continue;
			}
			var useThisChild = true;
			for (var j = 0; j< anchors.length; j++){
				////////console.log("anchor", anchors[j], labels.indexOf(anchors[j]));
				if (labels.indexOf(anchors[j]) === -1){
					//this subtree doesn't have all anchors
					////////console.log("Couldn't find this anchor, better move to the next child");
					useThisChild = false;
					break;
				}
			}
			if(!useThisChild){
				continue;
			}
			//if we've made it here, the subtree has all anchors, go down till no one child has all of them
			currentNode = $(child);
			////////console.log("found a child with all", child);
			foundChild = true;
			break;
		}
		//at this point either we found a child with all of them or we know there is no such child
		if(!foundChild){
			//no child with all, time to drop an anchor and try again
			if (anchors.length === 0){
				//well, no more than we can drop, and we don't know a winner
				if (candidates.length > 0){
					return candidates[0]; //just guess
				}
				return null;
			}
			////////console.log("couldn't find a child with all, throw out anchor", anchors[anchors.length-1]);
			anchors = anchors.slice(0,anchors.length-1);
		}
	}
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
	  try{
      var val = element[prop];
      }
    catch(err){
      continue;
    }
	  if (val !== null && typeof val === 'object'){
	      try{
	        val = val.toString(); //sometimes get that toString not allowed
	      }
	      catch(err){
	        continue;
	      }
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

function highlightNode(target, color) {
  $target = $(target);
  var offset = $target.offset();
  var boundingBox = target.getBoundingClientRect();
  var newDiv = $('<div/>');
  newDiv.css('width', boundingBox.width);
  newDiv.css('height', boundingBox.height);
  newDiv.css('top', offset.top);
  newDiv.css('left', offset.left);
  newDiv.css('position', 'absolute');
  newDiv.css('z-index', 1000);
  newDiv.css('background-color', color);
  newDiv.css('opacity', .4);
  newDiv.css('pointer-events', 'none');
  $(document.body).append(newDiv);
  var html = $target.html();
}

var func_a1 = function(urlArg,xpath,url1,url2,rowId){
	var node = xPathToNode(xpath);
	if (node == null) { return; }
	
	highlightNode(node,"#FF00FF");

	return urlArg+"<,>"+rowId+"<,>"+xpath+"<,>"+url1+"<,>"+url2+"<,>"+saveTargetInfo(node)+"<,>"+saveTargetInfoForIMacros(node)+"<,>"+saveTargetInfoForSimilarityApproach2(node)+"<,>"+saveTargetInfoForATAQV(node);
};
