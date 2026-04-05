const net = require("net");

const PORT = 6379

const formatBulkString = (str) => `$${Buffer.byteLength(str)}\r\n${str}\r\n`;
const formatSimpleString = (str) => `+${str}\r\n`;
const formatError = (msg) => `-${msg}\r\n`;

function handleEcho(inputs) {
  // $<length>\r\n<data>\r\n -> bulk strings
  let response = ""

  for (let i = 0; i < inputs.length; i++) {
    let currentResponse = "$"
    currentResponse += inputs[i].length
    currentResponse += "\r\n"
    currentResponse += inputs[i]
    currentResponse += "\r\n"


    response += currentResponse
  }

  console.log(response)
  return response
}

function parser(input) {
  // $<length>\r\n<data>\r\n -> bulk strings
  // *<number-of-elements>\r\n<element-1>...<element-n> -> arrays

  const parts = input.split("\r\n")
  // console.log(inputs)
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


  // array
  // if (parts[0].startsWith('*')) {
  //   const arrLen = parts[0].slice(1);
  //   console.log(arrLen)
  //
  //   switch (parts[2].toLowerCase()) {
  //     case "echo":
  //       const output = []
  //
  //       for (let i = 1; i <= arrLen * 2; i++) {
  //         if (i % 2 === 0) {
  //           output.push(parts[i])
  //         }
  //       }
  //
  //       console.log(output)
  //       return output
  //     case "ping":
  //       return ["ping"]
  //     default:
  //       return []
  //   }

  // }
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

      default:
        connection.write(formatError(`ERR unknown command '${command}'`));
    }

    // const output = parser(data)
    // if (output.length === 0) {
    //   connection.write("+UNIMPLEMENTED\r\n")
    //   return
    // }
    //
    // if (output[0].toLowerCase() === "ping") {
    //   connection.write("+PONG\r\n")
    //   return
    // } else if (output[0].toLowerCase() === "echo") {
    //   const response = handleEcho(output.slice(1))
    //   connection.write(Buffer.from(response))
    //
    //   return
    // } else {
    //   connection.write("+UNIMPLEMENTED\r\n")
    //   return
    // }
  })
  connection.on("error", (err) => {
    console.error("Connection error:", err.message);
  });
});

server.listen(PORT, "127.0.0.1");
console.log(`listening on port ${PORT}`)
