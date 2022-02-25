var socket = io();

// Show current users and rooms
var userinfo = [];
var blacklistinfo = [];
var userlist = document.getElementById('createdUser');
var roomlist = document.getElementById('createdRoom');


// Create new user
var currentRoom = "global";
var myUsername = "";

// Create new room
var newRoomNameInput = document.getElementById('newRoomNameInput');
var newRoomPassInput = document.getElementById('newRoomPassInput');
var newRoomBtn = document.getElementById('newRoomBtn');

// Send private message
var privateMessageBtn = document.getElementById('privateMessageBtn');

// Display all messages
var messageDisplay = document.getElementById('messageDisplay');

// Send message
var chatForm = document.getElementById('chatform');
var messageInput = document.getElementById('messageInput');

//create new user
socket.on("connect", function () {
    myUsername = prompt("Enter name: ");
    if (myUsername != null){
    socket.emit("new user", myUsername, socket.id, "global");
    }
    document.getElementById('roomTitle').innerText = 'Room: ' + currentRoom;
    document.getElementById('myTitle').innerText = 'Welcome! ' + myUsername;
  });



//update userlist
socket.on("update userlist", function (users) {
    userlist.innerHTML = "";
    console.log("usernames on the server:", users);
    var count = 0;
    for (var index in users) {
        const username = users[index].name
        const userid = users[index].id
        const userroom = users[index].room
        userinfo.push({name: username, id: userid, room:userroom});
        if (currentRoom === users[index].room ){
            count += 1;
            userlist.innerHTML += `<div class="user_card">
                                    <span>${users[index].name}</span>
                                    <button id="privateMessageBtn" onclick="privateMessage('${users[index].id}')">message</button> 
                                    <button id="kickBtn" onclick="kick('${users[index].id}', '${users[index].name}')">kick</button> 
                                    <button id="banBtn" onclick="ban('${users[index].id}', '${users[index].name}')">ban</button> 
                                </div>`;
        }
    }
    document.getElementById('userNum').innerText = 'users in room: ' + count;
    count = 0;
});

function kick(userID, toKickNmae){
    if (toKickNmae !==myUsername){
        socket.emit("kick user", userID, myUsername);
    }
    
};

function ban(userID, toKickNmae){
    if (toKickNmae !==myUsername){
        socket.emit("ban user", userID, myUsername);
    }
};


//create new room
newRoomBtn.addEventListener('click', function(){
    var roomname = newRoomNameInput.value.trim();
    var roompass = newRoomPassInput.value.trim();
    if (roomname){
        socket.emit('new room', roomname, roompass);
        newRoomNameInput.value = '';
        newRoomPassInput.value = '';
    }
});

//update roomlist
socket.on("update roomlist", function (rooms) {
    
    roomlist.innerHTML = "";

    for (var index in rooms) {
        if (rooms[index].name === 'global') {
            roomlist.innerHTML += `<div class="room_card" id="${rooms[index].name}"
                                        onclick="changeRoom('${rooms[index].name}', '${rooms[index].pass}')">
                                        <div class="room_item_content">
                                            <div class="roomInfo">
                                                <span class="room_name">#${rooms[index].name}</span>
                                                <span class="room_author">${rooms[index].creator}</span>
                                            </div>
                                        </div>
                                    </div>`;
        } else {
            if (rooms[index].pass != ''){
                roomlist.innerHTML += `<div class="room_card" id="${rooms[index].name}"
                                      onclick="changeRoom('${rooms[index].name}', '${rooms[index].pass}')">
                                      <div class="room_item_content">
                                          <div class="roomInfo">
                                            <span class="room_name">$Password Room ${rooms[index].name}</span>
                                            <span class="room_author">${rooms[index].creator}</span>
                                            <button id="delRoomBtn" onclick="delRoom('${rooms[index].name}')">delete</button> 
                                            </div>
                                        </div>
                                    </div>`;
            } else {
                roomlist.innerHTML += `<div class="room_card" id="${rooms[index].name}"
                                        onclick="changeRoom('${rooms[index].name}', '${rooms[index].pass}')">
                                        <div class="room_item_content">
                                            <div class="roomInfo">
                                                <span class="room_name">#${rooms[index].name}</span>
                                                <span class="room_author">${rooms[index].creator}</span>
                                                <button id="delRoomBtn" onclick="delRoom('${rooms[index].name}')">delete</button>  
                                            </div>
                                        </div>
                                    </div>`;
            }
        }
    }
  
    document.getElementById(currentRoom).classList.add("inRoom");
    document.getElementById('roomNum').innerText = 'rooms available: ' + rooms.length; 
  });

