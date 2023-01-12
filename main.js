const resto = document.getElementById("resto");
const descarte = document.getElementById("descarte");
const jugador = document.getElementById("jugador");
const oponente = document.getElementById("oponente");
const socket = io("https://chinchon-server.onrender.com");

let mazo = [];

socket.on("connect", () => {
  console.log("Te uniste a la sala");
})

socket.on("match-start", () => {
  limpiarTablero();
});

socket.on("recibe-carta", ({valor, palo}) => {
  const carta = generateCard(valor, palo, false);
  mazo.push({valor, palo})
  jugador.appendChild(carta);
});

socket.on("oponente-recibe", ({valor, palo}) => {
  oponente.appendChild(generateCard(valor, palo, true));
})

socket.on("descarta", ({valor, palo}, index = -1) => {
  const carta = generateCard(valor, palo, false);
  descarte.appendChild(carta);
  if (index >= 0) {
    oponente.removeChild(oponente.childNodes[index]);
  }
})

socket.on("eliminar-descarte", () => {
  descarte.removeChild(descarte.lastChild);
})

socket.on("no-cards", () => {
  resto.style.backgroundColor = "transparent";
})

function limpiarTablero() {
  jugador.innerHTML = "";
  oponente.innerHTML = "";
  mazo = [];
  descarte.innerHTML = "";
}
function generateCard(valor, palo, hidden = false) {
  const card = document.createElement("div");
  card.classList.add("carta");
  if(hidden) {
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
  if(palo === "comodin") {
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

  return card;
}

function descartar(carta, {valor, palo}, index) {
  socket.emit("descarta", socket.id, {valor, palo}, index);
  descarte.appendChild(carta);
}

jugador.addEventListener("click", e => {
  if(e.target.classList.contains("carta")) {
    const index = [Array.from(e.target.parentNode.children).indexOf(e.target)];
    const carta = mazo.splice(index, 1)[0];
    descartar(e.target, carta, (mazo.length - index));
  }
});

resto.addEventListener("click", e => {
  socket.emit("toma-carta");
});

descarte.addEventListener("click", e => {
  socket.emit("toma-descarte");
})