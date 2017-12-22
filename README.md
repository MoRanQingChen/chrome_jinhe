chrome插件是个挺好玩的东西，可以注入JS到网页，执行很多有趣的事情，自动化地去做很多人工去做的事情



先看下插件效果，

![1.jpg](http://upload-images.jianshu.io/upload_images/2425435-a7e3f0307deccabe.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![2.jpg](http://upload-images.jianshu.io/upload_images/2425435-1152b7a8a50aae13.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
找到一篇想要的文章后，点击插件


![3.png](http://upload-images.jianshu.io/upload_images/2425435-f45e0a0b50a54be1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
自动跳转到后台并转发此文章


![4.jpg](http://upload-images.jianshu.io/upload_images/2425435-c0a368c5ce1fac9c.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![5.png](http://upload-images.jianshu.io/upload_images/2425435-7df0e202da4415e4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
自动转发富文本

意义及前提：
这个插件是帮一个在谨和的同学做的，自动化完成转发并带有文章文字格式、表格、附件，也减少了他的工作压力
当然因为这个同学并不是程序员，所以并没有后台源码和服务器

步骤分析：
想要写小插件嘛首先要先手动能做一些事情，然后再用插件将这件事情脚本化
好了先登入同学所在公司的后台，点开F12调试工具，发布一篇文章看看

![1.png](http://upload-images.jianshu.io/upload_images/2425435-4cd0e066799854d6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
发布成功了（不得不吐槽一下，外包的网站真diao，发布成功了还返回302）
看一下他发送的数据格式
![2.png](http://upload-images.jianshu.io/upload_images/2425435-5a6c88f92612d28b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
我们再自己模拟ajax在控制台试下，能不能发布成功
```JavaScript
          var xhr = new XMLHttpRequest();
		  xhr.onreadystatechange = function(data) {
		    if (xhr.readyState == 4) {
		    	alert("转发成功")
		        window.location.reload()
		    }
		  }
		  xhr.open("POST", "/yunadmin/news/ajax.php?action=add_news", true);
		  xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		  xhr.send("title=${encodeURIComponent(title)}&type2=-1&author=%E7%AE%A1%E7%90%86%E5%91%98&image=&content=${encodeURIComponent(contain)}&mobile_content=&add_time=${date}&is_top=n&sort=0&status=y&click_url=n&outside_url=&pccolor=&mcolor=&submit=%E6%8F%90%E4%BA%A4");
```
嗯，果然成功了，现在发送文章没问题了
我们可以看到这些字段，title为标题、add_time为时间、content为内容，
发文章的方法找到了，现在只要把相应的方法写在chrome插件里就可以了

chrome有开发文档，360也翻译了一份，虽然不全但是可以看看 http://open.chrome.360.cn/html/dev_doc.html

先是配置文件
manifest.json
```json
{
    "name": "谨和文章转发",
    "description": "自动转发文章到谨和后台系统",
    "version": "1.0",
    "permissions": [
        "http://jinheip.website6534.yizhanwei.com/*",
        "http://www.szip.gov.cn/info.aspx*",
        "http://bbs.mysipo.com/thread*",
        "http://ipms.ujs.edu.cn/show.asp?id=*",
        "http://www.jsip.gov.cn/*",
        "http://www.sipo.gov.cn/*"
    ],
    "background": {
        "scripts": [
            "background.js"
        ],
        "persistent": false
    },
    "browser_action": {
        "default_title": "谨和文章转发",
        "default_icon": "icon.png"
    },
    "manifest_version": 2
}
```
其中scripts为要写的脚本，default_title为插件名称、default_icon为图标，permissions为允许运行的网址名

配置文件写好之后，写我们的JS脚本
background.js
```JavaScript
chrome.browserAction.onClicked.addListener(function(tab) {
      //这里写，插件被点击时触发的方法
});
```
```JavaScript
    chrome.tabs.getSelected(function(tab){
		url = tab.url;//其中tab为当前激活tab
	})
```
有了当前tab，我们要想办法获取当前tab内的内容，
不过chrome似乎并没有提供相应的方法，没关系直接ajax在get一下就可以了
```
function fetchData(arg) {//url,method,callback
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
```
很普通的一段ajax，综合起来就是
```
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.getSelected(function (tab) {
        url = tab.url;
        fetchData({
            url: tab.url,
            method: 'GET',
            callback: {
                try{
                    parser=new DOMParser();
                    var doc = parser.parseFromString(text, "text/html");
                    var title = doc.querySelector('#lblName').innerText
			        var contain = doc.querySelector('#topcontainer table:nth-child(3) div table:nth-child(3)').innerHTML.replace(/href="\//g, 'href="http://www.szip.gov.cn/').replace(/src="\//g, 'src="http://www.szip.gov.cn/')
		            send(title, contain)//这里写调接口
                }catch(e) {
                    alert("发生错误")
                }
            },
            error: function (d) {
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
```
现在我们既有了当前tab的html内容，又有了转发的post接口，接下来就很简单了，写一下上面的调接口回调
由于chrome插件的ajax也存在跨域，所以我们要先chrome.tabs.create({url:xxx,function(){})
进入后台页面之后chrome.tabs.executeScript向后台执行JS代码
```
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
```
最后，简书地址
http://www.jianshu.com/u/6212e33c1093
