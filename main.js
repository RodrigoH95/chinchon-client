const resto = document.getElementById("resto");
const descarte = document.getElementById("descarte");
const jugador = document.getElementById("jugador");
const oponente = document.getElementById("oponente");
const local = document.getElementById("local");
const turnoActual = document.getElementById("turno");
const adversario = document.getElementById("adversario");
const socket = io("http://localhost:3000");
//https://chinchon-server.onrender.com
let mazo = [];
let turno = null;
let tomoCarta = null;
let descartoCarta = null;
let nombreJugador1 = null;
let nombreJugador2 = null;

const DEBUG = true;

socket.on("connect", () => {
  console.log("Te uniste a la sala");
  if(DEBUG) {
    nombreJugador1 = "test";
  }
  else {
    nombreJugador1 = prompt("Tu nombre:");
  }
  socket.emit("user-join", nombreJugador1);
  local.innerText = nombreJugador1;
});

socket.on("other-join", data => {
  if(data.length < 2) return;
  nombreJugador2 = data.find(player => player.id !== socket.id).name;
  adversario.innerText = nombreJugador2;
});

socket.on("match-start", () => {
  limpiarTablero();
});

socket.on("turno", (id) => {
  if (socket.id === id) {
    turno = true;
    turnoActual.innerText = nombreJugador1;
    tomoCarta = false;
    descartoCarta = false;
  } else {
    turnoActual.innerText = nombreJugador2;
  }
});

socket.on("recibe-carta", ({ valor, palo }) => {
  const carta = generateCard(valor, palo, false);
  mazo.push({ valor, palo });
  jugador.appendChild(carta);
});

socket.on("oponente-recibe", ({ valor, palo }) => {
  oponente.appendChild(generateCard(valor, palo, true));
});

socket.on("descarta", ({ valor, palo }, index = -1) => {
  const carta = generateCard(valor, palo, false);
  descarte.appendChild(carta);
  if (index >= 0) {
    oponente.removeChild(oponente.childNodes[index]);
  }
});

socket.on("eliminar-descarte", () => {
  descarte.removeChild(descarte.lastChild);
});

socket.on("no-cards", () => {
  console.log("Servidor avisa que no hay cartas");
  resto.style.backgroundColor = "transparent";
  descarte.innerHTML = "";
  setTimeout(() => {
    resto.style.backgroundColor = "#b72929";
  }, 1500);
});

function createCardId() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  let result = "";
  for(let i = 0; i < 8; i++) {
    let pick = Math.floor(Math.random() * 2)
    ? letters[Math.floor(Math.random() * letters.length)]
    : numbers[Math.floor(Math.random() * numbers.length)];
    result += pick;
  }
  return result;
}

function limpiarTablero() {
  jugador.innerHTML = "";
  oponente.innerHTML = "";
  mazo = [];
  descarte.innerHTML = "";
}
function generateCard(valor, palo, hidden = false) {
  const card = document.createElement("div");
  card.classList.add("carta");
  card.draggable = "true";
  card.id = createCardId();
  if (hidden) {
    card.classList.add("oponente");
    return card;
  }
  const simbolo = document.createElement("div");
  simbolo.classList.add("simbolo");
  simbolo.innerHTML = valor;
  const imgCont = document.createElement("div");
  imgCont.classList.add("palo");
  const img = document.createElement("img");
  img.src = `./assets/img/${palo}.png`;
  img.classList.add("valor");
  imgCont.appendChild(img);
  simbolo.appendChild(imgCont);
  if (palo === "comodin") {
    card.appendChild(simbolo);
    return card;
  }

  const topLeft = document.createElement("div");
  topLeft.classList.add("top-left");
  const bottomRight = document.createElement("div");
  bottomRight.classList.add("bottom-right");

  topLeft.appendChild(simbolo);
  bottomRight.appendChild(simbolo.cloneNode(true));

  card.appendChild(topLeft);
  card.appendChild(bottomRight);

  card.ondragstart = dragStart;

  return card;
}

function dragStart(e) {
  e.preventDefault();
  console.log("drag started");
  e.dataTransfer.setData("text", e.target.id);
}

function descartar(carta, { valor, palo }, index) {
  socket.emit("descarta", { valor, palo }, index);
  descarte.appendChild(carta);
}

function puedeDescartar() {
  return mazo.length >= 7 && turno && tomoCarta;
}

function puedeTomarCarta() {
  return !tomoCarta && turno;
}

function finalizaTurno() {
  return tomoCarta && descartoCarta;
}

jugador.ondragover = (e) => {
  e.preventDefault();
  console.log("dragover");
}

jugador.ondrop = (e) => {
  const data = e.dataTransfer.getData("text");
  e.target.appendChild(document.getElementById(data))
  console.log("Drop", data);
}

jugador.addEventListener("click", (e) => {
  if (e.target.classList.contains("carta") && puedeDescartar()) {
    const index = [Array.from(e.target.parentNode.children).indexOf(e.target)];
    const carta = mazo.splice(index, 1)[0];
    descartar(e.target, carta, mazo.length - index);
    descartoCarta = true;
    if (finalizaTurno()) {
      turno = false;
      turnoActual.innerText = nombreJugador2;
      socket.emit("finaliza-turno");
    }
  }
});

resto.addEventListener("click", (e) => {
  if (puedeTomarCarta()) {
    socket.emit("toma-carta");
    tomoCarta = true;
  }
});

descarte.addEventListener("click", (e) => {
  if (puedeTomarCarta()) {
    socket.emit("toma-descarte");
    tomoCarta = true;
  }
});
