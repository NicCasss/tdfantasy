function parseItalianDateTime(value) {
  const raw = String(value || "").trim();

  const match = raw.match(
    /^([0-2]\d|3[01])\/(0\d|1[0-2])\/(\d{4})\s+([01]\d|2[0-3]):([0-5]\d)$/
  );

  if (!match) {
    return {
      valid: false,
      date: null,
      message: "Formato data non valido. Usa DD/MM/YYYY HH:mm",
    };
  }

  const [, day, month, year, hour, minute] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0
  );

  const isRealDate =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    date.getHours() === Number(hour) &&
    date.getMinutes() === Number(minute);

  if (!isRealDate) {
    return {
      valid: false,
      date: null,
      message: "Data inesistente. Controlla giorno e mese",
    };
  }

  return {
    valid: true,
    date,
    message: "",
  };
}

function formatItalianDateTime(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (value) => String(value).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

module.exports = {
  parseItalianDateTime,
  formatItalianDateTime,
};