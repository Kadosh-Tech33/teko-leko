/* =========================================================
   Buffet Teko Leko — scripts
   ========================================================= */
(function () {
  "use strict";

  /* ---------- CONFIG ---------- */
  var WPP_NUMBER = "5511965857483"; // WhatsApp de vendas

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- ÂNCORAS ----------
     As seções usam content-visibility:auto (carregamento mais leve). Antes de navegar por um link
     interno, renderizamos tudo para que a posição de destino seja calculada corretamente. */
  var root = document.documentElement;
  function renderAll() { root.classList.add("cv-off"); }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) renderAll();
  }, true);
  if (location.hash && location.hash.length > 1) {
    renderAll();
    var target = document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(function () { target.scrollIntoView(); });
  }

  /* ---------- HEADER ---------- */
  var header = $(".site-header");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 20); };
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(onScroll); // não força layout durante o carregamento

  /* ---------- MENU MOBILE ---------- */
  var toggle = $(".menu-toggle");
  var menu = $("#menu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".sr-only").textContent = open ? "Fechar menu" : "Abrir menu";
  }
  toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  $$("#menu a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (menu.classList.contains("open") && !e.target.closest(".nav-pill")) setMenu(false);
  });

  /* O restante é iniciado quando o navegador fica ocioso: o carregamento fica mais leve no celular */
  var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1); };
  idle(initRest, { timeout: 1500 });

  function initRest() {
  /* ---------- ENTRADA AO ROLAR ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("show"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el, i) {
      // pequeno atraso em cascata dentro do mesmo grupo
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      el.addEventListener("transitionend", function clear() {
        el.style.transitionDelay = "";
        el.removeEventListener("transitionend", clear);
      });
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("show"); });
  }

  /* ---------- CONTADORES ---------- */
  var fmtCache = {};
  function formatBR(n, dec) {
    // formatador criado uma vez só (toLocaleString com opções é lento a cada quadro)
    var f = fmtCache[dec] || (fmtCache[dec] = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }));
    return f.format(n);
  }
  function animateCount(el) {
    var to = parseFloat(el.dataset.to);
    var dec = parseInt(el.dataset.dec || "0", 10);
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatBR(to * eased, dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatBR(to, dec);
    }
    requestAnimationFrame(step);
  }
  var counters = $$(".count");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- CARROSSEL DE DEPOIMENTOS ---------- */
  var track = $("#carTrack");
  if (track) {
    var slides = $$(".testi", track);
    var dotsWrap = $("#carDots");
    var current = 0, autoTimer = null, userTouched = false;

    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Ver depoimento " + (i + 1));
      b.addEventListener("click", function () { stopAuto(); goTo(i); });
      dotsWrap.appendChild(b);
    });
    var dots = $$("button", dotsWrap);

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      var s = slides[current];
      track.scrollTo({ left: s.offsetLeft - track.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
    }
    function updateDots() {
      var center = track.scrollLeft + track.clientWidth / 2;
      var best = 0, bestD = Infinity;
      slides.forEach(function (s, i) {
        var c = s.offsetLeft - track.offsetLeft + s.clientWidth / 2;
        var d = Math.abs(c - center);
        if (d < bestD) { bestD = d; best = i; }
      });
      current = best;
      dots.forEach(function (d, i) { d.setAttribute("aria-current", i === best ? "true" : "false"); });
    }
    var raf = null;
    track.addEventListener("scroll", function () {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateDots);
    }, { passive: true });
    // estado inicial sem ler layout (evita reflow da página inteira no carregamento)
    dots.forEach(function (d, i) { d.setAttribute("aria-current", i === 0 ? "true" : "false"); });

    $$(".car-btn").forEach(function (b) {
      b.addEventListener("click", function () { stopAuto(); goTo(current + parseInt(b.dataset.dir, 10)); });
    });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); stopAuto(); goTo(current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stopAuto(); goTo(current - 1); }
    });

    // Avanço automático suave; para de vez quando a pessoa interage
    function stopAuto() { userTouched = true; clearInterval(autoTimer); }
    function startAuto() {
      if (reduceMotion || userTouched) return;
      clearInterval(autoTimer);
      autoTimer = setInterval(function () { goTo(current + 1); }, 6000);
    }
    ["pointerdown", "touchstart", "wheel", "focusin"].forEach(function (ev) {
      track.addEventListener(ev, stopAuto, { passive: true });
    });
    track.addEventListener("mouseenter", function () { clearInterval(autoTimer); });
    track.addEventListener("mouseleave", startAuto);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) startAuto(); else clearInterval(autoTimer); });
      }, { threshold: 0.4 }).observe(track);
    }
  }

  /* ---------- LIGHTBOX ---------- */
  var lb = $("#lightbox");
  var lbImg = $("#lbImg");
  var lbCount = $("#lbCount");
  var items = $$(".g-item");
  var lbIndex = 0, lastFocus = null;

  function showItem(i) {
    lbIndex = (i + items.length) % items.length;
    var it = items[lbIndex];
    var img = it.querySelector("img");
    lbImg.src = it.dataset.full || it.getAttribute("href");
    lbImg.alt = img ? img.alt : "";
    lbCount.textContent = (lbIndex + 1) + " de " + items.length;
  }
  if (lb && typeof lb.showModal === "function") {
    items.forEach(function (it, i) {
      it.addEventListener("click", function (e) {
        e.preventDefault();
        lastFocus = it;
        showItem(i);
        lb.showModal();
      });
    });
    $(".lb-close").addEventListener("click", function () { lb.close(); });
    $(".lb-prev").addEventListener("click", function () { showItem(lbIndex - 1); });
    $(".lb-next").addEventListener("click", function () { showItem(lbIndex + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") showItem(lbIndex + 1);
      if (e.key === "ArrowLeft") showItem(lbIndex - 1);
    });
    lb.addEventListener("close", function () { lbImg.src = "data:,"; if (lastFocus) lastFocus.focus(); });
    // gesto de arrastar no celular
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) showItem(lbIndex + (dx < 0 ? 1 : -1));
      tx = null;
    });
  }

  /* ---------- FORMULÁRIO → WHATSAPP ---------- */
  var form = $("#quoteForm");
  var fData = $("#f-data");
  var hint = $("#pacoteHint");
  var intPacote = $("#int-pacote");

  // data mínima = hoje
  var today = new Date();
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var todayISO = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
  fData.min = todayISO;

  function parseISO(v) {
    var p = v.split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  var WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

  function isWeekend() {
    var fds = $("#dia-fds");
    return fds.checked;
  }
  function updateHint() {
    hint.hidden = !(intPacote.checked && isWeekend());
  }

  // ao escolher a data, marca automaticamente "segunda a sexta" ou "fim de semana"
  fData.addEventListener("change", function () {
    if (!fData.value) return;
    var wd = parseISO(fData.value).getDay();
    $(wd === 0 || wd === 6 ? "#dia-fds" : "#dia-semana").checked = true;
    updateHint();
  });
  $$('input[name="dia"]').forEach(function (r) { r.addEventListener("change", updateHint); });
  intPacote.addEventListener("change", updateHint);

  // links que pré-selecionam opções no formulário
  var interesseMap = { pacote: "#int-pacote", visita: "#int-visita", degustacao: "#int-degustacao" };
  $$("[data-interesse], [data-tipo], [data-dia]").forEach(function (a) {
    a.addEventListener("click", function () {
      var it = a.dataset.interesse;
      if (it && interesseMap[it]) $(interesseMap[it]).checked = true;
      if (a.dataset.tipo) {
        var t = $('input[name="tipo"][value="' + a.dataset.tipo + '"]');
        if (t) t.checked = true;
      }
      if (a.dataset.dia === "semana" && !fData.value) $("#dia-semana").checked = true;
      updateHint();
      // leva o foco ao primeiro campo depois da rolagem
      setTimeout(function () { $("#f-resp").focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
    });
  });

  var required = [
    { id: "f-resp", msg: "Informe o nome do responsável." },
    { id: "f-aniv", msg: "Informe o nome do aniversariante." },
    { id: "f-idade", msg: "Informe a idade." },
    { id: "f-data", msg: "Escolha a data da festa." }
  ];

  function setInvalid(el, invalid, msg) {
    var f = el.closest("[data-field]");
    var err = f.querySelector(".err");
    if (msg) err.textContent = msg;
    f.classList.toggle("invalid", invalid);
    el.setAttribute("aria-invalid", invalid ? "true" : "false");
  }

  function validate() {
    var firstBad = null;
    required.forEach(function (r) {
      var el = document.getElementById(r.id);
      var v = el.value.trim();
      var bad = !v, msg = r.msg;
      if (!bad && r.id === "f-idade") {
        var n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 120) { bad = true; msg = "Informe uma idade válida."; }
      }
      if (!bad && r.id === "f-data" && v < todayISO) { bad = true; msg = "Escolha uma data a partir de hoje."; }
      setInvalid(el, bad, msg);
      if (bad && !firstBad) firstBad = el;
    });
    return firstBad;
  }

  required.forEach(function (r) {
    var el = document.getElementById(r.id);
    ["input", "change"].forEach(function (ev) {
      el.addEventListener(ev, function () {
        if (el.closest("[data-field]").classList.contains("invalid") && el.value.trim()) setInvalid(el, false);
      });
    });
  });

  function val(sel) { var el = $(sel); return el ? el.value.trim() : ""; }
  function radio(name) { var el = $('input[name="' + name + '"]:checked'); return el ? el.value : ""; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = validate();
    if (bad) {
      bad.focus({ preventScroll: true });
      bad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      return;
    }

    var d = parseISO(fData.value);
    var dataTxt = pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " (" + WEEKDAYS[d.getDay()] + ")";
    var interesses = $$('input[name="interesse"]:checked').map(function (c) { return c.value; });
    var idade = val("#f-idade");

    var linhas = [
      "🎉 *Olá, Teko Leko! Quero um orçamento.*",
      "",
      "👤 *Responsável:* " + val("#f-resp"),
      "🎂 *Aniversariante:* " + val("#f-aniv") + " (" + idade + (idade === "1" ? " ano" : " anos") + ")",
      "📅 *Data pretendida:* " + dataTxt
    ];
    var dia = radio("dia");
    if (dia) linhas.push("🗓 *Dia da festa:* " + dia);
    if (val("#f-conv")) linhas.push("👥 *Convidados:* " + val("#f-conv"));
    linhas.push("🎈 *Tipo de festa:* " + (radio("tipo") || "Infantil"));
    if (interesses.length) linhas.push("⭐ *Interesse:* " + interesses.join(", "));
    if (val("#f-origem")) linhas.push("📣 *Como conheceu:* " + val("#f-origem"));
    if (val("#f-obs")) linhas.push("📝 *Observações:* " + val("#f-obs"));
    linhas.push("", "_Mensagem enviada pelo site_");

    var url = "https://wa.me/" + WPP_NUMBER + "?text=" + encodeURIComponent(linhas.join("\n"));
    var win = window.open(url, "_blank");
    if (win) win.opener = null;
    else window.location.href = url; // pop-up bloqueado: abre na mesma aba
  });

  /* ---------- ANO NO RODAPÉ ---------- */
  var y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
  } // fim initRest
})();
