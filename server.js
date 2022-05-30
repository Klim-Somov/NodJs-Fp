const cluster = require("cluster");
const os = require("os");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { getDirList, getPageMarkup, checkIsFile } = require("./common");

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) cluster.fork();
} else {
  http
    .createServer(async (request, response) => {
      const { method, url } = request;
      const currentPath = path.join(__dirname, url);

      if (!fs.existsSync(currentPath)) {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end("File or directory not found");
        return;
      }

      if (method === "GET" && url === "/styles.css") {
        const readStream = fs.createReadStream(currentPath);
        response.writeHead(200, { "Content-Type": "text/css" });

        readStream.pipe(response);
        return;
      }

      if (method === "GET" && url === "/favicon.ico") {
        const readStream = fs.createReadStream(currentPath);
        response.writeHead(200, { "Content-Type": "image/x-icon" });

        readStream.pipe(response);
        return;
      }

      if (method === "GET") {
        const isFile = await checkIsFile(currentPath);

        if (isFile) {
          const readStream = fs.createReadStream(currentPath);

          response.writeHead(200, { "Content-Type": "text/plain" });
          readStream.pipe(response);
        } else {
          const dirList = await getDirList(url, currentPath);

          response.writeHead(200, { "Content-Type": "text/html" });
          response.end(getPageMarkup(url, dirList));
        }

        return;
      }
    })
    .listen(3000, "localhost");
}
