export function getBinary(file, type = "blob"){
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.open("GET", file);
    xhr.addEventListener("load", () =>
      readBinaryString(xhr.response).then(resolve, reject)
    );
    xhr.addEventListener("error", () => reject(xhr));
    xhr.send();
  });
}

function readBinaryString(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.addEventListener("load", e => resolve(e.target.result));
    reader.addEventListener("error", reject);
    reader.readAsBinaryString(blob);
  });
}

