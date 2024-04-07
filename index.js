// Require necessary modules
const express = require('express');
const http = require('http')
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require("socket.io");
const { createDiffieHellman } = require('crypto');

// Initialize Express app
const app = express();

app.use(bodyParser.json());
app.use(cors());

var server = http.createServer(app);

const io = new Server(server);

const users = new Map()

io.on("connect", (socket) => {
  socket.on('take-name',(name)=>{
    users.set(socket.id,name)
    io.emit('update-users',Array.from(users.entries()).map(([key, value]) => ({ key, value })))
  })
  socket.on('get-users',(callback)=>{
    callback(Array.from(users.entries()).map(([id, name]) => ({ id, name })))
  })
  socket.on('disconnect',()=>{
    users.delete(socket.id)
    io.emit('update-users',Array.from(users.entries()).map(([key, value]) => ({ key, value })))
  })
  socket.on('make-connection',(id)=>{
    io.emit(`connect-with-${id}`,{id:socket.id,name:users.get(socket.id)})
  })

  socket.on('connection-response',(user,myRes)=>{
    io.emit(`connection-response-${user.id}`,myRes)
    if(myRes){
      const key = createDiffieHellman(512);
      const prime = key.getPrime()
      const generator = key.getGenerator()
      io.emit(`dh-values-${socket.id}`,{prime:prime,generator:generator})
      io.emit(`dh-values-${user.id}`,{prime:prime,generator:generator})
      console.log(`Keys shared with users.`);
    }
  })

  socket.on('take-publickey',(user,key)=>{
    io.emit(`take-publickey-${user.id}`,key)
  })

  socket.on('send-message',(user,message)=>{
    console.log("Server Received: ",message);
    io.emit(`receive-message-${user.id}`,message)
  })

  socket.on('leave-conversation',(user)=>{
    io.emit(`leave-conversation-${user.id}`)
  })


});

server.listen(5000,()=>{
    console.log("Server started...");
});

