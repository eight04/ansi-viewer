var viewer = require("./viewer"),
    category = require("./category");
    
function main() {
    viewer.init();
    category.init();
}

function onUnload() {
    viewer.uninit();
    category.uninit();
}

module.exports = {
    main: main,
    onUnload: onUnload
};
