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
	info.textContent = element.textContent;
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

var all_features = ["-moz-appearance","-moz-binding","-moz-border-bottom-colors","-moz-border-left-colors","-moz-border-right-colors","-moz-border-top-colors","-moz-box-align","-moz-box-direction","-moz-box-flex","-moz-box-ordinal-group","-moz-box-orient","-moz-box-pack","-moz-column-count","-moz-column-fill","-moz-column-gap","-moz-column-rule-color","-moz-column-rule-style","-moz-column-rule-width","-moz-column-width","-moz-float-edge","-moz-font-feature-settings","-moz-font-language-override","-moz-force-broken-image-icon","-moz-hyphens","-moz-image-region","-moz-orient","-moz-outline-radius-bottomleft","-moz-outline-radius-bottomright","-moz-outline-radius-topleft","-moz-outline-radius-topright","-moz-stack-sizing","-moz-tab-size","-moz-text-align-last","-moz-text-decoration-color","-moz-text-decoration-line","-moz-text-decoration-style","-moz-text-size-adjust","-moz-user-focus","-moz-user-input","-moz-user-modify","-moz-user-select","-moz-window-shadow","align-content","align-items","align-self","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","backface-visibility","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left-color","border-left-style","border-left-width","border-right-color","border-right-style","border-right-width","border-spacing","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","bottom","box-decoration-break","box-shadow","box-sizing","caption-side","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","content","counter-increment","counter-reset","cursor","direction","display","dominant-baseline","empty-cells","fill","fill-opacity","fill-rule","filter","flex-basis","flex-direction","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","height","image-orientation","image-rendering","ime-mode","jQuery111206853848497689826","justify-content","left","letter-spacing","lighting-color","line-height","list-style-image","list-style-position","list-style-type","margin-bottom","margin-left","margin-right","margin-top","marker-end","marker-mid","marker-offset","marker-start","mask","max-height","max-width","min-height","min-width","mix-blend-mode","opacity","order","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-x","overflow-y","padding-bottom","padding-left","padding-right","padding-top","page-break-after","page-break-before","page-break-inside","paint-order","perspective","perspective-origin","pointer-events","position","previousElementSiblingText","quotes","resize","right","shape-rendering","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","table-layout","text-align","text-anchor","text-decoration","text-indent","text-overflow","text-rendering","text-shadow","text-transform","textContent","top","transform","transform-origin","transform-style","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vector-effect","vertical-align","visibility","white-space","width","word-break","word-spacing","word-wrap","xpath","z-index"];

var func_a1 = function(url,xpath,url1,url2){
	var node = xPathToNode(xpath);
	var features = getFeatures(node);
	
	var feature_string = "";
	var skip = false;
	for(var i = 0; i< all_features.length; i++){
		var value = features[all_features[i]];
		if (value && (value.indexOf("<,>") > -1 || value.indexOf("@#@") > -1)){
			skip = true; //no row for this one
			break;
		}
		feature_string+="<,>"+value;
	}

	if (!skip){
	    return url+"<,>"+xpath+"<,>"+url1+"<,>"+url2+feature_string;
    }
    return;
};
