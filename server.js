// const cluster = require("cluster");
// const os = require("os");
// const http = require("http");
// const path = require("path");
// const fs = require("fs");
// const { getDirList, getPageMarkup, checkIsFile } = require("./common");

// const numCPUs = os.cpus().length;

// if (cluster.isMaster) {
//   for (let i = 0; i < numCPUs; i++) cluster.fork();
// } else {
//   http
//     .createServer(async (request, response) => {
//       const { method, url } = request;
//       const currentPath = path.join(__dirname, url);

//       if (!fs.existsSync(currentPath)) {
//         response.writeHead(200, { "Content-Type": "text/html" });
//         response.end("File or directory not found");
//         return;
//       }

//       if (method === "GET" && url === "/styles.css") {
//         const readStream = fs.createReadStream(currentPath);
//         response.writeHead(200, { "Content-Type": "text/css" });

//         readStream.pipe(response);
//         return;
//       }

//       if (method === "GET" && url === "/favicon.ico") {
//         const readStream = fs.createReadStream(currentPath);
//         response.writeHead(200, { "Content-Type": "image/x-icon" });

//         readStream.pipe(response);
//         return;
//       }

//       if (method === "GET") {
//         const isFile = await checkIsFile(currentPath);

//         if (isFile) {
//           const readStream = fs.createReadStream(currentPath);

//           response.writeHead(200, { "Content-Type": "text/plain" });
//           readStream.pipe(response);
//         } else {
//           const dirList = await getDirList(url, currentPath);

//           response.writeHead(200, { "Content-Type": "text/html" });
//           response.end(getPageMarkup(url, dirList));
//         }

//         return;
//       }
//     })
//     .listen(3000, "localhost");
// }


const socket = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');

const getUserName = (users) => {
    const userByMaxNumber = Object.values(users).sort().pop();
    const newUserNumber = userByMaxNumber
        ? Number(userByMaxNumber.replace('user', '')) + 1
        : 1;
    return `user${newUserNumber}`;
};

const addUser = (state, userId) => {
    return {
        users: { ...state.users, [userId]: getUserName(state.users) },
        countVisitors: state.countVisitors + 1,
    };
};

const deleteUser = (state, userId) => {
    const newUsers = { ...state.users };
    delete newUsers[userId];
    return {
        users: newUsers,
        countVisitors: state.countVisitors - 1,
    };
};

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        const indexPath = path.join(__dirname, 'index.html');

        const readStream = fs.createReadStream(indexPath);

        readStream.pipe(res);
    } else {
        res.statusCode = 405;
        res.end();
    }
});

const io = socket(server);

let state = {
    users: {},
    countVisitors: 0,
};

io.on('connection', (client) => {
    state = addUser(state, client.id);

    const connectMessage = `${state.users[client.id]} вошел в чат.`;

    client.emit('client_connect', {
        msg: connectMessage,
        countVisitors: state.countVisitors,
    });

    client.broadcast.emit('client_connect', {
        msg: connectMessage,
        countVisitors: state.countVisitors,
    });

    client.on('client_msg', (data) => {
        const message = { msg: `${state.users[client.id]}: ${data.msg}` };

        client.emit('server_msg', message);
        client.broadcast.emit('server_msg', message);
    });

    client.on('disconnect', () => {
        const disconnectMessage = `${state.users[client.id]} покинул чат.`;

        state = deleteUser(state, client.id);

        client.broadcast.emit('client_disconnect', {
            msg: disconnectMessage,
            countVisitors: state.countVisitors,
        });
    });
});

server.listen(3000, 'localhost'); 