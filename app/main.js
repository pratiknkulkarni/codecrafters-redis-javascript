const net = require("net");

const PORT = 6379

const server = net.createServer((connection) => {
  const response = Buffer.from("+PONG\r\n")

  connection.on("data", (list) => {
    // hardcoding PING for now
    if (list.toString() === "*1\r\n$4\r\nPING\r\n") {
      connection.write(response);
    }
  })
});

server.listen(PORT, "127.0.0.1");
console.log(`listening on port ${PORT}`)
