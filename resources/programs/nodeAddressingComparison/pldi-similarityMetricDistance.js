var getTarget;
var getTargetFunction;
var targetFunctions;
var getTargetId;
var getTargetClass;
var xPathToNode;

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
	    //getLog('misc').error('xPath throws error when evaluated', xpath);
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

	xPathToNode = function(xpath) {
	  var nodes = xPathToNodes(xpath);
	  if (nodes == null){
	  	return;
	  }
	  //if we don't successfully find nodes, let's alert
	  if (nodes.length != 1){
	    //getLog('misc').error("xpath doesn't return strictly one node", xpath);
	    }

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

  getTargetClass = function(targetInfo) {
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

      return document.querySelectorAll(selector);
    }
    return [];
  }

  getTargetId = function(targetInfo) {
    var id = targetInfo.snapshot.prop.id;
    if (id) {
      var selector = "#" + id.trim().replace(':', '\\:');
      return document.querySelectorAll(selector);
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

function getAllCandidates(){
  return document.getElementsByTagName("*");
}

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


var getTargetForSimilarityScores = [];

  getTargetForSimilarity = function(targetInfo) {
    var candidates = getAllCandidates();
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
		getTargetForSimilarityScores.push(similarityCount);
		if (similarityCount > bestScore){
		  secondBestScore = bestScore;
		  bestScore = similarityCount;
		  bestNode = candidates[i];
		}
    }
    return bestNode;
  };
  
  var getTargetForSimilarityFilteredScores = [];
  
  getTargetForSimilarityFiltered = function(targetInfo) {
    var unfilteredCandidates = getAllCandidates();
    var targetText = targetInfo.textContent;
    var candidates = [];
    for (var i = 0; i<unfilteredCandidates.length; i++){
    	if (unfilteredCandidates[i].textContent === targetText){
    		candidates.push(unfilteredCandidates[i]);
    	}
    }
    if (candidates.length === 0){
    	//fall back to the normal one that considers all nodes
    	return getTargetForSimilarity(targetInfo);
    }
    
    //otherwise, let's just run similarity on the nodes that have the same text
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
	getTargetForSimilarityFilteredScores.push(similarityCount);
	if (similarityCount > bestScore){
	  bestScore = similarityCount;
	  bestNode = candidates[i];
	}
    }
    return bestNode;
  };
  
  
  var getTargetForSimilarityRegressionScores = [];
  
    var regressionModel = {"accessKey":64002365732.094826,"accessKeyLabel":-64002365732.054405,"align":0.009896603794263,"align-items":-157599379780.11075,"align-self":89999139168.10023,"aLink":-40647087035.58786,"animation-delay":55815637837.229454,"animation-direction":-64965101638.899155,"animation-duration":101305424549.77379,"animation-fill-mode":-35921151471.50015,"animation-iteration-count":-68089560105.86861,"animation-name":-28218292109.590416,"animation-play-state":-32861848690.701527,"animation-timing-function":42119508626.07973,"async":23041867896.324375,"ATTRIBUTE_NODE":80944029739.41895,"attributes":71262152681.24457,"autofocus":-0.117413088973389,"backface-visibility":-31181284508.116425,"background":-61776589470.79199,"background-attachment":-9787896827.478157,"background-clip":0.222220102077922,"background-color":-0.006600678541301,"background-image":-0.004635990411551,"background-origin":7825168453.577034,"background-position":0.070083164498359,"background-repeat":-0.017031237948405,"background-size":0.035827329732475,"baseURI":-22429591605.380352,"bgColor":-0.025506948659369,"border-bottom-color":0.513150939115931,"border-bottom-left-radius":-0.018323375576503,"border-bottom-right-radius":0.004373084796624,"border-bottom-style":-0.268560786047907,"border-bottom-width":0.231668151930292,"border-collapse":-0.014706190230808,"border-image-outset":-61867860286.57954,"border-image-repeat":-31685022551.85422,"border-image-slice":-29819860832.403557,"border-image-source":-15547096761.469738,"border-image-width":-20342682394.84208,"border-left-color":-0.879677118669272,"border-left-style":0.145313782320446,"border-left-width":-0.05314445808698,"border-right-color":-0.365367164860095,"border-right-style":0.072626324252864,"border-right-width":-0.016344264527892,"border-spacing":-0.001492080870665,"border-top-color":0.70065814868989,"border-top-left-radius":-0.02985313740019,"border-top-right-radius":-0.040732652154334,"border-top-style":-0.233256939490766,"border-top-width":0.311661915601085,"bottom":-0.004814424706725,"box-shadow":-0.034182181200421,"caption-side":25922008886.149574,"CDATA_SECTION_NODE":38351153464.21453,"charset":-0.138833270579967,"child0text":0.001886757675149,"child10text":-53726394969.6082,"child11text":63989081459.27572,"child12text":-7008582794.616815,"child13text":1927571123.3715928,"child14text":-3716165859.16187,"child15text":-1369049510.5187907,"child16text":3547488341.873103,"child17text":-2315675328.09329,"child18text":-2216250601.3874645,"child19text":6538310210.78437,"child1text":0.085599033467996,"child20text":-2248126505.5153246,"child2text":0.357841426783378,"child3text":0.195966371358063,"child4text":-0.173865994058966,"child5text":-1.544745813945413,"child6text":-0.056055422350338,"child7text":-1.66925969857308,"child8text":-8117411438.959524,"child9text":9652526802.130941,"childElementCount":-0.023069031080419,"childNodes":6666286962.102886,"children":-18592778370.5919,"classList":-10230426072.137985,"className":10230426072.198284,"clear":0.030889141671635,"clientHeight":-0.026615599085407,"clientLeft":0.009792977512559,"clientTop":-0.141558098646501,"clientWidth":0.011409563830851,"clip":-0.000312635420777,"clip-path":6832670350.179028,"clip-rule":-12244417586.811142,"color":11861342668.725592,"color-interpolation":2952587733.198812,"color-interpolation-filters":-1299388388.93155,"COMMENT_NODE":945546648.9394279,"compact":0.013593040920274,"content":9294515763.060102,"contentEditable":-2299614562.857447,"contextMenu":8112864421.316434,"coords":-5052977271.418707,"counter-increment":-399048674.0570164,"counter-reset":0.116491348799228,"crossOrigin":-0.309077695489466,"cursor":0.02051049215756,"dataset":-3791761984.6874466,"defer":-9457741664.209173,"dir":-0.029022269112707,"direction":0.064372801937337,"disabled":0.208772313704881,"display":0.013653477318833,"DOCUMENT_FRAGMENT_NODE":-6606998492.914267,"DOCUMENT_NODE":-2002196202.9347124,"DOCUMENT_POSITION_CONTAINED_BY":1296355790.4786043,"DOCUMENT_POSITION_CONTAINS":4375547139.963401,"DOCUMENT_POSITION_DISCONNECTED":-1355760605.8334863,"DOCUMENT_POSITION_FOLLOWING":-5156752719.462167,"DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC":244591547.1354246,"DOCUMENT_POSITION_PRECEDING":-2287415589.808956,"DOCUMENT_TYPE_NODE":3969445754.490369,"dominant-baseline":4812520493.803851,"download":7846801743.820249,"draggable":0.016503854278642,"ELEMENT_NODE":-3118327085.5190887,"empty-cells":-1300760792.5797408,"ENTITY_NODE":-814526931.0138518,"ENTITY_REFERENCE_NODE":-2849264336.4736433,"event":-13584126232.487732,"fill":927900593.6203442,"fill-opacity":1559044315.094733,"fill-rule":-2089582880.0645523,"filter":1134491093.356117,"firstChild":-0.017635342478772,"firstElementChild":0.020825289591627,"firstWord":-0.068512789139598,"flex-basis":-1861663558.1105623,"flex-direction":510575827.09241915,"flex-grow":-3395526027.578496,"flex-shrink":854189122.8539504,"float":0.005298845811944,"flood-color":1117860124.141347,"flood-opacity":-1312043605.9883394,"font-family":0.017744629375732,"font-kerning":1388549029.4427228,"font-size":168174457138.85364,"font-size-adjust":-3301860814.440318,"font-stretch":-2110031020.5847452,"font-style":-0.004795791477251,"font-synthesis":-2135834765.1330886,"font-variant":1086313532.0124168,"font-variant-alternates":324024085.25214326,"font-variant-caps":1834457178.8369162,"font-variant-east-asian":1739010044.3936462,"font-variant-ligatures":-1841511183.5088923,"font-variant-numeric":-1447355023.3225658,"font-variant-position":-4540987.986557335,"font-weight":-0.008326233661965,"form":-0.124264028400073,"formAction":-153979613563.76123,"formEnctype":-7679525947.157045,"formMethod":54620122685.96703,"formNoValidate":52989594703.16582,"formTarget":54049422121.70024,"hash":-0.075588834654972,"height":-0.001399924270896,"hidden":-2910586592.232741,"host":6357941389.926973,"hostname":-6357941389.916438,"href":0.082614953538651,"hreflang":-762580895.2069879,"htmlFor":0.159150488597135,"id":0.013539767327577,"image-rendering":-1058818742.3891959,"ime-mode":0.051120291473701,"innerHTML":0.190479145834219,"isContentEditable":-2228810400.628753,"itemId":372381162.1213326,"itemProp":644345265.1177393,"itemRef":1009641411.498213,"itemScope":-432473765.4657518,"itemType":-253622215.75296068,"itemValue":624288082.0168165,"justify-content":-286769184.6822972,"lang":-0.031335082222567,"lastChild":-0.020259276678595,"lastChild10text":-9652526802.067968,"lastChild11text":53726394969.557785,"lastChild12text":-63989081459.12004,"lastChild13text":7008582794.462509,"lastChild14text":-1927571123.3084927,"lastChild15text":3716165859.097483,"lastChild16text":1369049510.5282214,"lastChild17text":-3547488341.8863416,"lastChild18text":2315675328.132325,"lastChild19text":2216250601.326374,"lastChild1text":0.11041357545533,"lastChild20text":-6538310210.771236,"lastChild21text":2248126505.532262,"lastChild2text":-0.084733200323269,"lastChild3text":-0.369076475300363,"lastChild4text":-0.175750152075058,"lastChild5text":0.135660070243477,"lastChild6text":1.529231960209969,"lastChild7text":0.062805024351003,"lastChild8text":1.699399052351392,"lastChild9text":8117411438.937621,"lastElementChild":0.015960410150124,"lastWord":0.062281122427613,"left":0.001966581299805,"letter-spacing":-0.052978254122221,"lighting-color":101290252.27190988,"line-height":-0.001123463199137,"link":9480687489.415182,"list-style-image":-38531999.9050376,"list-style-position":86705592.90745711,"list-style-type":0.00609417042302,"localName":-2044834663.1015892,"margin-bottom":-0.012749535969678,"margin-left":-0.018161068986188,"margin-right":-0.014760283882871,"margin-top":0.047145724264318,"marker-end":-301627257.1780774,"marker-mid":-231199315.70617455,"marker-offset":280712604.0672959,"marker-start":-141598325.56288865,"mask":-0.000087863431988,"mask-type":-0.000017230142058,"max-height":-0.049601982796442,"max-width":0.002709181756569,"min-height":-0.049259495884206,"min-width":-0.102337140065755,"-moz-appearance":0.273080597943694,"-moz-background-inline-policy":0.000009051343014,"-moz-binding":-0.394472076124914,"-moz-border-bottom-colors":0.000065843936271,"-moz-border-left-colors":-0.000026055531287,"-moz-border-right-colors":0.00000451802064,"-moz-border-top-colors":0.000012802380113,"-moz-box-align":0.000022890320646,"-moz-box-direction":-0.000011740428933,"-moz-box-flex":0.000009681679273,"-moz-box-ordinal-group":-0.000006355924421,"-moz-box-orient":-0.000022225596772,"-moz-box-pack":-0.000026737986525,"-moz-box-sizing":0.019136056580371,"-moz-column-count":3.91609568e-7,"-moz-column-fill":-2.95746093e-7,"-moz-column-gap":-168174457138.84735,"-moz-column-rule-color":-11861342666.492905,"-moz-column-rule-style":-2.37336e-9,"-moz-column-rule-width":4.8212e-11,"-moz-column-width":-1.01197e-10,"-moz-float-edge":0.071822974624992,"-moz-font-feature-settings":1.51e-13,"-moz-font-language-override":1.6e-14,"-moz-force-broken-image-icon":0.112069908175842,"-moz-hyphens":0,"-moz-image-region":0,"-moz-orient":0,"-moz-osx-font-smoothing":0,"-moz-outline-radius-bottomleft":0,"-moz-outline-radius-bottomright":0,"-moz-outline-radius-topleft":0,"-moz-outline-radius-topright":0,"-moz-stack-sizing":0,"-moz-tab-size":0,"-moz-text-align-last":0,"-moz-text-blink":0,"-moz-text-decoration-color":-2.119475228063619,"-moz-text-decoration-line":0.01368674906268,"-moz-text-decoration-style":0,"-moz-text-size-adjust":0,"-moz-user-focus":0,"-moz-user-input":0,"-moz-user-modify":-0.042614022012289,"-moz-user-select":-0.079717173156899,"-moz-window-shadow":0,"name":0.001010466979742,"namespaceURI":0,"nextElementSibling":0.014182896333873,"nextSibling":0.018424728653151,"nodeName":2382535740.4787974,"nodeType":0,"nodeValue":0,"NOTATION_NODE":0,"offsetHeight":-0.0048870966671,"offsetLeft":0.023881957289713,"offsetParent":-0.012541512155385,"offsetTop":0.003435015205625,"offsetWidth":-0.054300645634729,"onabort":0,"onafterprint":9286975922.384165,"onbeforeprint":9286975922.384165,"onbeforeunload":0.00659435232148,"onblur":0.368462506281814,"oncanplay":0,"oncanplaythrough":0,"onchange":-0.199101895120535,"onclick":0.051160888318978,"oncontextmenu":0,"oncopy":0,"oncut":0,"ondblclick":0,"ondrag":0,"ondragend":0,"ondragenter":0,"ondragleave":0,"ondragover":0,"ondragstart":0,"ondrop":0,"ondurationchange":0,"onemptied":0,"onended":0,"onerror":0.095880141348308,"onfocus":-0.361925981876336,"onhashchange":9286975922.384165,"oninput":0,"oninvalid":0,"onkeydown":0,"onkeypress":0,"onkeyup":0,"onload":0.139760279389522,"onloadeddata":0,"onloadedmetadata":0,"onloadstart":0,"onmessage":9286975922.384165,"onmousedown":-0.336736572398614,"onmouseenter":0,"onmouseleave":0,"onmousemove":0,"onmouseout":-0.050208277807793,"onmouseover":-0.027696007131215,"onmouseup":0,"onmozfullscreenchange":0,"onmozfullscreenerror":0,"onmozpointerlockchange":0,"onmozpointerlockerror":0,"onoffline":9286975922.384165,"ononline":9286975922.384165,"onpagehide":9286975922.384165,"onpageshow":9286975922.384165,"onpaste":0,"onpause":0,"onplay":0,"onplaying":0,"onpopstate":9286975922.384165,"onprogress":0,"onratechange":0,"onreset":0,"onresize":9286975922.384165,"onscroll":0,"onseeked":0,"onseeking":0,"onselect":0,"onshow":0,"onstalled":0,"onsubmit":0.028189486734803,"onsuspend":0,"ontimeupdate":0,"onunload":0.096139891502051,"onvolumechange":0,"onwaiting":0,"onwheel":0,"opacity":-0.025288844533926,"order":0,"outerHTML":34.21400512809163,"outline-color":-0.012933050184433,"outline-offset":-0.096230863091645,"outline-style":-84032721.1116311,"outline-width":84032721.11561514,"overflow":0.112293609052449,"overflow-x":-0.070665652884281,"overflow-y":-0.051809097723227,"ownerDocument":0,"padding-bottom":0.004280860579451,"padding-left":-0.011840712994519,"padding-right":0.004723611691093,"padding-top":-0.012689421002134,"page-break-after":0,"page-break-before":0,"page-break-inside":0,"paint-order":0,"parentElement":-1531428822.9523637,"parentNode":1531428823.0819595,"pathname":-0.200874506438046,"perspective":0,"perspective-origin":-0.073304650953627,"ping":-1396912236.114297,"pointer-events":0,"port":-0.119554545491812,"position":0.004744114547252,"preColonText":-0.000662526304086,"prefix":0,"previousElementSibling":-0.199991717961325,"previousElementSiblingText":0.216236331307723,"previousSibling":0.001501634246868,"PROCESSING_INSTRUCTION_NODE":0,"properties":0,"protocol":-0.095623438438292,"quotes":0,"rel":-0.09192861552437,"resize":0,"rev":762580895.376225,"right":-0.001367781220337,"scrollHeight":0.006148209034701,"scrollLeft":-0.077643145827173,"scrollLeftMax":0.021528492002133,"scrollTop":-0.078289233391994,"scrollTopMax":0.001320958512346,"scrollWidth":0.012836311535119,"search":0.018097709736064,"shape":-1396912236.114297,"shape-rendering":0,"spellcheck":0.148621741017967,"src":0.392788938086758,"stop-color":0,"stop-opacity":0,"stroke":0,"stroke-dasharray":0,"stroke-dashoffset":0,"stroke-linecap":0,"stroke-linejoin":0,"stroke-miterlimit":0,"stroke-opacity":0,"stroke-width":0,"style":0,"tabIndex":0.0199740267626,"table-layout":0.030814783199041,"tagName":-337701077.32162064,"target":-0.007228521404635,"text":0.284267439072335,"text-align":0.011611314246632,"text-anchor":0,"textContent":0.039174657583334,"text-decoration":0.035183029172855,"text-indent":-0.00064838425478,"TEXT_NODE":0,"text-overflow":0.001209586181745,"text-rendering":0.038691957563666,"text-shadow":-0.024265142922837,"text-transform":-0.037114161305109,"title":0.00492150046048,"top":0.014865389707824,"transform":-0.067411578913306,"transform-origin":0.178994633843855,"transform-style":0,"transition-delay":-0.013497222031834,"transition-duration":-0.033976776809846,"transition-property":0.083381462388871,"transition-timing-function":-0.00678171934499,"type":-0.009113809258838,"unicode-bidi":-0.013636236702428,"validationMessage":-2598135154.0687666,"validity":2598135153.8545284,"value":-0.005684622557731,"vector-effect":0,"vertical-align":0.008988241223848,"visibility":0.019989161597135,"vLink":73229792.97401854,"white-space":-0.006946539891993,"width":0.017241995054626,"willValidate":0.156589009365214,"word-break":0,"word-spacing":0.051196256242144,"word-wrap":0.015504633829854,"writing-mode":0,"xpath":51.03479792589054,"z-index":-0.013466299620323};
  var regressionIntercept = 123176694229.372024536132812;
  
  getTargetForSimilarityRegression = function(targetInfo) {
    var candidates = getAllCandidates();
    var bestScore = -10000000000000000000000000;
    var bestNode = null;
    for (var i = 0; i<candidates.length; i++){
	var info = getFeatures(candidates[i]);
	var score = regressionIntercept;
	for (var prop in targetInfo) {
	  if (targetInfo.hasOwnProperty(prop)) {
	    if (targetInfo[prop] === info[prop] && (prop in regressionModel)){
              score += regressionModel[prop]; //just 1s and 0s so no need to actually multiply
	    }
	  }
	}
	getTargetForSimilarityRegressionScores.push(score);
	if (score > bestScore){
	  bestScore = score;
	  bestNode = candidates[i];
	}
    }
    return bestNode;
  };
  
  
  var getTargetForSimilaritySVMScores = [];
  
  var svmModel = {"accessKey":1.35e-13,"accessKeyLabel":1.35e-13,"align":0.024284202402121,"align-items":1.35e-13,"align-self":1.35e-13,"aLink":1.35e-13,"animation-delay":1.35e-13,"animation-direction":1.35e-13,"animation-duration":1.35e-13,"animation-fill-mode":1.35e-13,"animation-iteration-count":1.35e-13,"animation-name":1.35e-13,"animation-play-state":1.35e-13,"animation-timing-function":1.35e-13,"async":1.35e-13,"ATTRIBUTE_NODE":1.35e-13,"attributes":1.35e-13,"autofocus":-0.062077409203404,"backface-visibility":1.35e-13,"background":1.35e-13,"background-attachment":1.35e-13,"background-clip":0.126253716117979,"background-color":-0.059383016438325,"background-image":0.106914770518095,"background-origin":1.35e-13,"background-position":0.137577474667644,"background-repeat":-0.103334064260345,"background-size":0.031701877352496,"baseURI":1.35e-13,"bgColor":0.324363842549836,"border-bottom-color":0.071231909344872,"border-bottom-left-radius":0.11751198712377,"border-bottom-right-radius":0.00853336884861,"border-bottom-style":-0.198915088896776,"border-bottom-width":0.27772606765793,"border-collapse":-0.212065069750544,"border-image-outset":1.35e-13,"border-image-repeat":1.35e-13,"border-image-slice":1.35e-13,"border-image-source":1.35e-13,"border-image-width":1.35e-13,"border-left-color":-0.144083975869309,"border-left-style":0.23893264698463,"border-left-width":-0.127509844985845,"border-right-color":0.152768090024777,"border-right-style":-0.130130882187466,"border-right-width":-0.272233658846169,"border-spacing":-0.095706191386263,"border-top-color":-0.145453687699503,"border-top-left-radius":0.084470968155209,"border-top-right-radius":-0.024507650119951,"border-top-style":0.081464880469092,"border-top-width":0.21976681581841,"bottom":0.015650672589798,"box-shadow":-0.182620312932023,"caption-side":1.35e-13,"CDATA_SECTION_NODE":1.35e-13,"charset":-0.001382929114129,"child0text":0.08032695906263,"child10text":0.094113532481195,"child11text":-0.017027291249043,"child12text":-0.017027291249043,"child13text":-0.017027291249043,"child14text":-0.017027291249043,"child15text":-0.017027291249043,"child16text":-0.017027291249043,"child17text":-0.017027291249043,"child18text":-0.017027291249043,"child19text":-0.017027291249043,"child1text":0.19331328549584,"child20text":-0.017027291249043,"child2text":0.570033252107471,"child3text":0.551207436363619,"child4text":-0.383356500762012,"child5text":-0.075979288315104,"child6text":0.050277811868362,"child7text":-0.44083170183044,"child8text":0.15495464495384,"child9text":-0.062199237640336,"childElementCount":-0.075792054417434,"childNodes":1.35e-13,"children":1.35e-13,"classList":-0.048334977947427,"className":-0.048334977947427,"clear":-0.003189572183921,"clientHeight":0.126747060526895,"clientLeft":0.27924355097857,"clientTop":-0.049321019965511,"clientWidth":0.025391069257351,"clip":0.172024390133309,"clip-path":1.35e-13,"clip-rule":1.35e-13,"color":0.359760869234149,"color-interpolation":1.35e-13,"color-interpolation-filters":1.35e-13,"COMMENT_NODE":1.35e-13,"compact":0.026347671968686,"content":1.35e-13,"contentEditable":1.35e-13,"contextMenu":1.35e-13,"coords":0.030477439224001,"counter-increment":1.35e-13,"counter-reset":0.301634119500385,"crossOrigin":-0.944898143600859,"cursor":0.127344717036429,"dataset":1.35e-13,"defer":1.35e-13,"dir":-0.3236597137196,"direction":0.301847758803795,"disabled":0.56412341769137,"display":-0.078793880857463,"DOCUMENT_FRAGMENT_NODE":1.35e-13,"DOCUMENT_NODE":1.35e-13,"DOCUMENT_POSITION_CONTAINED_BY":1.35e-13,"DOCUMENT_POSITION_CONTAINS":1.35e-13,"DOCUMENT_POSITION_DISCONNECTED":1.35e-13,"DOCUMENT_POSITION_FOLLOWING":1.35e-13,"DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC":1.35e-13,"DOCUMENT_POSITION_PRECEDING":1.35e-13,"DOCUMENT_TYPE_NODE":1.35e-13,"dominant-baseline":1.35e-13,"download":0.030477439224001,"draggable":0.005662318454483,"ELEMENT_NODE":1.35e-13,"empty-cells":1.35e-13,"ENTITY_NODE":1.35e-13,"ENTITY_REFERENCE_NODE":1.35e-13,"event":1.35e-13,"fill":1.35e-13,"fill-opacity":1.35e-13,"fill-rule":1.35e-13,"filter":1.35e-13,"firstChild":-0.06184550734951,"firstElementChild":0.041728730217642,"firstWord":0.035173907884996,"flex-basis":1.35e-13,"flex-direction":1.35e-13,"flex-grow":1.35e-13,"flex-shrink":1.35e-13,"float":0.001777491501933,"flood-color":1.35e-13,"flood-opacity":1.35e-13,"font-family":0.113273308715996,"font-kerning":1.35e-13,"font-size":0.027875889147024,"font-size-adjust":1.35e-13,"font-stretch":1.35e-13,"font-style":-0.019493392849064,"font-synthesis":1.35e-13,"font-variant":1.35e-13,"font-variant-alternates":1.35e-13,"font-variant-caps":1.35e-13,"font-variant-east-asian":1.35e-13,"font-variant-ligatures":1.35e-13,"font-variant-numeric":1.35e-13,"font-variant-position":1.35e-13,"font-weight":0.043028204473897,"form":0.028443028082073,"formAction":-0.062077409203404,"formEnctype":-0.062077409203404,"formMethod":-0.062077409203404,"formNoValidate":-0.062077409203404,"formTarget":-0.062077409203404,"hash":-0.26179993699327,"height":0.075273204615314,"hidden":1.35e-13,"host":0.160735602952968,"hostname":0.160735602952968,"href":0.180084827300398,"hreflang":-0.001382929114129,"htmlFor":0.049716664734341,"id":0.357436770177749,"image-rendering":1.35e-13,"ime-mode":1.35e-13,"innerHTML":0.419769193970579,"isContentEditable":1.35e-13,"itemId":1.35e-13,"itemProp":1.35e-13,"itemRef":1.35e-13,"itemScope":1.35e-13,"itemType":1.35e-13,"itemValue":1.35e-13,"justify-content":1.35e-13,"lang":-0.46238976530649,"lastChild":-0.122307885496177,"lastChild10text":-0.062199237640336,"lastChild11text":0.094113532481195,"lastChild12text":-0.017027291249043,"lastChild13text":-0.017027291249043,"lastChild14text":-0.017027291249043,"lastChild15text":-0.017027291249043,"lastChild16text":-0.017027291249043,"lastChild17text":-0.017027291249043,"lastChild18text":-0.017027291249043,"lastChild19text":-0.017027291249043,"lastChild1text":0.132466889812802,"lastChild20text":-0.017027291249043,"lastChild21text":-0.017027291249043,"lastChild2text":-0.215970516029749,"lastChild3text":-0.462782581857816,"lastChild4text":-0.4364796842709,"lastChild5text":0.383225082580473,"lastChild6text":-0.04736072646606,"lastChild7text":0.050277811868362,"lastChild8text":0.526568372143309,"lastChild9text":0.15495464495384,"lastElementChild":0.025309825765476,"lastWord":-0.028246551057466,"left":-0.030754448433642,"letter-spacing":0.037741530431184,"lighting-color":1.35e-13,"line-height":-0.078044355130148,"link":1.35e-13,"list-style-image":1.35e-13,"list-style-position":1.35e-13,"list-style-type":0.5004162998654,"localName":-0.029235882243597,"margin-bottom":-0.077688142232866,"margin-left":-0.016896693030368,"margin-right":0.0049079004433,"margin-top":0.046954136782368,"marker-end":1.35e-13,"marker-mid":1.35e-13,"marker-offset":1.35e-13,"marker-start":1.35e-13,"mask":1.35e-13,"mask-type":1.35e-13,"max-height":-0.167487488604912,"max-width":0.095395332255883,"min-height":0.072172679127696,"min-width":-0.176120977596476,"-moz-appearance":-0.062077409203404,"-moz-background-inline-policy":1.35e-13,"-moz-binding":0.034528315537635,"-moz-border-bottom-colors":1.35e-13,"-moz-border-left-colors":1.35e-13,"-moz-border-right-colors":1.35e-13,"-moz-border-top-colors":1.35e-13,"-moz-box-align":1.35e-13,"-moz-box-direction":1.35e-13,"-moz-box-flex":1.35e-13,"-moz-box-ordinal-group":1.35e-13,"-moz-box-orient":1.35e-13,"-moz-box-pack":1.35e-13,"-moz-box-sizing":-0.015786548256393,"-moz-column-count":1.35e-13,"-moz-column-fill":1.35e-13,"-moz-column-gap":0.027875889147024,"-moz-column-rule-color":0.359760869234149,"-moz-column-rule-style":1.35e-13,"-moz-column-rule-width":1.35e-13,"-moz-column-width":1.35e-13,"-moz-float-edge":1.35e-13,"-moz-font-feature-settings":1.35e-13,"-moz-font-language-override":1.35e-13,"-moz-force-broken-image-icon":1.35e-13,"-moz-hyphens":1.35e-13,"-moz-image-region":1.35e-13,"-moz-orient":1.35e-13,"-moz-osx-font-smoothing":1.35e-13,"-moz-outline-radius-bottomleft":1.35e-13,"-moz-outline-radius-bottomright":1.35e-13,"-moz-outline-radius-topleft":1.35e-13,"-moz-outline-radius-topright":1.35e-13,"-moz-stack-sizing":1.35e-13,"-moz-tab-size":1.35e-13,"-moz-text-align-last":1.35e-13,"-moz-text-blink":1.35e-13,"-moz-text-decoration-color":-0.616548647915581,"-moz-text-decoration-line":0.181719244821487,"-moz-text-decoration-style":1.35e-13,"-moz-text-size-adjust":1.35e-13,"-moz-user-focus":1.35e-13,"-moz-user-input":1.35e-13,"-moz-user-modify":0.034528315537635,"-moz-user-select":-0.003647296094051,"-moz-window-shadow":1.35e-13,"name":-0.062634670322268,"namespaceURI":1.35e-13,"nextElementSibling":-0.005967273815486,"nextSibling":-0.000805128617912,"nodeName":-0.029235882243597,"nodeType":1.35e-13,"nodeValue":1.35e-13,"NOTATION_NODE":1.35e-13,"offsetHeight":-0.321921425413736,"offsetLeft":0.191577371751803,"offsetParent":0.11453792310567,"offsetTop":-0.064255461781729,"offsetWidth":0.208740224794267,"onabort":1.35e-13,"onafterprint":1.35e-13,"onbeforeprint":1.35e-13,"onbeforeunload":1.35e-13,"onblur":0.034528315537635,"oncanplay":1.35e-13,"oncanplaythrough":1.35e-13,"onchange":1.35e-13,"onclick":0.086280780102378,"oncontextmenu":1.35e-13,"oncopy":1.35e-13,"oncut":1.35e-13,"ondblclick":1.35e-13,"ondrag":1.35e-13,"ondragend":1.35e-13,"ondragenter":1.35e-13,"ondragleave":1.35e-13,"ondragover":1.35e-13,"ondragstart":1.35e-13,"ondrop":1.35e-13,"ondurationchange":1.35e-13,"onemptied":1.35e-13,"onended":1.35e-13,"onerror":0.060824811375049,"onfocus":0.034528315537635,"onhashchange":1.35e-13,"oninput":1.35e-13,"oninvalid":1.35e-13,"onkeydown":1.35e-13,"onkeypress":1.35e-13,"onkeyup":1.35e-13,"onload":0.060824811375049,"onloadeddata":1.35e-13,"onloadedmetadata":1.35e-13,"onloadstart":1.35e-13,"onmessage":1.35e-13,"onmousedown":0.133738416347704,"onmouseenter":1.35e-13,"onmouseleave":1.35e-13,"onmousemove":1.35e-13,"onmouseout":1.35e-13,"onmouseover":1.35e-13,"onmouseup":1.35e-13,"onmozfullscreenchange":1.35e-13,"onmozfullscreenerror":1.35e-13,"onmozpointerlockchange":1.35e-13,"onmozpointerlockerror":1.35e-13,"onoffline":1.35e-13,"ononline":1.35e-13,"onpagehide":1.35e-13,"onpageshow":1.35e-13,"onpaste":1.35e-13,"onpause":1.35e-13,"onplay":1.35e-13,"onplaying":1.35e-13,"onpopstate":1.35e-13,"onprogress":1.35e-13,"onratechange":1.35e-13,"onreset":1.35e-13,"onresize":1.35e-13,"onscroll":1.35e-13,"onseeked":1.35e-13,"onseeking":1.35e-13,"onselect":1.35e-13,"onshow":1.35e-13,"onstalled":1.35e-13,"onsubmit":1.35e-13,"onsuspend":1.35e-13,"ontimeupdate":1.35e-13,"onunload":1.35e-13,"onvolumechange":1.35e-13,"onwaiting":1.35e-13,"onwheel":1.35e-13,"opacity":-0.110378000307129,"order":1.35e-13,"outerHTML":0.515774112691935,"outline-color":-0.1442592110619,"outline-offset":-0.463307429646967,"outline-style":1.35e-13,"outline-width":1.35e-13,"overflow":0.02971979418988,"overflow-x":0.02971979418988,"overflow-y":0.003379344045591,"ownerDocument":1.35e-13,"padding-bottom":-0.016613071190569,"padding-left":0.011008406747919,"padding-right":0.001845112627166,"padding-top":0.159027607818992,"page-break-after":1.35e-13,"page-break-before":1.35e-13,"page-break-inside":1.35e-13,"paint-order":1.35e-13,"parentElement":0.159061268965045,"parentNode":0.159061268965045,"pathname":-0.525789302458229,"perspective":1.35e-13,"perspective-origin":0.138757329456778,"ping":0.030477439224001,"pointer-events":1.35e-13,"port":0.030477439224001,"position":0.044234489160543,"preColonText":0.222888776371654,"prefix":1.35e-13,"previousElementSibling":-0.43751314211044,"previousElementSiblingText":0.415604837824162,"previousSibling":-0.009218772086449,"PROCESSING_INSTRUCTION_NODE":1.35e-13,"properties":1.35e-13,"protocol":0.067075654017003,"quotes":1.35e-13,"rel":-0.188683129289871,"resize":1.35e-13,"rev":-0.001382929114129,"right":0.04394603065384,"scrollHeight":-0.163340489280815,"scrollLeft":1.35e-13,"scrollLeftMax":-0.063262656855933,"scrollTop":1.35e-13,"scrollTopMax":0.030229029896553,"scrollWidth":0.056924780906796,"search":0.198853912675872,"shape":0.030477439224001,"shape-rendering":1.35e-13,"spellcheck":1.35e-13,"src":1.387063937647461,"stop-color":1.35e-13,"stop-opacity":1.35e-13,"stroke":1.35e-13,"stroke-dasharray":1.35e-13,"stroke-dashoffset":1.35e-13,"stroke-linecap":1.35e-13,"stroke-linejoin":1.35e-13,"stroke-miterlimit":1.35e-13,"stroke-opacity":1.35e-13,"stroke-width":1.35e-13,"style":1.35e-13,"tabIndex":0.021652146491419,"table-layout":1.35e-13,"tagName":-0.029235882243597,"target":0.059822164610409,"text":0.273328589373589,"text-align":0.124563703201034,"text-anchor":1.35e-13,"textContent":0.101385400056754,"text-decoration":0.272213917387852,"text-indent":-0.094603475826126,"TEXT_NODE":1.35e-13,"text-overflow":0.044327717329359,"text-rendering":0.034528315537635,"text-shadow":0.088978177636044,"text-transform":-0.009330093973041,"title":0.329229258098287,"top":-0.038145091433309,"transform":0.08332146694115,"transform-origin":0.138757329456778,"transform-style":1.35e-13,"transition-delay":1.35e-13,"transition-duration":-0.416911707580631,"transition-property":0.399427932576963,"transition-timing-function":0.046395722066244,"type":0.032039887891528,"unicode-bidi":0.113972371332373,"validationMessage":-0.00125259782849,"validity":-0.00125259782849,"value":-0.107897282778914,"vector-effect":1.35e-13,"vertical-align":-0.081970612624104,"visibility":0.144362432591514,"vLink":1.35e-13,"white-space":0.03960195912817,"width":-0.072481416019061,"willValidate":-0.00125259782849,"word-break":1.35e-13,"word-spacing":0.037741530431184,"word-wrap":-0.036203823534244,"writing-mode":1.35e-13,"xpath":1.240739405411974,"z-index":0.250116257226772};
  
  getTargetForSimilaritySVM = function(targetInfo) {
    var candidates = getAllCandidates();
    var bestScore = -10000000000000000000000000;
    var bestNode = null;
    for (var i = 0; i<candidates.length; i++){
	var info = getFeatures(candidates[i]);
	var score = 0;
	for (var prop in targetInfo) {
	  if (targetInfo.hasOwnProperty(prop)) {
	    if (targetInfo[prop] === info[prop] && (prop in svmModel)){
              score += svmModel[prop]; //just 1s and 0s so no need to actually multiply
	    }
	  }
	}
	getTargetForSimilaritySVMScores.push(score);
	if (score > bestScore){
	  bestScore = score;
	  bestNode = candidates[i];
	}
    }
    return bestNode;
  };

