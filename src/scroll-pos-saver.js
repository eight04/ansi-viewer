export function createScrollPosSaver(hashedURL) {
  window.addEventListener("unload", () => {
    sessionStorage[hashedURL + ".scrollPosition"] = JSON.stringify([window.scrollX, window.scrollY]);
  }, {once: true});
  
  try {
    const [x, y] = JSON.parse(sessionStorage[hashedURL + ".scrollPosition"]);
    window.scrollTo(x, y);
  } catch (err) {
    // pass
  }
}
