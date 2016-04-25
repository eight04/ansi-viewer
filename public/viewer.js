Mousetrap.bind("alt+l", function() {
	document.body.classList.toggle("invert");
});

function flash() {
	document.body.classList.toggle("flink");
}

setInterval(flash, 1000);
