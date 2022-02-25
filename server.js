const { diffieHellman } = require('crypto');
const express = require('express');
const upload = require('express-fileupload');

const app = express();

app.use(upload());

const http = require('http');

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

var users = [
  {name: "bot", id: "000", room: "global"},
];
var rooms = [
  {name: "global", pass: "", creator: "Anonymous"},
];
var blacklist = [
  {name: "badguy", id: "666", room: "global"},
];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/', (req, res) => {
  if (req.files){
    console.log(req.files);
    var file = req.files.file;
    var filename = file.name;
    console.log(filename);
    file.mv('./uploads/' + filename);
  }
});

io.on('connection', (socket) => {
  console.log('User connected.');
  // socket.emit('update roomlist', rooms);
  // socket.emit("update userlist", users);

  socket.on('new user', (username, userid, userroom) => {
    users.push({name: username, id: userid, room:userroom});

    socket.username = username;
    socket.currentRoom = 'global';
    socket.join('global');

    console.log(`New user ${username} created successfully.`);

    socket.emit("update chat", "Announcement", "[Announcement: You have joined global room]");
    socket.broadcast
      .to("global")
      .emit("update chat", "Announcement", "[Announcement: " + username + " has joined global room]");
    io.sockets.emit("update userlist", users);
    io.sockets.emit("update roomlist", rooms);
  });
  
  socket.on('new room', (roomname, roompass) => {
    if (roomname){
      rooms.push({ name: roomname, pass: roompass, creator: socket.username});
      io.emit('update roomlist', rooms);
    }
  });

  socket.on('update room', (roomname) => {
    //now the new clicked room name has been passed to client, which is roomname
    // roomname is the currentroom

    // Update the users info. Now the users room is the currentroom
    objIndex = users.findIndex((obj => obj.name == socket.username));
    users[objIndex].room = roomname;
    io.sockets.emit("update userlist", users);

    socket.broadcast
      .to(socket.currentRoom)
      .emit("update chat", "Announcement", "[Announcement: " + socket.username + " left room]");
    socket.leave(socket.currentRoom);
    socket.currentRoom = roomname;
    socket.join(roomname);
    socket.emit("update chat", "Announcement", "[Announcement: You have joined " + roomname + " room]");
    socket.broadcast
      .to(roomname)
      .emit(
        "update chat",
        "Announcement",
        "[Announcement: " + socket.username + " has joined " + roomname + " room]"
      );
  });

  socket.on('kick user', (userID, myUsername) => {
    // socket.currentRoom this is the current room
    // myUsername this is the user wo want to do kick operation
    // userID this is the user who would be kicked
    var creator = rooms.find(room => room.name === socket.currentRoom).creator;
    if (creator === myUsername){
      // var usersInroom = users;
      var usersInroom = JSON.parse(JSON.stringify(users));
      index = usersInroom.findIndex(user => user.id === userID);
      usersInroom.splice(index, 1);
      io.sockets.emit("update userlist", usersInroom);
      io.to(userID).emit('go home');
      io.sockets.emit("update roomlist", rooms);
      io.to(userID).emit('kick alert', myUsername);
    } else {
      io.to(users.find(user => user.name === myUsername).id).emit('permission alert', myUsername);
    }
  });

  socket.on('ban user', (userID, myUsername) => {
    // socket.currentRoom this is the current room
    // myUsername this is the user wo want to do ban operation
    // userID this is the user who would be banned
    var creator = rooms.find(room => room.name === socket.currentRoom).creator;
    if (creator === myUsername){
      blacklist.push({name: users.find(user => user.id === userID).name, id: userID, room:socket.currentRoom});
      io.sockets.emit("pass blacklist", blacklist);
      var usersInroom = JSON.parse(JSON.stringify(users));
      index = usersInroom.findIndex(user => user.id === userID);
      usersInroom.splice(index, 1);
      io.sockets.emit("update userlist", usersInroom);
      io.to(userID).emit('go home');
      io.sockets.emit("update roomlist", rooms);
      io.to(userID).emit('ban alert', myUsername);
    } else {
      io.to(users.find(user => user.name === myUsername).id).emit('permission alert', myUsername);
    }
  });

  socket.on('send message', (msg) => {
    io.sockets.to(socket.currentRoom).emit('update chat', socket.username, msg);
  });

  socket.on('private message', (toUser, msg) => {
    console.log(`User ${socket.username} send a message to ${toUser} which is ${msg}.`);
    io.to(toUser).emit('update chat', "Announcement", "[User: " + socket.username + " send a message to you.]");
    io.to(toUser).emit('update chat', socket.username, msg);
    io.to(toUser).emit('update chat', "Announcement", "[------------------------private message end.------------------------]");

  });

  socket.on('delete room', (roomname, myUsername) => {
    var author = rooms.find(room => room.name === roomname).creator;
    console.log(author);
    if (author === myUsername){
      // var usersInroom = users;
      var usersInroom = JSON.parse(JSON.stringify(users));
      console.log(rooms);
      roomindex = rooms.findIndex(room => room.name === roomname);
      rooms.splice(roomindex, 1);
      
      usersInroom = [];

      for (var index in users){
        io.to(users[index].id).emit('go home');
      }

      io.sockets.emit("update userlist", users);
      io.sockets.emit("update roomlist", rooms);
    } else {
      io.to(users.find(user => user.name === myUsername).id).emit('permission alert', myUsername);
    }
  })


});

server.listen(3000, () => {
  console.log('listening on *:3000');
});