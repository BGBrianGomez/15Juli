document.querySelectorAll(".gallery-section").forEach((section) => {
  const track = section.querySelector(".carousel-track");
  const dots = [...section.querySelectorAll(".gallery-dot")];

  if (track) {
    const slides = [...track.querySelectorAll(".carousel-slide")];
    const status = section.querySelector(".carousel-status");
    let currentIndex = 0;
    let pointerStartX = null;

    const setMobileTrackHeight = () => {
      if (window.matchMedia("(max-width: 600px)").matches) {
        track.style.height = `${slides[currentIndex].offsetHeight}px`;
      } else {
        track.style.height = "";
      }
    };

    const showSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      setMobileTrackHeight();

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === currentIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));
      });

      status.textContent = `Foto ${currentIndex + 1} de ${slides.length}`;
    };

    slides.forEach((slide) => {
      const image = slide.querySelector("img");
      image.addEventListener("load", setMobileTrackHeight, { once: true });
    });

    section.querySelector(".carousel-arrow--previous").addEventListener("click", () => {
      showSlide(currentIndex - 1);
    });

    section.querySelector(".carousel-arrow--next").addEventListener("click", () => {
      showSlide(currentIndex + 1);
    });

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => showSlide(index));
    });

    track.addEventListener("pointerdown", (event) => {
      pointerStartX = event.clientX;
    });

    track.addEventListener("pointerup", (event) => {
      if (pointerStartX === null) return;

      const swipeDistance = event.clientX - pointerStartX;
      pointerStartX = null;

      if (Math.abs(swipeDistance) < 45) return;
      showSlide(currentIndex + (swipeDistance < 0 ? 1 : -1));
    });

    track.addEventListener("pointercancel", () => {
      pointerStartX = null;
    });

    window.addEventListener("resize", setMobileTrackHeight);

    showSlide(currentIndex);
    return;
  }

});

const countdown = document.querySelector("#countdown");
const countdownHeading = document.querySelector("#countdown-heading");

if (countdown && countdownHeading) {
  const eventTime = new Date("2027-02-20T21:00:00-03:00").getTime();
  const [days, hours, minutes] = countdown.querySelectorAll("div span");

  const updateCountdown = () => {
    const remaining = eventTime - Date.now();

    if (remaining <= 0) {
      days.textContent = "00";
      hours.textContent = "00";
      minutes.textContent = "00";
      countdownHeading.textContent = "¡Llegó el gran día!";
      return false;
    }

    days.textContent = String(Math.floor(remaining / 86_400_000)).padStart(2, "0");
    hours.textContent = String(Math.floor((remaining % 86_400_000) / 3_600_000)).padStart(2, "0");
    minutes.textContent = String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, "0");
    return true;
  };

  if (updateCountdown()) {
    const countdownInterval = window.setInterval(() => {
      if (!updateCountdown()) window.clearInterval(countdownInterval);
    }, 60_000);
  }
}

const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxGgCRo5ZtAFj1SvapZIDfD5U4T_sQuehXPz4xRkSonYJd_UYalMuLXWlEwLiXshrBTxg/exec";
const confirmationForm = document.querySelector("#confirmation-form");
const attendanceSelect = document.querySelector("#attendance");
const companionsFieldset = document.querySelector("#companions-fieldset");
const companionsList = document.querySelector("#companions-list");
const confirmationStatus = document.querySelector("#confirmation-status");

const addCompanionField = () => {
  const row = document.createElement("div");
  row.className = "companion-row";

  const label = document.createElement("label");
  label.className = "form-field";
  label.textContent = `Acompañante ${companionsList.children.length + 1}`;

  const input = document.createElement("input");
  input.type = "text";
  input.name = "acompanante";
  input.autocomplete = "off";
  input.maxLength = 120;
  input.placeholder = "Nombre y apellido";
  input.required = true;
  label.append(input);

  const removeButton = document.createElement("button");
  removeButton.className = "remove-companion-button";
  removeButton.type = "button";
  removeButton.textContent = "Quitar";
  removeButton.setAttribute("aria-label", `Quitar acompañante ${companionsList.children.length + 1}`);
  removeButton.addEventListener("click", () => {
    row.remove();
    [...companionsList.children].forEach((companion, index) => {
      const companionLabel = companion.querySelector("label");
      const companionButton = companion.querySelector("button");
      companionLabel.firstChild.textContent = `Acompañante ${index + 1}`;
      companionButton.setAttribute("aria-label", `Quitar acompañante ${index + 1}`);
    });
  });

  row.append(label, removeButton);
  companionsList.append(row);
  input.focus();
};

attendanceSelect.addEventListener("change", () => {
  const canAddCompanions = attendanceSelect.value === "Sí";
  companionsFieldset.hidden = !canAddCompanions;
  companionsList.querySelectorAll("input").forEach((input) => {
    input.disabled = !canAddCompanions;
  });
});

document.querySelector("#add-companion").addEventListener("click", addCompanionField);

confirmationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!SHEETS_WEB_APP_URL) {
    confirmationStatus.textContent = "El formulario todavía no está conectado a la hoja de respuestas.";
    return;
  }

  const formData = new FormData(confirmationForm);
  const companions = attendanceSelect.value === "Sí"
    ? [...companionsList.querySelectorAll('input[name="acompanante"]')]
      .map((input) => input.value.trim())
    : [];
  const payload = new URLSearchParams({
    nombre: formData.get("nombre").trim(),
    apellido: formData.get("apellido").trim(),
    asiste: attendanceSelect.value,
    cantidadAsistentes: String(attendanceSelect.value === "Sí" ? companions.length + 1 : 0),
    acompanantes: JSON.stringify(companions),
  });
  const submitButton = confirmationForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  confirmationStatus.textContent = "Enviando tu confirmación...";

  try {
    await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      body: payload,
    });
    confirmationForm.reset();
    companionsList.replaceChildren();
    companionsFieldset.hidden = true;
    confirmationStatus.textContent = "Solicitud enviada. Por favor, confirmá con Julieta que la recibió.";
  } catch {
    confirmationStatus.textContent = "No se pudo enviar. Revisá tu conexión e intentá nuevamente.";
  } finally {
    submitButton.disabled = false;
  }
});
