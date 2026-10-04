import { generateVoucher } from "./voucher.js";

const reserva = {
  folio: "CT-PRUEBA",
  location: "Casa Tortuga, Tulum",
  activity: "Experiencia Básica",
  seller: "CET",
  name: "Gabriel Victorio",
  date: "7 de octubre",
  people: 2,
  price: 350,
  total: 700,
  deposit: 200,
  balance: 500,
  phone: ""
};

generateVoucher(reserva, "voucher-prueba.pdf")
  .then((archivo) => {
    console.log("Voucher creado:", archivo);
  })
  .catch((error) => {
    console.error("Error al generar voucher:", error);
  });