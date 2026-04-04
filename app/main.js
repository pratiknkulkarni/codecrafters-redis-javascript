const net = require("net");

const server = net.createServer((connection) => {
  // console.log("do somethign on connection recvd");

  // connection.on('data', () => {
  //   console.log(connection.bytesRead)
  // })

  connection.write('+PONG\r\n')
});

server.listen(6379, "127.0.0.1");
// console.log("listening on port 6379")
