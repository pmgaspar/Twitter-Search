

function View(){
	var userLink = "<a href='http://twitter.com/$1' class='userLink' target='_blank'>$1</a>";
	var urlLink = "<a href='$1' class='urlLink' target='_blank'>$1</a>";

    this.getSearchText = function() {
        return $('#tb_search').val();
    }
	
    this.cleanSearchText = function() {
        $('#tb_search').val("");
    }
	
    this.cleanMessages = function() {
        $('.messages').empty();
    }
	
    this.cleanImages = function() {
        $('.images').empty();
    }
	
    this.showBtAction = function() {
        $('#bt_action').css('display', 'block');
    }
	
    this.changeBtActionValue = function(newValue) {
        $('#bt_action').attr('value', newValue);
    }
	
	var urlRegExp = /(http\:\/\/[\w\-_]+(\.[\w\-_]+)+[\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])/g;
	var twitterUserName = /(@[a-z0-9_]+)/gi;
    this.addMessage = function(date, user, message) {
        var formattedmessage = message.replace(urlRegExp, urlLink);
		formattedmessage=formattedmessage.replace(twitterUserName,userLink);
        var messagesDiv = $('.messages');
        var newMessageDiv = $('<DIV>').addClass("message");
		var uLink=userLink.replace(/\$1/g,user);
        newMessageDiv.css("display", "none");
        newMessageDiv.html(date + " <b>&lt;" + uLink + "&gt;</b> " + formattedmessage);
		messagesDiv.append(newMessageDiv);
        newMessageDiv.fadeIn(1000);
        var mainDiv = $('.main');
        mainDiv.attr({ scrollTop: mainDiv.attr("scrollHeight") });
    }
	
    this.addImage = function(imgThumb,imageFull,imageURL) {
        var imagesDiv = $('.images');
        var newImageDiv = $('<DIV>').addClass("image");
        newImageDiv.css("display", "none");
		var newImageTypeDiv = $('<DIV>').addClass("photo");
		
        var newImage = $('<img>').addClass("thumb");
        newImage.attr("src", imgThumb);
		newImage.attr("alt", imgThumb);
        newImage.click(function() {
            $.fancybox({
                'margin' : 50,
                'href' : imageFull,
                'title' : '<a href="'+imageURL+'" alt="'+imageURL+'" target="_blank">'+imageURL+'</a>',
                'titlePosition' : 'inside',
                'transitionIn' : 'elastic',
                'transitionOut' : 'elastic',
                'type' : 'image'
            });
        });
        
        newImageDiv.append(newImage);
		newImageDiv.append(newImageTypeDiv);
        imagesDiv.append(newImageDiv);
        attachEventToImg(newImageDiv, imgThumb);
    }
	
	this.addVideo = function(videoThumb,content,videoURL) {
        var imagesDiv = $('.images');
        var newImageDiv = $('<DIV>').addClass("image");
        newImageDiv.css("display", "none");
		var newImageTypeDiv = $('<DIV>').addClass("video");
		
        var newImage = $('<img>').addClass("thumb");
        newImage.attr("src", videoThumb);
		newImage.attr("alt", videoThumb);
        newImage.click(function() {
            $.fancybox({
                'margin' : 50,
                'content' : content,
                'title' : '<a href="'+videoURL+'" alt="'+videoURL+'" target="_blank">'+videoURL+'</a>',
                'titlePosition' : 'inside',
                'transitionIn' : 'elastic',
                'transitionOut' : 'elastic',
                'type' : 'swf' 
            });
        });
        
        newImageDiv.append(newImage);
		newImageDiv.append(newImageTypeDiv);
        imagesDiv.append(newImageDiv);
        attachEventToImg(newImageDiv, videoThumb);
    }
	
    var attachEventToImg = function(newImageDiv, url) {
        var img = new Image();
        img.onload = function() {
            newImageDiv.fadeIn(1000);
            var leftDiv = $('.leftmenu');
            leftDiv.attr({ scrollTop: leftDiv.attr("scrollHeight") });
        }
        img.src = url;
    }
}

function Controller(_view, model){
	var view = _view;

    var intervalID;
    var searchText = "";
    var lastId = 0;
    var imagesArr=new Array();

    this.startstop = function() {
        if (intervalID != undefined) {
            clearInterval(intervalID);
            intervalID = undefined;
            view.changeBtActionValue("Continue");
        } else {
            intervalID = setInterval(getNewMessages, 5000);
            view.changeBtActionValue("Pause");
        }
    }

    this.search = function() {
        var textToSearch = view.getSearchText();
        if (textToSearch == "") return;
        searchText = textToSearch;

        if (intervalID != undefined) {
            clearInterval(intervalID);
        }
        view.cleanImages();
        view.cleanMessages();
        lastId = 0;
        imagesArr=new Array();
        
        view.changeBtActionValue("Pause");
        view.showBtAction();

        getNewMessages();

        intervalID = setInterval(getNewMessages, 5000);
    }

    var getNewMessages = function() {
        var url = "http://search.twitter.com/search.json?callback=?&rpp=100&q=" + encodeURIComponent(searchText) + "&since_id=" + lastId;
        $.getJSON(url, getNewMessagesResponseHandler);
    }
	
    var getNewMessagesResponseHandler = function(data, textStatus) {
        if (data == null) return;
        if (data.results.length > 0) {
			lastId = data.max_id_str;
			
			var e=/http:\/\/.*?\s/ig;
			for (var i = data.results.length - 1; i >= 0; i--) {
				var text = data.results[i].text;
				var user = data.results[i].from_user;
				var date = new Date(data.results[i].created_at);
				var min = date.getMinutes() + "";
				if (min.length == 1)
					min = "0" + min.toString();
				var hrs = date.getHours();
				view.addMessage(hrs + ":" + min, user, text);

				text+=" ";
				var p = text.match(e);
				if (p != null){
					var u = p[0].replace(' ', '');
					
					$.embedly(u,
					{ maxWidth: 600,
					key:'5bc9b4dafa8211e08ea84040d3dc5c07',
					  success: function (oembed, dict) {
						if($.inArray(oembed.thumbnail_url,imagesArr)==-1){
							imagesArr.push(oembed.thumbnail_url);
							if(oembed.type=="photo"){
								view.addImage(oembed.thumbnail_url,oembed.url,dict.url);    
							}else if(oembed.type=="video"){
								view.addVideo(oembed.thumbnail_url,oembed.code,dict.url);    
							}
						}
					  } 
					});
				}
				
			}
        }
    }
}

function init(){
	controller = new Controller(new View(),null);
}