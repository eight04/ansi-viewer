document.documentElement.innerHTML = "";

document.title = self.options.title;

document.body.innerHTML = self.options.body;

var i,
	ct = document.createDocumentFragment(),
	link,
	script;
	
for (i = 0; i < self.options.styles.length; i++) {
	link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = self.options.styles[i];
	ct.appendChild(link);
}

for (i = 0; i < self.options.scripts.length; i++) {
	script = document.createElement("script");
	script.src = self.options.scripts[i];
	script.async = false;
	script.charset = "utf-8";
	ct.appendChild(script);
}

document.head.appendChild(ct);