function delRoom(roomname){
    console.log(roomname);
    console.log(myUsername);
    currentRoom = "global";
    socket.emit("delete room", roomname, myUsername);
};

function changeRoom(room, pass) {
    if (room != currentRoom) {
        // verify whether this guy is in blacklist
        // uasername "myUsername" want to change to room "room"
        //all banned users are in "blacklistinfo"
        for (var index in blacklistinfo){
            if (blacklistinfo[index].id === userinfo.find(user => user.name === myUsername).id && blacklistinfo[index].room === room) {
                alert('You are not allowed to enter this room');
                return;
            }
        };
        if (pass === ''){
            socket.emit("update room", room);
            document.getElementById(currentRoom).classList.remove("inRoom");
            currentRoom = room;
            document.getElementById('roomTitle').innerText = 'Room: ' + currentRoom;
            document.getElementById(currentRoom).classList.add("inRoom");
        } else {
            passInput = prompt("Enter password: ");
            
            if (passInput === pass) {
                console.log('correct pass')
                socket.emit("update room", room);
                document.getElementById(currentRoom).classList.remove("inRoom");
                currentRoom = room;
                document.getElementById('roomTitle').innerText = 'Room: ' + currentRoom;
                document.getElementById(currentRoom).classList.add("inRoom");
            }
            else {
                alert("Incorrect Password!");
            }
        }
    }
}

//update chat
socket.on("update chat", function (username, msg) {
    var now = new Date();
    var sentAt = getTime(now);
    if (username === "Announcement"){
        console.log("Displaying user message");
        messageDisplay.innerHTML += `<div class="announcement_holder >
                                        <span class="announcement_text">${msg}</span>
                                        </div>`;
    } else {
        console.log("Displaying user message");
        messageDisplay.innerHTML += `<div class="message_holder ${
            username === myUsername ? "me" : ""
        }">
                                    <div class="message_box">
                                        <div id="message" class="message">
                                        <span class="message_name">${username}: </span>
                                        <span class="message_text">${msg}.</span>
                                        <span class="message_time">-----sent at: ${sentAt}</span>

                                        </div>
                                    </div>
                                    </div>`;
        
        messageDisplay.scrollTop = messageDisplay.scrollHeight;
        }
  });

//Send message
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (messageInput.value) {
        socket.emit('send message', messageInput.value);
        messageInput.value = '';
    }
});

function privateMessage(toUser){
    console.log(toUser);
    pmsg = prompt("Enter private message: ");
        if (pmsg) {
            console.log('test');
            socket.emit('private message', toUser, pmsg);
        }
}

socket.on("permission alert", function(myUsername){
    alert("You have no permission to do that!");
});

socket.on("kick alert", function(myUsername){
    alert("You have been kicked! Redirecting to home room...");
});

socket.on("ban alert", function(myUsername){
    alert("You have been banned! Redirecting to home room...");
});

socket.on("go home", function(){
    currentRoom = 'global';
    const home = 'global';
    console.log(home);
    socket.emit("update room", home);
    document.getElementById('roomTitle').innerText = 'Room: ' + currentRoom;
});

socket.on("pass blacklist", function(blacklist){
    for (var index in blacklist) {
        const bannedname = blacklist[index].name
        const bannedid = blacklist[index].id
        const bannedroom = blacklist[index].room
        blacklistinfo.push({name: bannedname, id: bannedid, room:bannedroom});
    }
});

function getTime(date) {
    var minutes = date.getMinutes();
    var hours = date.getHours();

    var suffix = hours >= 12 ? "pm":"am";
    hours = ((hours + 11) % 12 + 1);
    return hours + ":" + minutes + suffix;
};

function selectFile(e){
    socket.emit('send message', e.target.files[0].name);
    setFile(e.target.files[0]);
}