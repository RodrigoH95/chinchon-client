const io = require("socket.io");

class CardService {
  constructor() {
    this.carta = 0;
    this.palos = ["copas", "oro", "espadas", "basto"];
    this.mazo = [];
    this.descarte = [];
  }

  generarMazo() {
    this.descarte = [];
    this.mazo.push({ comodin: "" });
    this.mazo.push({ comodin: "" });
    for (let i = 0; i < 4; i++) {
      let palo = this.palos[i];
      for (let j = 0; j < 12; j++) {
        this.mazo.push({ [palo]: j + 1 });
      }
    }
  }

  getMazo() {
    return this.mazo;
  }

  getCarta() {
    return this.carta;
  }

  descartar(carta) {
    this.descarte.push(carta);
  }

  drawOneCard() {
    const index = Math.floor(Math.random() * this.mazo.length);
    this.carta = index;
    // Chequear si no quedan cartas desde el servidor
    if(this.mazo.length === 0) {
      generarMazo();
      return;
    }

    const valor = Object.values(this.mazo[this.carta])[0];
    const palo = Object.keys(this.mazo[this.carta])[0];
    this.mazo.splice(index, 1);

    return {valor, palo}
  }
}

module.exports = CardService;
