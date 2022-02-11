ANSI Viewer
===========

[![.github/workflows/build.yml](https://github.com/eight04/ansi-viewer/actions/workflows/build.yml/badge.svg)](https://github.com/eight04/ansi-viewer/actions/workflows/build.yml)

A Firefox addon which let you view .ans file in the browser.

Features
--------

* View ANSI files in your browser. Simply drag-n-drop them on the browser.
* Use Big5-UAO as encoding.
* pmore animation.
* Invert color with Alt+L.
* Valid file extensions: .ans, .ansi, .bbs.
* Or with content-type == "text/x-ansi".
* Live reload if the file is served from `file:`.
* Support Firefox and Chrome.

Install
-------

### Firefox

Install from AMO:
https://addons.mozilla.org/zh-TW/firefox/addon/ansi-viewer/

### Chrome

Download the latest release and load it as an unpacked extension:
https://github.com/eight04/ansi-viewer/releases

Screenshots
-----------

### With cleartype

![screenshot](http://i.imgur.com/FS5ch99.png)

### Without cleartype

![screenshot](http://i.imgur.com/s1uUlLH.png)

Build from source
-----------------

1. Install [Node.js](https://nodejs.org/en/)
2. Clone the repo:
    ```
    git clone https://github.com/eight04/ansi-viewer.git && cd ansi-viewer
    ```
3. Install dependencies and build the extension:
    ```
    npm install && npm run build
    ```

### Run test

```
npm test
```

### Pack zip

```
npm run build-zip
```

You can find the zip file in `web-ext-artifacts`.

Changelog
---------

* 4.0.0 (Feb 11, 2022)

  - Refactor: build all dependencies.
  - Fix: compatible with Chrome.

* 3.0.0 (Jun 21, 2018)

  - Rewrite. Content scripts, background scripts, and worker are mostly bundled.
  - Fix: failed to render ANSI file on the first load.
  - Add: use a worker to compile ANSI string.

* 2.0.2 (Feb 21, 2017)

	- Update bbs-reader to 0.3.1. Fix infinite loop bug.

* 2.0.1 (Jan 21, 2016)

	- Update uao-js to 1.0.1. Use our table loader to reduce file size.

* 2.0.0 (Jan 17, 2016)

	- Rewrite with Web Extension.
	- Add live reload feature. Only works on file: protocol.

* 1.4.0 (Sep 27, 2016)

	- Support multiprocess.
	- Fix charset problem when using context menu to convert text file.

* 1.3.0 (Sep 21, 2016)

	- Update bbs-reader to 0.3.0. Some style changed.
	- Add context menu "View as ANSI", which let you view any text file (text/plain) in ANSI mode. ([#2](https://github.com/eight04/ansi-viewer/issues/2))

* 1.2.3 (Sep 6, 2016)

	- Update bbs-reader to 0.2.4. Fix w > 80 bug.
	- Fix: right border disappears when horizontal scrollbar exists.

* 1.2.2 (Jul 19, 2016)

	- Update bbs-reader to 0.2.3. Fix ANSI color bug and HTML entity bug.

* 1.2.1 (Jun 24 2016)

	- Update bbs-reader to 0.2.2. Fix a bug with consequent escape code.

* 1.2.0 (Apr 30, 2016)

	- Update bbs-reader to 0.2.1.
	- Remove 80 characters width limit.
	- Use CSS animation for blinking text.

* 1.1.0 (Apr 30, 2016)

	- Move to bbs-reader.
	- Work with pmore-js!
	- Drop mousetrap

* 1.0.0 (Apr 28, 2016)

	- Move to uao-js.
	- License change to MIT.

* 0.1.1 (Apr 26, 2016)
    
    - Fix license.
    - Fix color overflow bug.
    - Add color for replies. (`: `)
    
* 0.1.0 (Apr 25, 2016)

    - First release.
