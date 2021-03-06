//  taken from the Friendica jotShare function (view/jot-header.tpl)
HTMLInjector = 'window.addEventListener("message", function(ev) { if (!editor) $("#profile-jot-text").val(""); initEditor(function() { tinyMCE.execCommand("mceInsertRawHTML", false, ev.data); }); }, false);'

//  taken from the Friendica jotGetLink function (view/jot-header.tpl)
URLInjector = 'window.addEventListener("message", function(ev) { reply = bin2hex(ev.data); $.get("parse_url?binurl=" + reply, function(data) { if (!editor) $("#profile-jot-text").val(""); initEditor(function() { tinyMCE.execCommand("mceInsertRawHTML", false, data); }); }); }, false);';

function injectURL(href) {
    // inject the javascript
    // http://wiki.greasespot.net/Content_Script_Injection
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = URLInjector;
    document.body.appendChild(script);
    document.body.removeChild(script);

    document.defaultView.postMessage(href, '*');
}

function injectImage(src, alt) {
    // create html code to inject
    // http://stackoverflow.com/questions/2474605/how-to-convert-a-htmlelement-to-a-string
    var container = document.createElement("div");
    var el = document.createElement("img");
    el.setAttribute('src', src);
    el.setAttribute('alt', alt);
    container.appendChild(el);
    htmlcode = container.innerHTML;

    // inject the javascript
    // http://wiki.greasespot.net/Content_Script_Injection
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    //  taken from the Friendica jotShare function (view/jot-header.tpl)
    script.textContent = HTMLInjector;
    document.body.appendChild(script);
    document.body.removeChild(script);

    document.defaultView.postMessage(htmlcode, '*');
}

function injectQuote(source, title, text) {
    // create html code to inject
    // http://stackoverflow.com/questions/2474605/how-to-convert-a-htmlelement-to-a-string
    var container = document.createElement("div");
    var el = document.createElement("a");
    el.setAttribute("href", source);
    el.setAttribute("class", "bookmark");
    el.textContent = title;
    container.appendChild(el);

    var el = document.createElement("br");
    container.appendChild(el);

    var el = document.createElement("br");
    container.appendChild(el);;

    var el = document.createElement("blockquote");
    el.textContent = text;
    container.appendChild(el);

    var el = document.createElement("br");
    container.appendChild(el);;

    htmlcode = container.innerHTML;

    // inject the javascript
    // http://wiki.greasespot.net/Content_Script_Injection
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = HTMLInjector;
    document.body.appendChild(script);
    document.body.removeChild(script);

    document.defaultView.postMessage(htmlcode, '*');
}

self.port.on("post", function(data) {
    try {
        generator = document.getElementsByName('generator')[0].getAttribute('content');
    }
    catch (err) {
        generator = "";
    }

    if (generator.substring(0, 9)=="Friendica") {
        // if this is the login site, wait until login is completed
        if (document.getElementById("login_standard")) {
            return;
        }

        // insert image if text field present
        if (document.getElementById("profile-jot-text")) {
            if (data.type=="url") {
                injectURL(data.href);
            }
            else if (data.type=="img") {
                injectImage(data.src, data.alt);
            }
            else if (data.type="quote") {
                injectQuote(data.source, data.title, data.text);
            }
        }
        else {
            self.port.emit("notify", {
                title:"post2friendica was unable to detected a text field",
                text:"Make sure you supplied an URL ending with /network in the addon preferences."
            });
        }
    }
    else {
        self.port.emit("notify", {
            title:"post2friendica URL error",
            text:"The URL you specified in the addon preferences does not point to a Friendica site."
        });
    }

    self.port.emit("done", true);
});
