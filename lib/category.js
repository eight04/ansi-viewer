var {Cc, Ci} = require("chrome"),
	categoryManager = Cc["@mozilla.org/categorymanager;1"]
        .getService(Ci.nsICategoryManager);

function init() {
    categoryManager.addCategoryEntry("ext-to-type-mapping", "ans", "text/ansi", false, true);
}

function uninit() {
    categoryManager.deleteCategoryEntry("ext-to-type-mapping", "ans", false);
}

module.exports = {
    init: init,
    uninit: uninit
};
        