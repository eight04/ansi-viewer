// Load/Unlod modules
var mods = ["viewer", "category", "context-menu"];
	
function main() {
	var i;
	for (i = 0; i < mods.length; i++) {
		require("./" + mods[i]).init();
	}
}

function onUnload() {
	var i;
	for (i = 0; i < mods.length; i++) {
		require("./" + mods[i]).uninit();
	}
}

module.exports = {
	main: main,
	onUnload: onUnload
};
