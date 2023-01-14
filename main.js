const resto = document.getElementById("resto");
const descarte = document.getElementById("descarte");
const jugador = document.getElementById("jugador");
const oponente = document.getElementById("oponente");
const local = document.getElementById("local");
const turnoActual = document.getElementById("turno");
const adversario = document.getElementById("adversario");
const botonCortar = document.getElementById("btn-cortar");
const puntaje1 = document.getElementById("puntaje1");
const puntaje2 = document.getElementById("puntaje2");

const socket = io("https://chinchon-server.onrender.com");
//https://chinchon-server.onrender.com
// http://localhost:3000

let mazo = [];
let turno = null;
let tomoCarta = null;
let descartoCarta = null;
let nombreJugador1 = null;
let nombreJugador2 = null;
let corta = false;

const DEBUG = true;

socket.on("connect", () => {
  console.log("Te uniste a la sala");
  if (DEBUG) {
    nombreJugador1 = socket.id.substring(0, 5);
  } else {
    nombreJugador1 = prompt("Tu nombre:");
  }
  socket.emit("user-join", nombreJugador1);
  local.innerText = nombreJugador1;
});

socket.on("other-join", (data) => {
  if (data.length < 2) return;
  nombreJugador2 = data.find((player) => player.id !== socket.id).name;
  adversario.innerText = nombreJugador2;
});

socket.on("match-start", () => {
  limpiarTablero();
  puntaje1.innerText = 0;
  puntaje2.innerText = 0;
});

socket.on("round-start", () => {
  limpiarTablero();
  corta = false;
  turno = null;
})

socket.on("turno", (id) => {
  if (socket.id === id) {
    turno = true;
    turnoActual.innerText = nombreJugador1;
    tomoCarta = false;
    descartoCarta = false;
    turnoActual.style.color = "blue";
  } else {
    turnoActual.innerText = nombreJugador2;
    turnoActual.style.color = "red";
  }
});

socket.on("recibe-carta", ({ valor, palo }) => {
  const carta = generateCard(valor, palo, false);
  mazo.push({ valor, palo, id: carta.id});
  jugador.appendChild(carta);
});

socket.on("oponente-recibe", ({ valor, palo }) => {
  oponente.appendChild(generateCard(valor, palo, true));
});

socket.on("descarta", ({ valor, palo }, index = -1, jugadorCorta) => {
  corta = jugadorCorta;
  const carta = generateCard(valor, palo, corta);
  carta.removeAttribute("draggable");
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
  const bg = resto.style.backgroundImage;
  resto.style.backgroundImage = "none";
  resto.classList.remove("carta");
  descarte.innerHTML = "";
  setTimeout(() => {
    resto.classList.add("carta");
    resto.style.backgroundImage = bg;
  }, 1000);
});

socket.on("finaliza-ronda", (puntajes) => {
  console.log("Finaliza la ronda");
  puntajes.forEach(puntaje => {
    if(puntaje.id === socket.id) {
      puntaje1.innerText = Number(puntaje1.innerText) + puntaje.puntaje;
    } else {
      puntaje2.innerText = Number(puntaje2.innerText) + puntaje.puntaje;
    }
  })
  turno = false;
})

function createCardId() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
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
    if(corta) card.classList.add("corte");
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
  } else {
    const topLeft = document.createElement("div");
    topLeft.classList.add("top-left");
    const bottomRight = document.createElement("div");
    bottomRight.classList.add("bottom-right");

    topLeft.appendChild(simbolo);
    bottomRight.appendChild(simbolo.cloneNode(true));

    card.appendChild(topLeft);
    card.appendChild(bottomRight);
  }

  card.addEventListener("dragstart", () => card.classList.add("dragging"));
  card.addEventListener("touchstart", () => card.classList.add("dragging"));

  card.addEventListener("dragend", () => {
    recalculateDeck();
    card.classList.remove("dragging")
  });
  card.addEventListener("touchend", () => {
    recalculateDeck();
    card.classList.remove("dragging")
  });

  return card;
}

jugador.addEventListener("dragover", dragOver);
jugador.addEventListener("touchmove", dragOver);

// Recalcula la baraja del jugador cuando se mueven las cartas de lugar
function recalculateDeck() {
  let newDeck = [];
  Array.from(jugador.children).forEach(children => {
    const id = children.id;
    const index = getElementIndex(children);
    const card = mazo.find(card => card.id === id);
    newDeck[index] = card;
  })
  mazo = newDeck;
}

function dragOver(e) {
  e.preventDefault();
  let posX = null;
  if (e.type === "touchmove") {
    posX = e.touches[0].clientX;
  } else {
    posX = e.clientX;
  }
  const afterElement = getDragAfterElement(posX);
  const draggable = document.querySelector(".dragging");

  if (afterElement === null) {
    jugador.appendChild(draggable);
  } else {
    jugador.insertBefore(draggable, afterElement);
  }
}

function getDragAfterElement(x) {
  const elements = [...jugador.querySelectorAll(".carta:not(.dragging)")];
  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

function getCardFromElementId(id) {
  return mazo.find(card => card.id === id);
}

function descartar(carta, index) {
  let c = getCardFromElementId(carta.id);
  let i = mazo.indexOf(c);
  let {valor, palo} = c;
  mazo.splice(i, 1);
  socket.emit("descarta", { valor, palo }, index, corta);
  jugador.removeChild(carta);
  const nuevaCarta = generateCard(valor, palo, corta);
  nuevaCarta.removeAttribute("draggable");
  descarte.appendChild(nuevaCarta);
  if(corta) socket.emit("finaliza-ronda");
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

function getElementIndex(element) {
  return Array.from(jugador.children).indexOf(element);
}

botonCortar.addEventListener("click", e => {
  corta = true;
})

jugador.addEventListener("click", (e) => {
  if (e.target.classList.contains("carta") && puedeDescartar()) {
    const index = getElementIndex(e.target)
    descartar(e.target, (mazo.length - 1) - index);
    descartoCarta = true;
    if (finalizaTurno() && !corta) {
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
