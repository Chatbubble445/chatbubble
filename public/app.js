const socket = io();

// 🔥 LOGIN FIX
let name = localStorage.getItem("name");
if (!name) {
  name = prompt("Enter name");
  localStorage.setItem("name", name);
}
socket.emit("join", name);

// 🔥 SEND FIXED
function send() {
  let input = document.getElementById("msg");
  let msg = input.value.trim();

  if (!msg) return;

  socket.emit("message", msg);
  input.value = "";
}

// ENTER SEND
document.getElementById("msg").addEventListener("keypress", (e) => {
  if (e.key === "Enter") send();
});

// 🔥 RECEIVE FIX
socket.on("messages", (msgs) => {
  let chat = document.getElementById("chat");
  chat.innerHTML = "";

  msgs.forEach(m => {
    chat.innerHTML += `
      <div class="msg">
        <b>${m.user || ""}</b><br>
        ${m.text || ""}
        ${m.file ? `<br><img src="${m.file}">` : ""}
      </div>
    `;
  });

  chat.scrollTop = chat.scrollHeight;
});

// 🔥 FILE FIX
function pickFile() {
  document.getElementById("file").click();
}

function uploadFile() {
  let file = document.getElementById("file").files[0];
  if (!file) return;

  let form = new FormData();
  form.append("file", file);

  let xhr = new XMLHttpRequest();

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      let p = Math.round((e.loaded / e.total) * 100);
      document.getElementById("progress").innerText = p + "% uploading";
    }
  };

  xhr.onload = () => {
    let res = JSON.parse(xhr.responseText);
    socket.emit("file", res.url);
    document.getElementById("progress").innerText = "";
  };

  xhr.onerror = () => {
    document.getElementById("progress").innerText = "Upload failed";
  };

  xhr.open("POST", "/upload");
  xhr.send(form);
}

// 🔥 USERS LIST
socket.on("users", (users) => {
  let list = document.getElementById("users");
  list.innerHTML = "";

  users.forEach(u => {
    let div = document.createElement("div");
    div.innerText = u;
    div.onclick = () => openDM(u);
    list.appendChild(div);
  });
});

// 🔥 DM FIX
let currentDM = "";

function openDM(user) {
  currentDM = user;
  document.getElementById("dmBox").style.display = "flex";
}

function sendDM() {
  let input = document.getElementById("dmInput");
  let text = input.value.trim();

  if (!text) return;

  socket.emit("dm", { to: currentDM, text });
  input.value = "";
}

socket.on("dm", (data) => {
  if (!currentDM) return;

  if (data.room.includes(name)) {
    let box = document.getElementById("dmChat");

    box.innerHTML += `
      <div><b>${data.msg.from}:</b> ${data.msg.text}</div>
    `;
  }
});
