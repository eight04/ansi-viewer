import './chunk-f8794c3a.js';

function drawANSI() {
	document.documentElement.style.background = "black";
  redraw();
  
  function redraw() {
    fetch(location.href)
      .then(console.log);
  }
}

if (
  document.contentType == "text/plain" ||
  document.contentType == "text/x-ansi"
) {
  drawANSI();
}
