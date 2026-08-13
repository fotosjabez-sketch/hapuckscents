/* =========================================================================
   HAPUCK SCENTS — hidratação do catálogo (estratégia "estático primeiro")

   COMO FUNCIONA
   1. A página abre já com os produtos escritos no HTML: rápido, indexável
      pelo Google e à prova de falha.
   2. Em segundo plano, consulta o Supabase.
   3. Se houver diferença, atualiza a tela suavemente (preço, nome, status,
      foto, produtos novos, produtos removidos).
   4. Se o Supabase estiver pausado, fora do ar ou lento, NADA acontece —
      o visitante continua vendo o catálogo estático e nem percebe.

   Ou seja: o banco melhora a página, mas a página nunca depende dele.
   ========================================================================= */
(function () {
  "use strict";

  var TIMEOUT_MS = 4000;   // desiste rápido: a vitrine já está na tela

  var grid = document.getElementById("grid-cat");
  var client = window.hapuckClient;
  if (!grid || !client) return;

  /* ------------------------------------------------------------ utils */
  function brl(n) {
    return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function waLink(nome) {
    return "https://wa.me/5541987961248?text=" +
      encodeURIComponent("Olá, tenho interesse no produto: " + nome);
  }

  /** Resolve o caminho da imagem: URL do Storage ou arquivo local do repo. */
  function imgSrc(valor) {
    if (!valor) return "";
    return /^https?:\/\//.test(valor) ? valor : valor;
  }

  var LEAF = '<svg class="leaf" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1">' +
    '<path d="M60 112V26"/><path d="M60 92c-16 0-26-9-26-22 14 0 26 9 26 22Z"/>' +
    '<path d="M60 92c16 0 26-9 26-22-14 0-26 9-26 22Z"/><circle cx="60" cy="22" r="9"/></svg>';

  var ICONS = '<svg class="ic-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l1.6 10.6a2 2 0 0 0 2 1.7h8.8a2 2 0 0 0 2-1.6L21 8H6.2"/><circle cx="9.5" cy="20" r="1.1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="20" r="1.1" fill="currentColor" stroke="none"/></svg>' +
    '<svg class="ic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' +
    '<svg class="ic-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3a9 9 0 0 1 9 9"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /** Monta o card exatamente no mesmo formato do HTML estático. */
  function buildCard(p) {
    var art = document.createElement("article");
    art.className = "card rev in";           // "in" é a classe real que o site usa para revelar
    art.style.opacity = "1";                  // reforço direto: garante visível mesmo se a classe mudar
    art.style.transform = "none";
    art.dataset.cat = p.categoria;
    art.dataset.id = p.id;
    art.dataset.name = p.nome;
    art.dataset.var = p.variacao || "";
    art.dataset.img = p.imagem || "";
    if (Number(p.preco) > 0) art.dataset.price = Number(p.preco).toFixed(2);

    var precoTxt = Number(p.preco) > 0 ? brl(p.preco) : "Sob consulta";

    var acoes = Number(p.preco) > 0
      ? '<button type="button" class="card__add" data-action="add" data-id="' + esc(p.id) + '">' +
          '<span class="card__add-ico">' + ICONS + '</span>' +
          '<span class="card__add-label">Adicionar ao carrinho</span></button>' +
        '<button type="button" class="card__buy" data-action="buy" data-id="' + esc(p.id) + '">Comprar agora</button>'
      : '<a class="card__buy card__buy--wa" href="' + esc(waLink(p.nome)) + '" target="_blank" rel="noopener">Consultar no WhatsApp</a>';

    art.innerHTML =
      '<div class="card__link" data-cur="ver">' +
        '<figure class="frame">' +
          '<img src="' + esc(imgSrc(p.imagem)) + '" alt="' + esc(p.nome) + '" ' +
          'onload="console.log(&quot;Hapuck: foto carregou OK —&quot;, this.naturalWidth+&quot;x&quot;+this.naturalHeight, this.src)" ' +
          'onerror="console.error(&quot;Hapuck: foto FALHOU ao carregar —&quot;, this.src);' +
          'var f=this.closest(&quot;.frame&quot;);if(f){var c=f.querySelector(&quot;.cap&quot;);' +
          'if(c)c.style.opacity=1;var l=f.querySelector(&quot;.leaf&quot;);if(l)l.style.opacity=1;}' +
          'this.style.opacity=0;">' + LEAF +
          '<figcaption class="cap">Foto: ' + esc(p.nome) + '</figcaption>' +
          '<span class="veu"><span>' + esc(p.descricao || "") + '</span></span>' +
        '</figure>' +
        '<div class="card__top"><h3>' + esc(p.nome) + '</h3>' +
          '<span class="card__m">' + esc(p.variacao || "") + '</span></div>' +
        '<div class="card__b"><span class="price">' + precoTxt + '</span></div>' +
      '</div>' +
      '<div class="card__actions">' + acoes + '</div>';

    return art;
  }

  /** Atualiza um card já existente, mexendo só no que mudou. */
  function updateCard(art, p) {
    var precoTxt = Number(p.preco) > 0 ? brl(p.preco) : "Sob consulta";

    var h3 = art.querySelector(".card__top h3");
    if (h3 && h3.textContent !== p.nome) h3.textContent = p.nome;

    var m = art.querySelector(".card__m");
    if (m && m.textContent !== (p.variacao || "")) m.textContent = p.variacao || "";

    var price = art.querySelector(".price");
    if (price && price.textContent.trim() !== precoTxt) price.textContent = precoTxt;

    var veu = art.querySelector(".veu span");
    if (veu && p.descricao && veu.textContent !== p.descricao) veu.textContent = p.descricao;

    var img = art.querySelector(".frame img");
    if (img && p.imagem) {
      var novo = imgSrc(p.imagem);
      // compara só o final do caminho para não recarregar à toa
      if (img.getAttribute("src") !== novo) img.setAttribute("src", novo);
    }

    if (art.dataset.cat !== p.categoria) art.dataset.cat = p.categoria;
    art.dataset.name = p.nome;
    art.dataset.var = p.variacao || "";
    art.dataset.img = p.imagem || "";
    if (Number(p.preco) > 0) art.dataset.price = Number(p.preco).toFixed(2);
    else delete art.dataset.price;
  }

  /* ------------------------------------------------- consulta ao banco */
  var timeout = new Promise(function (resolve) {
    setTimeout(function () { resolve({ data: null, error: "timeout" }); }, TIMEOUT_MS);
  });

  var consulta = client
    .from("produtos")
    .select("id,nome,categoria,preco,variacao,descricao,imagem,ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  Promise.race([consulta, timeout]).then(function (res) {
    if (!res || res.error || !res.data || !res.data.length) return;  // silêncio: fica o estático

    var lista = res.data;
    var vistos = {};

    lista.forEach(function (p) {
      try {
        vistos[p.id] = true;
        var art = grid.querySelector('.card[data-id="' + CSS.escape(p.id) + '"]');
        if (art) {
          updateCard(art, p);
        } else {
          grid.appendChild(buildCard(p));   // produto novo cadastrado no painel
        }
      } catch (e) {
        // um produto com dado problemático não pode derrubar os outros 24
        console.error("Hapuck: falha ao montar o card", p && p.id, e);
      }
    });

    // remove da tela o que foi excluído ou despublicado no painel
    grid.querySelectorAll(".card").forEach(function (art) {
      if (!vistos[art.dataset.id]) art.remove();
    });

    // reordena conforme a ordem definida no banco
    lista.forEach(function (p) {
      try {
        var art = grid.querySelector('.card[data-id="' + CSS.escape(p.id) + '"]');
        if (art) grid.appendChild(art);
      } catch (e) {
        console.error("Hapuck: falha ao reordenar", p && p.id, e);
      }
    });

    // avisa o carrinho para reler os preços atualizados
    document.dispatchEvent(new CustomEvent("hapuck:produtos-atualizados", { detail: lista }));
  }).catch(function (e) {
    /* qualquer erro: mantém o catálogo estático, sem alarde para o visitante.
       Fica registrado no console só para quem for depurar (F12). */
    console.error("Hapuck: sincronização com o catálogo falhou, mantendo versão estática.", e);
  });
})();
