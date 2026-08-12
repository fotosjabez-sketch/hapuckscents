/* =========================================================================
   HAPUCK SCENTS — carrinho (v1)
   Catálogo → carrinho local (localStorage) → finalização pelo WhatsApp.
   Sem checkout online, sem dados de pagamento armazenados.
   Estruturado para evoluir depois para um backend real (Supabase etc.):
   troque STORAGE_KEY / a leitura de PRODUCTS e as funções persistCart()/
   readCart() por chamadas de API, mantendo o resto da lógica igual.
   ========================================================================= */
(function () {
  "use strict";

  var WA_NUMBER = "5541987961248";
  var STORAGE_KEY = "hapuck_cart_v1";
  var PAY_KEY = "hapuck_cart_pay_v1";

  /* ---- catálogo (fonte da verdade dos preços — nunca inventar valores) --- */
  var PRODUCTS = {
    "buque-claro": { name: "Buquê Claro — Creme & Pêssego", price: 159.90, variation: "Tamanho a combinar (P · M · G)", img: "assets/img/col-buque-claro.webp" },
    "buque-lavanda": { name: "Buquê Lavanda", price: 159.90, variation: "Tamanho a combinar (P · M · G)", img: "assets/img/col-buque-lavanda.webp" },
    "difusor-220": { name: "Difusor de Aromas", price: 75.00, variation: "220 ml", img: "assets/img/col-difusores.webp" },
    "agua-lencol": { name: "Água Perfumada para Lençol", price: 78.90, variation: "500 ml", img: "assets/img/agua-lencol.webp" },
    "vela-100g": { name: "Vela Aromática Premium", price: 50.00, variation: "100 g", img: "assets/img/vela-100g.webp" },
    "vela-200g": { name: "Vela Aromática Premium", price: 75.00, variation: "200 g", img: "assets/img/vela-200g.webp" },
    "pastilhas": { name: "Pastilhas Perfumadas", price: 25.00, variation: "Gesso ou cera aromática", img: "assets/img/pastilhas.webp" },
    "frutos-espirito": { name: "Coleção Frutos do Espírito", price: 50.00, variation: "9 fragrâncias", img: "assets/img/frutos-do-espirito.webp" },
    "sais-250": { name: "Sais de Banho", price: 35.00, variation: "250 g", img: "assets/img/sais-banho-250.webp" },
    "sais-450": { name: "Sais de Banho", price: 65.00, variation: "450 g", img: "assets/img/sais-banho-450.webp" },
    "vela-massagem": { name: "Vela de Massagem Premium", price: 80.00, variation: "200 g", img: "assets/img/vela-massagem.webp" },
    "sabonete-unidade": { name: "Sabonete Artesanal (unidade)", price: 16.00, variation: "Redondo ou Quadrado", img: "assets/img/sabonete-unidade.webp" },
    "sabonete-kit3": { name: "Kit com 3 Sabonetes", price: 45.00, variation: "Redondo ou Quadrado", img: "assets/img/sabonete-kit3.webp" },
    "manteiga-eterna": { name: "Manteiga Corporal Eterna", price: 80.00, variation: "250 g", img: "assets/img/manteiga-eterna.webp" },
    "hidratante-corporal": { name: "Hidratante Corporal", price: 55.00, variation: "250 g · Eterna, It Girl ou Sweet & Flowers", img: "assets/img/hidratante-corporal.webp" },
    "oleo-corporal-feminino": { name: "Óleo Corporal Feminino", price: 60.00, variation: "200 ml", img: "assets/img/oleo-corporal-feminino.webp" },
    "oleo-corporal-masculino": { name: "Óleo Corporal Masculino", price: 60.00, variation: "200 ml", img: "assets/img/oleo-corporal-masculino.webp" },
    "perfume-eterna-50": { name: "Perfume Eterna", price: 80.00, variation: "50 ml", img: "assets/img/perfume-eterna-50.webp" },
    "perfume-eterna-100": { name: "Perfume Eterna", price: 120.00, variation: "100 ml", img: "assets/img/col-perfumes.webp" },
    "perfume-imperial-50": { name: "Perfume Imperial", price: 100.00, variation: "50 ml", img: "assets/img/perfume-imperial-50.webp" },
    "perfume-imperial-100": { name: "Perfume Imperial", price: 150.00, variation: "100 ml", img: "assets/img/perfume-imperial-100.webp" },
    "it-girl-iconic": { name: "It Girl — Iconic", price: 75.00, variation: "120 ml + necessaire", img: "assets/img/it-girl-iconic.webp" },
    "it-girl-muse": { name: "It Girl — Muse", price: 75.00, variation: "120 ml + necessaire", img: "assets/img/it-girl-muse.webp" },
    "it-girl-glow": { name: "It Girl — Glow", price: 75.00, variation: "120 ml + necessaire", img: "assets/img/it-girl-glow.webp" }
  };

  /* ---------------------------- utilidades ------------------------------ */
  function brl(n) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }

  function persistCart(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
  }

  function readPay() {
    try { return localStorage.getItem(PAY_KEY) || "Pix"; } catch (e) { return "Pix"; }
  }

  function persistPay(v) {
    try { localStorage.setItem(PAY_KEY, v); } catch (e) {}
  }

  var cart = readCart();

  /* ------------------------- operações do carrinho ----------------------- */
  function findLine(id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  }

  function addItem(id, qty) {
    if (!PRODUCTS[id]) return;
    qty = qty || 1;
    var line = findLine(id);
    if (line) line.qty += qty;
    else cart.push({ id: id, qty: qty });
    persistCart(cart);
    renderAll();
  }

  function removeItem(id) {
    cart = cart.filter(function (l) { return l.id !== id; });
    persistCart(cart);
    renderAll();
  }

  function changeQty(id, delta) {
    var line = findLine(id);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) { removeItem(id); return; }
    persistCart(cart);
    renderAll();
  }

  function clearCart() {
    cart = [];
    persistCart(cart);
    renderAll();
  }

  function subtotal() {
    var t = 0;
    cart.forEach(function (l) {
      var p = PRODUCTS[l.id];
      if (p) t += p.price * l.qty;
    });
    return t;
  }

  function totalCount() {
    var n = 0;
    cart.forEach(function (l) { n += l.qty; });
    return n;
  }

  /* ------------------------------ render --------------------------------- */
  var $count = document.getElementById("cartCount");
  var $items = document.getElementById("cartItems");
  var $empty = document.getElementById("cartEmpty");
  var $pay = document.getElementById("cartPay");
  var $foot = document.getElementById("cartFoot");
  var $subtotal = document.getElementById("cartSubtotal");
  var $checkout = document.getElementById("cartCheckout");

  function renderCount() {
    if (!$count) return;
    var n = totalCount();
    $count.textContent = String(n);
    $count.hidden = n === 0;
  }

  function bumpCount() {
    if (!$count) return;
    $count.classList.remove("bump");
    // força reflow para poder reiniciar a animação em cliques seguidos
    void $count.offsetWidth;
    $count.classList.add("bump");
  }

  function renderItems() {
    if (!$items) return;
    $items.innerHTML = "";
    var has = cart.length > 0;
    if ($empty) $empty.hidden = has;
    if ($pay) $pay.hidden = !has;
    if ($foot) $foot.hidden = !has;
    if ($checkout) $checkout.disabled = !has;

    cart.forEach(function (l) {
      var p = PRODUCTS[l.id];
      if (!p) return;
      var row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML =
        '<img class="cart-item__img" src="' + p.img + '" alt="" loading="lazy">' +
        '<div>' +
          '<p class="cart-item__name">' + p.name + '</p>' +
          '<p class="cart-item__var">' + p.variation + '</p>' +
          '<div class="cart-item__row">' +
            '<span class="cart-item__price">' + brl(p.price) + '</span>' +
            '<span class="cart-item__qty">' +
              '<button type="button" data-qty="-1" aria-label="Diminuir quantidade">−</button>' +
              '<span>' + l.qty + '</span>' +
              '<button type="button" data-qty="1" aria-label="Aumentar quantidade">+</button>' +
            '</span>' +
            '<button type="button" class="cart-item__remove" data-remove>Remover</button>' +
          '</div>' +
          '<div class="cart-item__sub">Subtotal: ' + brl(p.price * l.qty) + '</div>' +
        '</div>';
      row.querySelector('[data-qty="-1"]').addEventListener("click", function () { changeQty(l.id, -1); });
      row.querySelector('[data-qty="1"]').addEventListener("click", function () { changeQty(l.id, 1); });
      row.querySelector('[data-remove]').addEventListener("click", function () { removeItem(l.id); });
      $items.appendChild(row);
    });

    if ($subtotal) $subtotal.textContent = brl(subtotal());
  }

  function getPayment() {
    var checked = document.querySelector('#cartPayOpts input[name="pay"]:checked');
    return checked ? checked.value : readPay();
  }

  function renderPay() {
    var v = readPay();
    var el = document.querySelector('#cartPayOpts input[value="' + v + '"]');
    if (el) el.checked = true;
  }

  function renderAll() {
    renderCount();
    renderItems();
  }

  /* ---------------------------- drawer aberto/fechado --------------------- */
  var $drawer = document.getElementById("cartDrawer");
  var $overlay = document.getElementById("cartOverlay");
  var $toggle = document.getElementById("cartToggle");
  var $close = document.getElementById("cartClose");

  function openCart() {
    if (!$drawer) return;
    $drawer.classList.add("on");
    $drawer.setAttribute("aria-hidden", "false");
    if ($overlay) $overlay.classList.add("on");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    if (!$drawer) return;
    $drawer.classList.remove("on");
    $drawer.setAttribute("aria-hidden", "true");
    if ($overlay) $overlay.classList.remove("on");
    document.body.style.overflow = "";
  }

  if ($toggle) $toggle.addEventListener("click", function () { openCart(); });
  if ($close) $close.addEventListener("click", closeCart);
  if ($overlay) $overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $drawer && $drawer.classList.contains("on")) closeCart();
  });

  var $payOpts = document.getElementById("cartPayOpts");
  if ($payOpts) {
    $payOpts.addEventListener("change", function (e) {
      if (e.target && e.target.name === "pay") persistPay(e.target.value);
    });
  }

  var $clear = document.getElementById("cartClear");
  if ($clear) $clear.addEventListener("click", function () {
    if (cart.length && !confirm("Esvaziar o carrinho?")) return;
    clearCart();
  });

  /* ------------------------- mensagem do WhatsApp -------------------------- */
  function buildMessage() {
    var lines = ["Olá! Gostaria de fazer um pedido:", "", "*Pedido Hapuck Scents*", ""];
    cart.forEach(function (l) {
      var p = PRODUCTS[l.id];
      if (!p) return;
      lines.push("• " + p.name + (p.variation ? " — " + p.variation : ""));
      lines.push("Quantidade: " + l.qty);
      lines.push((l.qty > 1 ? "Valor unitário: " : "Valor: ") + brl(p.price));
      lines.push("");
    });
    lines.push("Subtotal: " + brl(subtotal()));
    lines.push("");
    lines.push("Forma de pagamento: " + getPayment());
    lines.push("");
    lines.push("Gostaria de finalizar meu pedido. 💐");
    return lines.join("\n");
  }

  if ($checkout) {
    $checkout.addEventListener("click", function () {
      if (!cart.length) return;
      persistPay(getPayment());
      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(buildMessage());
      window.open(url, "_blank", "noopener");
    });
  }

  /* ------------------- botões "Adicionar" / "Comprar agora" ---------------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-action]");
    if (!btn) return;
    var card = btn.closest(".card");
    var id = btn.dataset.id || (card && card.dataset.id);
    if (!id || !PRODUCTS[id]) return;
    var action = btn.dataset.action;

    if (action === "add") {
      if (btn.disabled || btn.classList.contains("is-loading") || btn.classList.contains("is-added")) return;
      var label = btn.querySelector(".card__add-label");
      var original = label ? label.textContent : null;

      btn.disabled = true;
      btn.classList.add("is-loading");

      setTimeout(function () {
        addItem(id, 1);
        bumpCount();
        btn.classList.remove("is-loading");
        btn.classList.add("is-added");
        if (label) label.textContent = "Adicionado";

        setTimeout(function () {
          btn.classList.remove("is-added");
          if (label && original) label.textContent = original;
          btn.disabled = false;
        }, 650);
      }, 320);
    } else if (action === "buy") {
      addItem(id, 1);
      bumpCount();
      openCart();
    }
  });

  /* ------------------- sincronia de preços com o Supabase ----------------
     Os preços e nomes reais vêm do banco (editáveis no painel). Se o banco
     não responder, seguimos com a tabela PRODUCTS acima — o carrinho nunca
     para de funcionar por causa disso. */
  function mergeProducts(lista) {
    if (!lista || !lista.length) return;
    lista.forEach(function (p) {
      var atual = PRODUCTS[p.id] || {};
      PRODUCTS[p.id] = {
        name: p.nome || atual.name,
        price: Number(p.preco) || 0,
        variation: p.variacao != null ? p.variacao : atual.variation,
        img: p.imagem || atual.img
      };
    });
    // remove do carrinho itens que saíram do catálogo
    var antes = cart.length;
    cart = cart.filter(function (l) { return !!PRODUCTS[l.id] && PRODUCTS[l.id].price > 0; });
    if (cart.length !== antes) persistCart(cart);
    renderAll();
  }

  // a página do catálogo já busca os produtos: aproveitamos o mesmo resultado
  document.addEventListener("hapuck:produtos-atualizados", function (e) {
    mergeProducts(e.detail);
  });

  // nas demais páginas, busca própria (silenciosa, com desistência rápida)
  if (window.hapuckClient && !document.getElementById("grid-cat")) {
    var corta = new Promise(function (r) { setTimeout(function () { r({ error: "timeout" }); }, 4000); });
    Promise.race([
      window.hapuckClient.from("produtos")
        .select("id,nome,preco,variacao,imagem").eq("ativo", true),
      corta
    ]).then(function (res) {
      if (res && !res.error && res.data) mergeProducts(res.data);
    }).catch(function () {});
  }

  /* ------------------------------- init ----------------------------------- */
  renderPay();
  renderAll();
})();
