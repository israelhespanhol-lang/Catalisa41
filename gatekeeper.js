/**
 * ==========================================================================
 * Gatekeeper Modal & Lead Capture — Fronteira de Negócios
 * ==========================================================================
 * 
 * 1. Bloqueia a página até que o visitante preencha Nome e WhatsApp.
 * 2. Envia os dados para a planilha Google Sheets configurada.
 * 3. Mantém backup 100% garantido no localStorage do navegador.
 * 4. Memoriza o acesso liberado para não incomodar visitantes recorrentes.
 */

// 👉 COLE AQUI A URL DO SEU GOOGLE APPS SCRIPT (conforme o arquivo GOOGLE_SHEETS_SETUP.md)
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwT-F95eTrvwAlVkgvBtBCTaar32IPDcmIR7X89LLQ7rGcD2fyE5BKwmiZ2yYQv4ZH8/exec";

const STORAGE_KEY_ACCESS = "fn_access_granted";
const STORAGE_KEY_LEADS = "fn_leads_backup";

(() => {
  // Helper: Ler cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // Helper: Gravar cookie persistente (365 dias)
  function setCookie(name, val, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${val}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
  }

  // Sistema Inteligente de Reconhecimento de Cliente
  function isReturningClient() {
    // 1. Verifica parâmetro na URL para links diretos/campanhas (ex: ?cliente=1, ?vip=1, ?acesso=liberado)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get("cliente") === "1" ||
        urlParams.get("vip") === "1" ||
        urlParams.get("acesso") === "liberado" ||
        urlParams.has("w") ||
        urlParams.has("whatsapp") ||
        urlParams.has("lead")
      ) {
        localStorage.setItem(STORAGE_KEY_ACCESS, "true");
        setCookie(STORAGE_KEY_ACCESS, "true", 365);
        return true;
      }
    } catch (e) {}

    // 2. Verifica LocalStorage
    if (localStorage.getItem(STORAGE_KEY_ACCESS) === "true") {
      setCookie(STORAGE_KEY_ACCESS, "true", 365); // Sincroniza cookie
      return true;
    }

    // 3. Verifica Cookie persistente (caso o LocalStorage tenha sido limpo ou em navegadores in-app)
    if (getCookie(STORAGE_KEY_ACCESS) === "true") {
      localStorage.setItem(STORAGE_KEY_ACCESS, "true"); // Sincroniza localStorage
      return true;
    }

    // 4. Verifica se já existe telefone de lead salvo anteriormente no aparelho
    if (localStorage.getItem("fn_lead_phone") || getCookie("fn_lead_phone")) {
      localStorage.setItem(STORAGE_KEY_ACCESS, "true");
      setCookie(STORAGE_KEY_ACCESS, "true", 365);
      return true;
    }

    return false;
  }

  // Se o visitante já liberou o acesso anteriormente ou já é cliente, não exibe o modal
  if (isReturningClient()) {
    return;
  }

  // Trava o scroll da página enquanto aguarda o preenchimento
  document.body.classList.add("gatekeeper-locked");

  // Elementos do DOM
  const overlay = document.getElementById("gatekeeperOverlay");
  const form = document.getElementById("gatekeeperForm");
  const nameInput = document.getElementById("gatekeeperName");
  const phoneInput = document.getElementById("gatekeeperPhone");
  const nameError = document.getElementById("gatekeeperNameError");
  const phoneError = document.getElementById("gatekeeperPhoneError");
  const submitBtn = document.getElementById("gatekeeperSubmitBtn");
  const successBox = document.getElementById("gatekeeperSuccessBox");

  if (!overlay || !form || !nameInput || !phoneInput || !submitBtn) {
    return;
  }

  // Abre o popup suavemente logo após a animação de intro da landing page
  const introEl = document.querySelector(".intro");
  const openDelay = introEl ? 1700 : 400;

  setTimeout(() => {
    overlay.classList.add("active");
    nameInput.focus();
  }, openDelay);

  // ==========================================================================
  // Máscara dinâmica para WhatsApp (Padrão Brasil: (11) 99999-9999 ou fixo)
  // ==========================================================================
  phoneInput.addEventListener("input", (e) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length > 11) digits = digits.slice(0, 11);

    let formatted = "";
    if (digits.length > 0) {
      formatted = "(" + digits.substring(0, 2);
    }
    if (digits.length > 2) {
      formatted += ") ";
      if (digits.length > 7) {
        if (digits.length === 11 || (digits.length < 10 && digits[2] === "9")) {
          formatted += digits.substring(2, 7) + "-" + digits.substring(7);
        } else {
          formatted += digits.substring(2, 6) + "-" + digits.substring(6);
        }
      } else {
        formatted += digits.substring(2);
      }
    }

    e.target.value = formatted;
    clearError(phoneInput, phoneError);
  });

  nameInput.addEventListener("input", () => {
    clearError(nameInput, nameError);
  });

  function showError(input, errorElement, message) {
    input.classList.add("has-error");
    errorElement.textContent = message;
    errorElement.classList.add("visible");
  }

  function clearError(input, errorElement) {
    input.classList.remove("has-error");
    errorElement.textContent = "";
    errorElement.classList.remove("visible");
  }

  // ==========================================================================
  // Validação e Envio do Formulário
  // ==========================================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = nameInput.value.trim();
    const phoneValue = phoneInput.value.trim();
    const digitsOnly = phoneValue.replace(/\D/g, "");

    let hasError = false;

    // Validação de Nome
    if (!nome || nome.length < 3) {
      showError(nameInput, nameError, "Por favor, informe seu nome completo.");
      hasError = true;
    }

    // Validação de WhatsApp (mínimo 10 dígitos com DDD)
    if (!digitsOnly || digitsOnly.length < 10) {
      showError(phoneInput, phoneError, "Por favor, informe um WhatsApp válido com DDD.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Inicia estado de loading
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");

    const payload = {
      nome: nome,
      whatsapp: phoneValue,
      origem: "Landing Page Paraguai 2026",
      dataHora: new Date().toLocaleString("pt-BR"),
      userAgent: navigator.userAgent
    };

    // 1. Salva backup garantido no LocalStorage com Anti-Duplicação
    try {
      const existingLeads = JSON.parse(localStorage.getItem(STORAGE_KEY_LEADS) || "[]");
      const existingIndex = existingLeads.findIndex(
        (l) => (l.whatsapp || "").replace(/\D/g, "") === digitsOnly
      );

      if (existingIndex >= 0) {
        // Atualiza o lead já existente em vez de duplicar
        existingLeads[existingIndex].dataHoraRetorno = payload.dataHora;
        existingLeads[existingIndex].nome = nome;
      } else {
        existingLeads.push(payload);
      }
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(existingLeads));
    } catch (err) {
      console.warn("Não foi possível salvar no localStorage:", err);
    }

    // 2. Envia para o Google Sheets (se a URL estiver configurada)
    if (GOOGLE_SHEETS_URL && GOOGLE_SHEETS_URL.trim() !== "") {
      try {
        const formData = new FormData();
        formData.append("nome", nome);
        formData.append("whatsapp", phoneValue);
        formData.append("origem", "Landing Page Paraguai 2026");
        formData.append("dataHora", payload.dataHora);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 4500)
        );

        const fetchPromise = fetch(GOOGLE_SHEETS_URL, {
          method: "POST",
          mode: "no-cors",
          body: formData
        });

        // Aguarda envio ou timeout para nunca travar a experiência do lead
        await Promise.race([fetchPromise, timeoutPromise]);
      } catch (networkError) {
        console.warn("Envio para Google Sheets finalizado com fallback:", networkError);
      }
    } else {
      console.info("💡 Lead salvo no backup local! Configure GOOGLE_SHEETS_URL em gatekeeper.js para sincronizar com sua planilha.");
    }

    // 3. Dispara evento de conversão para o Google Analytics (GA4)
    if (typeof gtag === "function") {
      gtag("event", "generate_lead", {
        event_category: "Leads",
        event_label: "Acesso Liberado Imersao"
      });
    }

    // 4. Feedback de sucesso e memorização permanente do cliente
    form.style.display = "none";
    successBox.classList.add("visible");
    
    // Salva em múltiplas camadas (LocalStorage + Cookie de 365 dias)
    localStorage.setItem(STORAGE_KEY_ACCESS, "true");
    localStorage.setItem("fn_lead_name", nome);
    localStorage.setItem("fn_lead_phone", digitsOnly);
    setCookie(STORAGE_KEY_ACCESS, "true", 365);
    setCookie("fn_lead_phone", digitsOnly, 365);

    // Fecha o modal suavemente e libera o scroll da landing page
    setTimeout(() => {
      overlay.classList.remove("active");
      document.body.classList.remove("gatekeeper-locked");
    }, 1100);
  });
})();

