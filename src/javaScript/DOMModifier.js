var centerFirstLevelDiv = function () {
  var body = document.getElementsByTagName("body")[0];
  var children = body.childNodes;
  for(var i = 0; i < children.length; i++) {
    if(children[i].tagName == "DIV") {
      var element = children[i];
      var parent = element.parentNode;
      var wrapper = document.createElement('center');
      parent.replaceChild(wrapper, element);
      wrapper.appendChild(element);
    }
  }
};

var insertNodes = function () {
  var body = document.getElementsByTagName("body")[0];
  var div = document.createElement('div');
  body.insertBefore(div,body.childNodes[0]);

  var all = document.body.getElementsByTagName("div");
  var count = 0;
  var limit = all.length; // /20
  if(limit < 1) limit = 1;
  //console.log("LIMIT" + " " + limit)
  for(var i = 0; (i < all.length) && (count < limit); i++) {
    var element = all[i];
    var insert = null;
    var children = element.childNodes;
    for(var j = 0; j < children.length; j++) {
      if(children[j].tagName != "SCRIPT" 
          && children[j].tagName != "STYLE"  
          && children[j].tagName != "INPUT" 
          && children[j].tagName != undefined) {
        //console.log("=" + children[j].tagName + "=");
        insert = document.createElement(children[j].tagName);
        insert.setAttribute("class",children[j].className);
        break;
      }
    }
    if(insert) {
      console.log("INSERT");
      console.log(element.childNodes);
      element.insertBefore(insert,children[0]);
      console.log(element.childNodes);
      count++;
    }
  }
};

var h2Toh3 = function () {
  var headings = document.body.getElementsByTagName("h2");
  while(headings.length > 0) {
    var h2 = headings[0];
    var parent = h2.parentNode;
    var h3 = document.createElement('h3');
    //console.log(h2);
    h3.textContent = h2.textContent;
    h3.setAttribute("class",h2.className);
    h3.setAttribute("id",h2.id);
    while(h2.childNodes.length > 0) {
      h3.appendChild(h2.childNodes[0]);
    }
    parent.replaceChild(h3, h2);
  }
};

var moveAround = function () {
  var all = document.body.getElementsByTagName("*");
  var count = 0;
  var limit = all.length/10;
  for(var i = 0; i < all.length; i++) {
    var element = all[i];
    var next = element.nextSibling;
    //console.log(next +' '+ (next && next.tagName == "DIV")+' '+(next && next.tagName == "DIV" && next.childNodes.length > 0));
    if(next && next.tagName == "DIV" && next.childNodes.length > 0) {
      //console.log("MOVE");
      //console.log(next);
      //console.log(next.childNodes);
      var parent = element.parentNode;
      parent.removeChild(element);
      next.insertBefore(element,next.childNodes[0]);
      count++;
      //console.log(next.childNodes);
    }
  }
};

var changeTextInner = function(x) {
  if(x.childNodes.length == 0) {
    x.textContent = x.textContent + "x";
    console.log(x);
  } else {
    for(var i = 0; i < x.childNodes.length; i++) {
      changeTextInner(x.childNodes[i]);
    }
  }
};

var changeText = function() {
  changeTextInner(document.body);
};

var getElementByXpath = function (path) {
    return document.evaluate(path, document, null, 9, null).singleNodeValue;
};