//iMacros
var retrieveTargetForIMacros = function(targetInfo){
    var ls = document.querySelectorAll(targetInfo.nodeName);
    var textMatchCount = 0;
    for (var i = 0; i<ls.length; i++){
        var node = ls[i];
        if (node.textContent == targetInfo.textContent){
           textMatchCount ++;
           if (textMatchCount == targetInfo.pos){
              return node;
           }
        }
    }
    return;
}


//ATA-QV

var saveTargetInfoForATAQV = function(target){
	//console.log("saveTargetInfoForATAQV");
    var label = getLabel(target);
    //console.log("label", label);

    var nodes = getnodesWithLabelInSubtree(label,$("html"));
    if (nodes.length === 1){
    	//console.log("just one node with this label!");
    	return JSON.stringify({"l":label,"a":[]});
    }
    //console.log(nodes.length, "nodes with this label");
    
    //must find anchors

    
    var t_i = subtreeThatLacksOtherInstancesOfNodeLabel(target);
    var t_others = [];
    for (var i = 0; i <nodes.length; i++){
    	if(nodes[i] === target){
    		//console.log("Good, we found the original node using our label.");
    	}
    	t_others.push(subtreeThatHasNodeLacksNode(nodes[i],target));
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
    		//console.log("weren't able to find a label that distinguishes t_i from t_cl");
    		//console.log("t_i", t_i);
    		//console.log("t_cl", t_cl);
    		return JSON.stringify({"l":label,"a":null});
    	}
    	//console.log("found a distinguishing label for t_cl", distinguishing_label);
    	//console.log("t_i", t_i);
    	//console.log("t_cl", t_cl);
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
	    //console.log("new_t_others", new_t_others);
    	
    }
    
    //console.log("t_others empty and still no luck");
    return JSON.stringify({"l":label,"a":null});
};

