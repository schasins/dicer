var getTarget;
var getTargetFunction;
var targetFunctions;

(function() {

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
	    getLog('misc').error('xPath throws error when evaluated', xpath);
	  }
	  return [];
	}

	function simpleXPathToNode(xpath) {
	  // error was thrown, attempt to just walk down the dom tree
	  var currentNode = document.documentElement;
	  var paths = xpath.split('/');
	  // assume first path is "HTML"
	  paths: for (var i = 1, ii = paths.length; i < ii; ++i) {
	    var children = currentNode.children;
	    var path = paths[i];
	    var splits = path.split(/\[|\]/);

	    var tag = splits[0];
	    if (splits.length > 1) {
	      var index = parseInt(splits[1]);
	    } else {
	      var index = 1;
	    }

	    var seen = 0;
	    children: for (var j = 0, jj = children.length; j < jj; ++j) {
	      var c = children[j];
	      if (c.tagName == tag) {
		seen++;
		if (seen == index) {
		  currentNode = c;
		  continue paths;
		}
	      }
	    }
	    throw 'Cannot find child';
	  }
	  return [currentNode];
	}

	function xPathToNode(xpath) {
	  var nodes = xPathToNodes(xpath);
	  //if we don't successfully find nodes, let's alert
	  if (nodes.length != 1)
	    getLog('misc').error("xpath doesn't return strictly one node", xpath);

	  if (nodes.length >= 1)
	    return nodes[0];
	  else
	    return null;
	}

  function getTargetSimple(targetInfo) {
    return xPathToNodes(targetInfo.xpath);
  }

  function getTargetSuffix(targetInfo) {

    function helper(xpath) {
      var index = 0;
      while (xpath[index] == '/')
        index++;

      if (index > 0)
        xpath = xpath.slice(index)

      var targets = xPathToNodes('//' + xpath);
   
      if (targets.length > 0) {
        return targets;
      }

      // If we're here, we failed to find the child. Try dropping
      // steadily larger prefixes of the xpath until some portion works.
      // Gives up if only three levels left in xpath.
      if (xpath.split("/").length < 4){
        // No more prefixes to reasonably remove, so give up
        return [];
      }

      var index = xpath.indexOf("/");
      xpathSuffix = xpath.slice(index+1);
      return helper(xpathSuffix);
    }

    return helper(targetInfo.xpath);
  }

  function getTargetText(targetInfo) {
    var text = targetInfo.snapshot.prop.innerText;
    if (text) {
      return xPathToNodes('//*[text()="' + text + '"]');
    }
    return [];
  }

  function getTargetSearch(targetInfo) {
    // search over changes to the ancesters (replacing each ancestor with a
    // star plus changes such as adding or removing ancestors)

    function helper(xpathSplit, index) {
      if (index == 0)
        return [];

      var targets;

      if (index < xpathSplit.length - 1) {
        var clone = xpathSplit.slice(0);
        var xpathPart = clone[index];

        clone[index] = '*';
        targets = xPathToNodes(clone.join('/'));
        if (targets.length > 0)
          return targets;

        clone.splice(index, 0, xpathPart);
        targets = xPathToNodes(clone.join('/'));
        if (targets.length > 0)
          return targets;
      } 

      targets = xPathToNodes(xpathSplit.join('/'));
      if (targets.length > 0)
        return targets;

      return helper(xpathSplit, index - 1);
    }

    var split = targetInfo.xpath.split('/');
    return helper(split, split.length - 1);
  }

  function getTargetClass(targetInfo) {
    var className = targetInfo.snapshot.prop.className;
    if (className) {
      //xPathToNodes("//*[@class='" + className + "']");

      var classes = className.trim().replace(':', '\\:').split(' ');
      var selector = "";
      for (var i = 0, ii = classes.length; i < ii; ++i) {
        var className = classes[i];
        if (className)
          selector += '.' + classes[i];
      }

      return $.makeArray($(selector));
    }
    return [];
  }

  function getTargetId(targetInfo) {
    var id = targetInfo.snapshot.prop.id;
    if (id) {
      var selector = "#" + id.trim().replace(':', '\\:');
      return $.makeArray($(selector));
    }
    return [];
  }

  function getTargetComposite(targetInfo) {
    var targets = [];
    var metaInfo = [];

    for (var strategy in targetFunctions) {
      var strategyTargets = targetFunctions[strategy](targetInfo);
      for (var i = 0, ii = strategyTargets.length; i < ii; ++i) {
        var t = strategyTargets[i];
        var targetIndex = targets.indexOf(t);
        if (targetIndex == -1) {
          targets.push(t);
          metaInfo.push([strategy]);
        } else {
          metaInfo[targetIndex].push(strategy);
        }
      }
    }

    var maxStrategies = 0;
    var maxTargets = [];
    for (var i = 0, ii = targets.length; i < ii; ++i) {
      var numStrategies = metaInfo[i].length;
      if (numStrategies == maxStrategies) {
        maxTargets.push(targets[i]);
      } else if (numStrategies > maxStrategies) {
        maxTargets = [targets[i]];
        maxStrategies = numStrategies;
      }
    }

    return maxTargets;
  }

  getTargetFunction = getTargetComposite;

  getTarget = function(targetInfo) {
    var targets = getTargetFunction(targetInfo);
    if (!targets) {
      log.debug('No target found');
      return null
    } else if (targets.length > 1) {
      log.debug('Multiple targets found:', targets);
      return targets[0];
    } else {
      return targets[0];
    }
  };

  targetFunctions = {
    simple: getTargetSimple,
    suffix: getTargetSuffix,
    text: getTargetText,
    class: getTargetClass,
    id: getTargetId,
    search: getTargetSearch
  }

})()

var func1 = function(targetInfoString){
	var targetInfo = JSON.parse(targetInfoString);
	var target = getTarget(targetInfo);
	$(target).click();
};