// ==========================================================================
// Rastreamento Global de Cliques no WhatsApp (Google Analytics 4)
// ==========================================================================
(() => {
  function initWhatsAppTracking() {
    document.querySelectorAll('a[href*="wa.me"]').forEach((btn) => {
      if (btn.dataset.waTracked) return;
      btn.dataset.waTracked = "true";

      btn.addEventListener("click", () => {
        const label =
          btn.getAttribute("aria-label") ||
          btn.innerText.replace(/\s+/g, " ").trim() ||
          "Botão WhatsApp";

        if (typeof gtag === "function") {
          gtag("event", "contact_whatsapp", {
            event_category: "Contato WhatsApp",
            event_label: label
          });
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhatsAppTracking);
  } else {
    initWhatsAppTracking();
  }
})();

// ==========================================================================
// Utilitários de Administração (Console do Navegador)
// ==========================================================================

/**
 * Baixa todos os leads capturados em formato CSV
 * Uso no console: window.exportLeadsCSV()
 */
window.exportLeadsCSV = function () {
  try {
    const leads = JSON.parse(localStorage.getItem("fn_leads_backup") || "[]");
    if (leads.length === 0) {
      alert("Nenhum lead capturado ainda no armazenamento local.");
      return;
    }

    let csvContent = "\uFEFFData e Hora;Nome;WhatsApp;Origem\n";
    leads.forEach(lead => {
      const d = (lead.dataHora || "").replace(/;/g, ",");
      const n = (lead.nome || "").replace(/;/g, ",");
      const w = (lead.whatsapp || "").replace(/;/g, ",");
      const o = (lead.origem || "").replace(/;/g, ",");
      csvContent += `"${d}";"${n}";"${w}";"${o}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_fronteira_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`✅ ${leads.length} leads exportados com sucesso!`);
  } catch (e) {
    console.error("Erro ao exportar leads:", e);
  }
};

/**
 * Reseta o bloqueio para testar o popup novamente
 * Uso no console: window.resetLeadGate()
 */
window.resetLeadGate = function () {
  localStorage.removeItem("fn_access_granted");
  location.reload();
};
