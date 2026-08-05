/* ==========================================================================
   HAPUCK SCENTS — comportamento
   Um único arquivo, sem dependências. Tudo respeita prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Abertura: o monograma se desenha, depois a página aparece ------- */
  var abertura = document.querySelector(".abertura");
  function revelar() {
    document.body.classList.add("carregado");
    if (abertura) {
      setTimeout(function () { abertura.classList.add("some"); }, calmo ? 0 : 1500);
    }
  }
  if (document.readyState === "complete") revelar();
  else window.addEventListener("load", revelar);
  // rede lenta não pode segurar a página
  setTimeout(revelar, 2600);

  /* --- Fotos ainda não enviadas: o quadro mostra a legenda ------------- */
  function marcarFoto(img) {
    img.classList.add("ausente");
    var quadro = img.closest(".foto");
    if (quadro) quadro.classList.add("sem-foto");
  }
  document.querySelectorAll(".foto img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) marcarFoto(img);
    img.addEventListener("error", function () { marcarFoto(img); });
  });

  /* --- Cabeçalho compacto e botão flutuante --------------------------- */
  var topo = document.querySelector(".topo");
  var flutua = document.querySelector(".wa-flutua");
  var fio = document.querySelector(".fio");

  function aoRolar() {
    var y = window.scrollY;
    if (topo) topo.classList.toggle("compacto", y > 60);
    if (flutua) flutua.classList.toggle("visivel", y > window.innerHeight * 0.75);
    if (fio) {
      var alcance = document.documentElement.scrollHeight - window.innerHeight;
      fio.style.setProperty("--progresso", alcance > 0 ? (y / alcance).toFixed(4) : 0);
    }
    parallax(y);
  }

  /* --- Parallax discreto: a imagem anda mais devagar que o texto ------- */
  var camadas = [].slice.call(document.querySelectorAll(".paralaxe"));
  function parallax(y) {
    if (calmo) return;
    camadas.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var centro = r.top + r.height / 2 - window.innerHeight / 2;
      var forca = parseFloat(el.dataset.forca || "0.08");
      el.style.transform = "translate3d(0," + (-centro * forca).toFixed(2) + "px,0)";
    });
  }

  var travado = false;
  window.addEventListener("scroll", function () {
    if (travado) return;
    travado = true;
    requestAnimationFrame(function () { aoRolar(); travado = false; });
  }, { passive: true });
  aoRolar();

  /* --- Revelações ao entrar na viewport ------------------------------- */
  if ("IntersectionObserver" in window) {
    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); olho.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    document.querySelectorAll(".rev, .cabecalho-secao, .ritual__item").forEach(function (el) {
      olho.observe(el);
    });
  } else {
    document.querySelectorAll(".rev").forEach(function (el) { el.classList.add("in"); });
  }

  /* --- Menu véu -------------------------------------------------------- */
  var botaoMenu = document.querySelector(".menu-botao");
  var veu = document.querySelector(".veu");
  if (botaoMenu && veu) {
    botaoMenu.addEventListener("click", function () {
      var aberto = veu.classList.toggle("aberto");
      botaoMenu.setAttribute("aria-expanded", aberto ? "true" : "false");
      botaoMenu.querySelector("[data-texto]").textContent = aberto ? "Fechar" : "Menu";
      document.body.style.overflow = aberto ? "hidden" : "";
    });
    veu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") botaoMenu.click();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && veu.classList.contains("aberto")) botaoMenu.click();
    });
  }

  /* --- Cursor "ver" sobre as fotos de produto ------------------------- */
  var cursor = document.querySelector(".cursor");
  if (cursor && window.matchMedia("(hover:hover)").matches && !calmo) {
    var alvos = document.querySelectorAll("[data-cursor]");
    window.addEventListener("mousemove", function (e) {
      cursor.style.transform = cursor.classList.contains("ativo")
        ? "translate(" + e.clientX + "px," + e.clientY + "px) scale(1)"
        : "translate(" + e.clientX + "px," + e.clientY + "px) scale(0)";
    });
    alvos.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        cursor.textContent = el.dataset.cursor || "ver";
        cursor.classList.add("ativo");
      });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("ativo"); });
    });
  }

  /* --- Filtro por nota na página de coleção ---------------------------- */
  var filtros = document.querySelectorAll(".filtro");
  if (filtros.length) {
    filtros.forEach(function (b) {
      b.addEventListener("click", function () {
        var nota = b.dataset.nota;
        filtros.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        document.querySelectorAll(".peca").forEach(function (p) {
          var mostra = nota === "tudo" || (p.dataset.notas || "").split(" ").indexOf(nota) > -1;
          p.hidden = !mostra;
        });
      });
    });
    // permite chegar já filtrado: colecao.html?nota=lavanda
    var pedida = new URLSearchParams(location.search).get("nota");
    if (pedida) {
      var alvo = document.querySelector('.filtro[data-nota="' + pedida + '"]');
      if (alvo) alvo.click();
    }
  }

  /* --- Troca de miniatura na página de produto ------------------------ */
  var principal = document.querySelector("[data-foto-principal] img");
  document.querySelectorAll("[data-miniatura]").forEach(function (mini) {
    mini.addEventListener("click", function () {
      var img = mini.querySelector("img");
      if (!principal || !img) return;
      var srcAntigo = principal.getAttribute("src");
      var altAntigo = principal.getAttribute("alt");
      principal.setAttribute("src", img.getAttribute("src"));
      principal.setAttribute("alt", img.getAttribute("alt"));
      img.setAttribute("src", srcAntigo);
      img.setAttribute("alt", altAntigo);
    });
  });
})();
