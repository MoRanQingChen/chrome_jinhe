var url; 
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.getSelected(function(tab){
		url = tab.url;
		fetchData({
			url:tab.url,
			method:'GET',
			callback:szip,
			error:function(d){
				alert("获取内容失败")
			}
		});
	})
});
function fetchData(arg) {//url,cookie,method,callback
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(data) {
    if (xhr.readyState == 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        arg.callback(xhr.responseText);
      } else {
        arg.error(xhr.responseText)
      }
    }
  }
  xhr.open(arg.method, arg.url, true);
  if(arg.header){
  	for(var key in arg.header){
  		xhr.setRequestHeader(key, arg.header[key]);
  	}
  }
  xhr.send(arg.str);
};
function szip(text){
	try{
		parser=new DOMParser();
		var doc = parser.parseFromString(text,"text/html");
		if(url.indexOf("www.szip.gov.cn/info.aspx")!=-1){
			var title = doc.querySelector('#lblName').innerText
			var contain = doc.querySelector('#topcontainer table:nth-child(3) div table:nth-child(3)').innerHTML.replace(/href="\//g,'href="http://www.szip.gov.cn/').replace(/src="\//g,'src="http://www.szip.gov.cn/')
		}else if(url.indexOf("bbs.mysipo.com/thread")!=-1){
			var title = doc.querySelector('#thread_subject').innerText
			var contain = doc.querySelector('.t_fsz').innerHTML
		}else if(url.indexOf("ipms.ujs.edu.cn/show.asp?id=")!=-1){
			var p = doc.querySelectorAll("table table:nth-child(2) table table")
			var title = p[p.length-1].querySelector('p').innerText
			var contain = doc.querySelector('.small .small').innerHTML
		}else if(url.indexOf("www.jsip.gov.cn")!=-1){
			var title = doc.querySelector(".art-title").innerText
			var contain = doc.querySelector('.TRS_PreAppend').innerHTML
		}else if(url.indexOf("www.jsip.gov.cn")!=-1){
			var title = doc.querySelector(".art-title").innerText
			var contain = doc.querySelector('.TRS_PreAppend').innerHTML
		}else if(url.indexOf("www.sipo.gov.cn")!=-1){
			var title = doc.querySelector('.index_title').innerText
			var contain = doc.querySelector('#printContent').innerHTML
		}else{
			alert("转发失败")
			return 
		}
		send(title,contain)
	}catch(e){
		alert("发生错误")
	}
}
function send(title,contain){
	var d = new Date()
	var date = encodeURIComponent(d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds())
	chrome.tabs.create({url:"http://jinheip.website6534.yizhanwei.com/yunadmin/news/index.php"}, function(tab){
		chrome.tabs.executeScript(null,{code:`  
	      var xhr = new XMLHttpRequest();
		  xhr.onreadystatechange = function(data) {
		    if (xhr.readyState == 4) {
		    	alert("转发成功")
		        window.location.reload()
		    }
		  }
		  xhr.open("POST", "http://jinheip.website6534.yizhanwei.com/yunadmin/news/ajax.php?action=add_news", true);
		  xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		  xhr.send("title=${encodeURIComponent(title)}&type2=-1&author=%E7%AE%A1%E7%90%86%E5%91%98&image=&content=${encodeURIComponent(contain)}&mobile_content=&add_time=${date}&is_top=n&sort=0&status=y&click_url=n&outside_url=&pccolor=&mcolor=&submit=%E6%8F%90%E4%BA%A4");
		`})
	})
}
