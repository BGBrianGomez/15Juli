const SPREADSHEET_ID = "1xNjkqRNWYN7wdH_NAN95oMzQgcw4LtSHRLrKonjXwKU";
const RESPONSE_SHEET_NAME = "Respuestas XV";

function doPost(e) {
  const parameters = e && e.parameter ? e.parameter : {};
  const nombre = cleanText(parameters.nombre);
  const apellido = cleanText(parameters.apellido);
  const asiste = parameters.asiste;
  const acompanantes = JSON.parse(parameters.acompanantes || "[]");

  if (!nombre || !apellido || !["Sí", "No"].includes(asiste)) {
    throw new Error("Faltan datos requeridos o la respuesta de asistencia no es válida.");
  }
  if (!Array.isArray(acompanantes) || acompanantes.some((name) => !cleanText(name))) {
    throw new Error("Los datos de acompañantes no son válidos.");
  }
  if (asiste !== "Sí" && acompanantes.length > 0) {
    throw new Error("No se pueden registrar acompañantes para una respuesta negativa.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME)
      || spreadsheet.insertSheet(RESPONSE_SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Fecha de respuesta",
        "Nombre",
        "Apellido",
        "Asiste",
        "Cantidad de asistentes",
        "Acompañantes",
      ]);
    }

    const guestNames = acompanantes.map(cleanText);
    sheet.appendRow([
      new Date(),
      safeCell(nombre),
      safeCell(apellido),
      asiste,
      asiste === "Sí" ? guestNames.length + 1 : 0,
      guestNames.map(safeCell).join(", "),
    ]);
  } finally {
    lock.releaseLock();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeCell(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
