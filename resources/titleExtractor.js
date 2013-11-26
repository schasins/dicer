var func = function(){
	var link = $('a:first');
	var first_title = document.title;
	if (link){
		//link.click();
		return link.html();
	}
	//setTimeout(function(){return first_title;},1200);
	return "no link";
};
