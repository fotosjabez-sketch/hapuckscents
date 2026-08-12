/* =========================================================================
   PAINEL ADMINISTRATIVO — HAPUCK SCENTS  (v2 · Supabase)
   Sistema separado do site público.

   Backend real:
   - Login: Supabase Auth (e-mail + senha)
   - Dados: tabela `produtos` no Postgres, protegida por RLS
   - Fotos: Supabase Storage (bucket `produtos`)

   As regras de acesso ficam NO BANCO, não aqui. Mesmo que alguém leia este
   arquivo, sem login só consegue LER os produtos já publicados.

   Todas as funções de dados são assíncronas (retornam Promise).
   ========================================================================= */
var Admin = (function () {
  "use strict";

  var cfg = window.HAPUCK_SUPABASE || {};
  var db  = window.hapuckClient;

  /* ---------------------------------------------------------------- AUTH */
  function signIn(email, senha) {
    if (!db) return Promise.resolve({ ok: false, msg: "Sem conexão com o servidor." });
    return db.auth.signInWithPassword({ email: email, password: senha })
      .then(function (res) {
        if (res.error) {
          var m = /invalid|credentials/i.test(res.error.message || "")
            ? "E-mail ou senha incorretos."
            : "Não foi possível entrar. Tente de novo.";
          return { ok: false, msg: m };
        }
        return { ok: true };
      })
      .catch(function () {
        return { ok: false, msg: "Servidor indisponível no momento." };
      });
  }

  function signOut() {
    return db ? db.auth.signOut().catch(function () {}) : Promise.resolve();
  }

  function session() {
    if (!db) return Promise.resolve(null);
    return db.auth.getSession()
      .then(function (r) { return (r.data && r.data.session) || null; })
      .catch(function () { return null; });
  }

  /** Protege as páginas internas. Retorna Promise<boolean>. */
  function requireAuth() {
    return session().then(function (s) {
      if (!s) { location.replace("index.html"); return false; }
      var who = document.getElementById("sideUser");
      if (who) who.textContent = (s.user && s.user.email) || "";
      return true;
    });
  }

  /* ---------------------------------------------------------- CATEGORIAS */
  var CATEGORIES = [
    { id: "buques",   label: "Buquês de Vela" },
    { id: "casa",     label: "Para a Casa" },
    { id: "frutos",   label: "Frutos do Espírito" },
    { id: "corpo",    label: "Corpo & Banho" },
    { id: "perfumes", label: "Perfumes" }
  ];

  function categoryLabel(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i].label;
    }
    return id || "—";
  }

  /* ================================= DADOS =============================== */

  function list() {
    if (!db) return Promise.reject(new Error("sem conexão"));
    return db.from("produtos")
      .select("id,nome,categoria,preco,variacao,descricao,imagem,ativo,ordem")
      .order("ordem", { ascending: true })
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }

  function get(id) {
    if (!db) return Promise.reject(new Error("sem conexão"));
    return db.from("produtos").select("*").eq("id", id).maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }

  function slugify(txt) {
    return (txt || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "produto";
  }

  function freeId(base) {
    return db.from("produtos").select("id").like("id", base + "%")
      .then(function (r) {
        var usados = {};
        (r.data || []).forEach(function (p) { usados[p.id] = true; });
        if (!usados[base]) return base;
        var n = 2;
        while (usados[base + "-" + n]) n++;
        return base + "-" + n;
      });
  }

  function save(produto) {
    if (!db) return Promise.reject(new Error("sem conexão"));

    var linha = {
      nome: produto.nome,
      categoria: produto.categoria,
      preco: Number(produto.preco) || 0,
      variacao: produto.variacao || "",
      descricao: produto.descricao || "",
      imagem: produto.imagem || "",
      ativo: !!produto.ativo
    };

    if (produto.id) {
      return db.from("produtos").update(linha).eq("id", produto.id).select().single()
        .then(function (r) { if (r.error) throw r.error; return r.data; });
    }

    return freeId(slugify(produto.nome)).then(function (id) {
      linha.id = id;
      return db.from("produtos").select("ordem").order("ordem", { ascending: false }).limit(1)
        .then(function (r) {
          linha.ordem = ((r.data && r.data[0] && r.data[0].ordem) || 0) + 1;
          return db.from("produtos").insert(linha).select().single();
        })
        .then(function (r) { if (r.error) throw r.error; return r.data; });
    });
  }

  function remove(id) {
    if (!db) return Promise.reject(new Error("sem conexão"));
    return db.from("produtos").delete().eq("id", id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  }

  /** Envia a foto ao Storage e devolve a URL pública. */
  function uploadImage(file) {
    if (!db) return Promise.reject(new Error("sem conexão"));
    var ext  = (file.name.split(".").pop() || "webp").toLowerCase();
    var nome = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    return db.storage.from(cfg.bucket || "produtos")
      .upload(nome, file, { cacheControl: "3600", upsert: false })
      .then(function (r) {
        if (r.error) throw r.error;
        return db.storage.from(cfg.bucket || "produtos").getPublicUrl(nome).data.publicUrl;
      });
  }

  /* --------------------------------------------------------------- UTILS */
  function brl(n) {
    return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("on"); }, 2800);
  }

  function initShell(activePage) {
    var side   = document.querySelector(".side");
    var toggle = document.querySelector(".side__toggle");
    var scrim  = document.querySelector(".side__scrim");

    if (toggle && side && scrim) {
      var close = function () { side.classList.remove("on"); scrim.classList.remove("on"); };
      toggle.addEventListener("click", function () {
        if (side.classList.contains("on")) { close(); }
        else { side.classList.add("on"); scrim.classList.add("on"); }
      });
      scrim.addEventListener("click", close);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    }

    document.querySelectorAll(".side__nav a").forEach(function (a) {
      if (a.dataset.page === activePage) a.classList.add("on");
    });

    var out = document.getElementById("logoutBtn");
    if (out) out.addEventListener("click", function () {
      signOut().then(function () { location.href = "index.html"; });
    });
  }

  return {
    signIn: signIn, signOut: signOut, session: session, requireAuth: requireAuth,
    CATEGORIES: CATEGORIES, categoryLabel: categoryLabel,
    list: list, get: get, save: save, remove: remove, uploadImage: uploadImage,
    brl: brl, escapeHtml: escapeHtml, toast: toast, initShell: initShell
  };
})();
