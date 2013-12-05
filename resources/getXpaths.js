var output = "";
var url = "";
var first = true;
var actualUrl = window.location.href;

function walkTheDOM(node, xpath) {

    if (!first){
    	output+=("@#@"+url+"<,>"+xpath+"<,>"+actualUrl);
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