var findClosestSubtrees = function(t_i, t_others){
	//console.log("findClosestSubtrees");
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
	//console.log(getDistinguishingLabel);
	var nodes = $.makeArray(t_i.find("*"));
	nodes.push(t_i.get(0));
	var candidates = [];
	for (var i = 0; i<nodes.length; i++){
		////console.log("nodes[i]", nodes[i]);
		candidates.push(getLabel(nodes[i]));
	}
	
	labels_to_avoid = [];
	//console.log("t_others", t_others);
	for (var i = 0; i<t_others.length; i++){
		////console.log(t_others[i]);
		var bad_nodes = $.makeArray($(t_others[i]).find("*"));
		bad_nodes.push(t_others[i]);
		////console.log("bad_nodes", bad_nodes);
		for (var j = 0; j<bad_nodes.length; j++){
			////console.log("bad_nodes[j]", bad_nodes[j]);
			labels_to_avoid.push(getLabel(bad_nodes[j]));
		}
	}
	
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
	//console.log("subtreeThatHasNodeLacksNode");
    var currentSubtree = $(node1);
    var $node2 = $(node2)
    counter = 0;
	while(counter < 50 && true){
		counter ++;
		var parent = currentSubtree.parent();
		//console.log("parent in subtreeThatHasNodeLacksNode", parent);
		var descendants = parent.find("*");
		for (var i = 0; i< descendants.length ; i++){
			if ($node2.is(descendants[i])){
				//console.log("Good, we found the other label.");
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
		//console.log("parent in subtreeThatLacksOtherInstancesOfNodeLabel", parent);
		var descendants = parent.find("*");
		var l_count = 0;
		for (var i = 0; i<descendants.length; i++){
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
    var label = "";
    label = node.textContent;
    if (label === "" || label === undefined){
    	label = node.nodeName+"*****nodeName";
    }
    else{
    	label = label+"*****textContent";
    }
    return label;
};

var getnodesWithLabelInSubtree = function(label,root){
	//console.log("getnodesWithLabelInSubtree");
	var ls = [];
	var arr = label.split("*****");
	var finder = arr[0];
	var tp = arr[1];
	//console.log("finder", finder);
	if (tp === "nodeName"){
		//console.log("using nodeName");
		ls = root.find(finder);
		//console.log(ls);
	}
	else{
		//console.log("using textContent");
		var nodes = root.find("*");
        nodes.push(root); //also include the root itself
    	for (var i = 0; i< nodes.length; i++){
    		if (nodes[i].textContent === finder){
    			ls.push(nodes[i]);
    		}
    	}
	}
	//console.log("ls", ls);
	return ls;
};

var getTargetForATAQV = function(targetInfo){
	//console.log("getTargetForATAQV");
	//console.log(targetInfo);
	var label = targetInfo.l;
	var anchors = targetInfo.a;
	//console.log("anchors", anchors);
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
			//console.log(child);
			var descendants = $(child).find("*");
			descendants.push(child);
			var labels = [];
			for (var j = 0; j<descendants.length; j++){
				var l1 = getLabel(descendants[j]);
				labels.push(l1);
			}

			if (labels.indexOf(label) === -1){
				continue;
			}
			var useThisChild = true;
			for (var j = 0; j< anchors.length; j++){
				//console.log("anchor", anchors[j], labels.indexOf(anchors[j]));
				if (labels.indexOf(anchors[j]) === -1){
					//this subtree doesn't have all anchors
					//console.log("Couldn't find this anchor, better move to the next child");
					useThisChild = false;
					break;
				}
			}
			if(!useThisChild){
				continue;
			}
			//if we've made it here, the subtree has all anchors, go down till no one child has all of them
			currentNode = $(child);
			//console.log("found a child with all", child);
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
			//console.log("couldn't find a child with all, throw out anchor", anchors[anchors.length-1]);
			anchors = anchors.slice(0,anchors.length-1);
		}
	}
};


function simulateClick(node) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0,
        false, false, false, false, 0, null);

    node.dispatchEvent(evt);
}

//an algorithm for pure bookkeeping

var func_a1 = function(url,xpath,url1,url2,targetInfoString,iMacrosTargetInfoString,similarityInfoString,ATAQVInfoString){
	var output = url+"<,>"+xpath+"<,>"+url1+"<,>"+url2;
	
	var targetInfo = JSON.parse(similarityInfoString);
	getTargetForSimilarity(targetInfo);
	getTargetForSimilarityFiltered(targetInfo);
	getTargetForSimilarityRegression(targetInfo);
	getTargetForSimilaritySVM(targetInfo);
	
	var scores = [getTargetForSimilarityScores, getTargetForSimilarityFilteredScores, getTargetForSimilarityRegressionScores, getTargetForSimilaritySVMScores];
	for (var i = 0; i< scores.length; i++){
		var score_ls = scores[i].sort();
		for (var j = score_ls.length -1; j > score_ls.length -11; j--){
			output += "<,>"+score_ls[j];
		}
	}
	return output;
};