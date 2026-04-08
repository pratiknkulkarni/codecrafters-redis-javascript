const net = require("net");

const PORT = 6379

const formatBulkString = (str) => `$${Buffer.byteLength(str)}\r\n${str}\r\n`;
const formatSimpleString = (str) => `+${str}\r\n`;
const formatError = (msg) => `-${msg}\r\n`;
const formatNullBulkString = () => `$-1\r\n`

const storage = new Map();

function parser(input) {
  // $<length>\r\n<data>\r\n -> bulk strings
  // *<number-of-elements>\r\n<element-1>...<element-n> -> arrays

  const parts = input.split("\r\n")
  if (!parts[0].startsWith("*")) {
    return []
  }

  const numberElements = parseInt(parts[0].slice(1), 10)
  const args = []

  for (let i = 0; i < numberElements; i++) {
    const dataIndex = (i * 2) + 2;
    if (parts[dataIndex] !== undefined) {
      args.push(parts[dataIndex]);
    }
  }

  return args
}

function setKey(key, value) {
  storage.set(key, value)
}

function getKey(key) {
  if (storage.has(key)) {
    return storage.get(key)
  }
  return ""
}

const server = net.createServer((connection) => {
  connection.on("data", (buffer) => {
    const args = parser(buffer.toString())
    if (args.length === 0) {
      return
    }

    const command = args[0].toUpperCase()
    switch (command) {
      case "PING":
        connection.write(formatSimpleString("PONG"));
        break;

      case "ECHO":
        if (args.length > 1) {
          connection.write(formatBulkString(args[1]));
        } else {
          connection.write(formatError("ERR wrong number of arguments for 'echo' command"));
        }
        break;

      case "GET":
        const value = getKey(args[1])
        if (value === "") {
          connection.write(formatNullBulkString())
        }
        connection.write(formatBulkString(value))
        break

      case "SET":
        connection.write(formatSimpleString("OK"));
        setKey(args[1], args[2])
        break;

      default:
        connection.write(formatError(`ERR unknown command '${command}'`));
    }
  })

  connection.on("error", (err) => {
    console.error("Connection error:", err.message);
  });
});

server.listen(PORT, "127.0.0.1");
console.log(`listening on port ${PORT}`)
