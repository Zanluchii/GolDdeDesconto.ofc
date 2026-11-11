/* =========================================================
   GOL DE DESCONTO — lógica do site
   Você NÃO precisa mexer aqui. As configurações ficam em js/config.js
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.GOL_CONFIG || {};
  var CHAVE_FAVORITOS = "gol_favoritos";
  var CHAVE_CACHE = "gol_cache_produtos";
  var produtos = [];

  /* ---------------- Utilidades ---------------- */
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }

  function semAcento(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }
  function slug(s) { return semAcento(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* Aceita só links http(s) ou caminhos do próprio site (bloqueia "javascript:" etc.) */
  function urlSegura(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.indexOf("//") === 0) return "";
    return u;
  }

  function simNao(v) {
    var s = semAcento(v);
    return s === "sim" || s === "s" || s === "x" || s === "1" || s === "true" || s === "verdadeiro" || s === "yes";
  }

  /* "R$ 1.299,90", "1299,90", "1299.90" ou "1.299" -> número */
  function lerPreco(v) {
    var s = String(v == null ? "" : v).replace(/[^\d,.]/g, "");
    if (!s) return null;
    if (s.indexOf(",") > -1) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else if ((s.match(/\./g) || []).length > 1 || /^\d{1,3}\.\d{3}$/.test(s)) {
      s = s.replace(/\./g, "");
    }
    var n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : null;
  }

  /* "30/11/2026 23:59" ou "2026-11-30 23:59" (horário de Brasília) -> milissegundos */
  function lerData(v) {
    var s = String(v || "").trim();
    if (!s) return null;
    var d, m, a, h = 23, min = 59, seg = 59, r;
    if ((r = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T,]+(\d{1,2})[:h](\d{2})(?::(\d{2}))?)?/))) {
      d = +r[1]; m = +r[2]; a = +r[3];
    } else if ((r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/))) {
      a = +r[1]; m = +r[2]; d = +r[3];
    } else {
      return null;
    }
    if (a < 100) a += 2000;
    if (r[4] != null) { h = +r[4]; min = +r[5]; seg = r[6] != null ? +r[6] : 0; }
    var ms = Date.UTC(a, m - 1, d, h + 3, min, seg); /* Brasília = UTC-3 */
    return isFinite(ms) ? ms : null;
  }

  var formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function reais(n) { return formatoReal.format(n); }

  /* ---------------- Leitura do CSV ---------------- */
  function lerCSV(texto) {
    texto = texto.replace(/^﻿/, "");
    var primeira = texto.split(/\r?\n/)[0] || "";
    var sep = (primeira.split(";").length > primeira.split(",").length) ? ";" : ",";
    var linhas = [], linha = [], campo = "", aspas = false;
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (aspas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; } else { aspas = false; }
        } else { campo += c; }
      } else if (c === '"') {
        aspas = true;
      } else if (c === sep) {
        linha.push(campo); campo = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        linha.push(campo); linhas.push(linha); linha = []; campo = "";
      } else {
        campo += c;
      }
    }
    if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }

    var cab = (linhas.shift() || []).map(function (h) { return semAcento(h).replace(/\s+/g, "_"); });
    return linhas
      .filter(function (l) { return l.some(function (v) { return String(v).trim() !== ""; }); })
      .map(function (l) {
        var o = {};
        cab.forEach(function (h, idx) { o[h] = (l[idx] || "").trim(); });
        return o;
      });
  }

  function infoLoja(nome) {
    var lojas = CFG.lojas || {};
    var alvo = semAcento(nome).replace(/\s+/g, "");
    for (var k in lojas) {
      if (semAcento(k).replace(/\s+/g, "") === alvo) return { nome: k, cfg: lojas[k] };
    }
    var outra = lojas["Outra"] || { cor: "#5B6875", texto: "#FFFFFF", botao: "Ver na loja" };
    return { nome: nome || "Loja", cfg: { cor: outra.cor, texto: outra.texto, botao: nome ? "Ver em " + nome : outra.botao } };
  }

  function normalizar(linhas) {
    var usados = {};
    return linhas.map(function (r, i) {
      var atual = lerPreco(r.preco_atual);
      var antigo = lerPreco(r.preco_antigo);
      var desconto = (atual && antigo && antigo > atual) ? Math.round((antigo - atual) / antigo * 100) : 0;
      var id = slug(r.nome) || "produto-" + i;
      if (usados[id]) id += "-" + i;
      usados[id] = true;
      var ativo = r.ativo == null || r.ativo === "" ? true : simNao(r.ativo);
      var loja = infoLoja(r.loja);
      return {
        id: id,
        ordem: i,
        nome: r.nome || "",
        categoria: r.categoria || "",
        subcategoria: r.subcategoria || "",
        loja: loja.nome,
        lojaCfg: loja.cfg,
        link: urlSegura(r.link_afiliado),
        imagem: urlSegura(r.imagem_url),
        preco: atual,
        precoAntigo: desconto ? antigo : null,
        desconto: desconto,
        descricao: r.descricao_curta || "",
        destaque: simNao(r.destaque),
        maisComprado: simNao(r.mais_comprado),
        fimOferta: lerData(r.fim_oferta),
        ativo: ativo
      };
    }).filter(function (p) { return p.ativo && p.nome && p.link; });
  }

  function carregarProdutos() {
    var url = CFG.planilhaCSV ? CFG.planilhaCSV : CFG.planilhaExemplo;
    var urlFinal = url + (url.indexOf("?") > -1 ? "&" : "?") + "t=" + Math.floor(Date.now() / 60000);
    return fetch(urlFinal, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (txt) {
        if (/^\s*</.test(txt)) throw new Error("A planilha não está publicada como CSV");
        try { localStorage.setItem(CHAVE_CACHE, txt); } catch (e) {}
        return normalizar(lerCSV(txt));
      })
      .catch(function (erro) {
        var guardado = null;
        try { guardado = localStorage.getItem(CHAVE_CACHE); } catch (e) {}
        if (guardado) return normalizar(lerCSV(guardado));
        throw erro;
      });
  }

  /* ---------------- Favoritos ---------------- */
  function lerFavoritos() {
    try { return JSON.parse(localStorage.getItem(CHAVE_FAVORITOS)) || []; } catch (e) { return []; }
  }
  function salvarFavoritos(lista) {
    try { localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista)); } catch (e) {}
    atualizarContadorFavoritos();
  }
  function ehFavorito(id) { return lerFavoritos().indexOf(id) > -1; }
  function alternarFavorito(id) {
    var lista = lerFavoritos();
    var pos = lista.indexOf(id);
    if (pos > -1) lista.splice(pos, 1); else lista.push(id);
    salvarFavoritos(lista);
    return pos === -1;
  }
  function atualizarContadorFavoritos() {
    var n = lerFavoritos().length;
    $$(".contador-fav").forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
  }

  /* ---------------- Ícones ---------------- */
  var ICONE_CORACAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2 0 3.4 1.1 5.4 3.2C14 6.1 15.4 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>';
  var ICONE_ZAP = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>';

  /* ---------------- Card de produto ---------------- */
  function textoContador(fim) {
    var resta = fim - Date.now();
    if (resta <= 0) return null;
    var s = Math.floor(resta / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60); s -= m * 60;
    function dd(n) { return (n < 10 ? "0" : "") + n; }
    return d > 0 ? d + "d " + dd(h) + "h" : dd(h) + ":" + dd(m) + ":" + dd(s);
  }

  function htmlContador(p) {
    if (!p.fimOferta) return "";
    var t = textoContador(p.fimOferta);
    if (!t) return '<span class="contador encerrado">Prazo da oferta encerrado. Confira o preço na loja.</span>';
    return '<span class="contador" data-fim="' + p.fimOferta + '">⏱ Acaba em <b>' + t + "</b></span>";
  }

  function card(p, i, extraClasse) {
    var fav = ehFavorito(p.id);
    var rel = 'target="_blank" rel="sponsored nofollow noopener"';
    var img = p.imagem || "img/sem-imagem.svg";
    return (
      '<article class="card revelar ' + (extraClasse || "") + '" style="--i:' + ((i || 0) % 8) + '" data-id="' + esc(p.id) + '">' +
        '<div class="card-midia">' +
          '<a href="' + esc(p.link) + '" ' + rel + ' tabindex="-1" aria-hidden="true">' +
            '<img src="' + esc(img) + '" alt="' + esc(p.nome) + '" loading="lazy" decoding="async" width="400" height="400" onerror="this.onerror=null;this.src=\'img/sem-imagem.svg\'">' +
          "</a>" +
          (p.desconto ? '<span class="selo-desconto">-' + p.desconto + "%</span>" : "") +
          '<button type="button" class="btn-fav" data-fav="' + esc(p.id) + '" aria-pressed="' + fav + '" aria-label="' + (fav ? "Remover dos favoritos" : "Favoritar") + ": " + esc(p.nome) + '">' + ICONE_CORACAO + "</button>" +
          '<span class="selo-loja" style="--loja:' + esc(p.lojaCfg.cor) + ";--loja-texto:" + esc(p.lojaCfg.texto) + '">' + esc(p.loja) + "</span>" +
        "</div>" +
        '<div class="card-corpo">' +
          (p.subcategoria ? '<p class="card-sub">' + esc(p.subcategoria) + "</p>" : "") +
          '<h3 class="card-nome">' + esc(p.nome) + "</h3>" +
          (p.descricao ? '<p class="card-desc">' + esc(p.descricao) + "</p>" : "") +
          htmlContador(p) +
          '<div class="precos">' +
            (p.precoAntigo ? '<s class="preco-antigo" aria-label="Preço antigo">' + reais(p.precoAntigo) + "</s>" : "") +
            (p.preco ? '<strong class="preco-atual">' + reais(p.preco) + "</strong>" : '<strong class="preco-atual">Ver preço</strong>') +
          "</div>" +
          '<div class="card-acoes">' +
            '<a class="btn-comprar" href="' + esc(p.link) + '" ' + rel + ">" + esc(p.lojaCfg.botao) + "</a>" +
            '<button type="button" class="btn-compartilhar" data-share="' + esc(p.id) + '" aria-label="Compartilhar no WhatsApp: ' + esc(p.nome) + '">' + ICONE_ZAP + "</button>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function esqueletos(n) {
    var h = "";
    for (var i = 0; i < n; i++) h += '<div class="esqueleto" aria-hidden="true"></div>';
    return h;
  }

  /* ---------------- Animação ao rolar ---------------- */
  var observador = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("visivel"); observador.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }) : null;

  function observarRevelar(raiz) {
    $$(".revelar:not(.visivel)", raiz).forEach(function (el) {
      if (observador) observador.observe(el); else el.classList.add("visivel");
    });
  }

  /* ---------------- Contador regressivo (só com data real) ---------------- */
  function iniciarRelogio() {
    setInterval(function () {
      $$(".contador[data-fim]").forEach(function (el) {
        var t = textoContador(+el.getAttribute("data-fim"));
        if (t) {
          el.querySelector("b").textContent = t;
        } else {
          el.removeAttribute("data-fim");
          el.classList.add("encerrado");
          el.textContent = "Prazo da oferta encerrado. Confira o preço na loja.";
        }
      });
    }, 1000);
  }

  /* ---------------- Aviso rápido ---------------- */
  var tempoAviso;
  function avisar(msg) {
    var el = $(".aviso-rapido");
    if (!el) {
      el = document.createElement("div");
      el.className = "aviso-rapido";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("mostrar");
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(function () { el.classList.remove("mostrar"); }, 1800);
  }

  /* ---------------- Cliques (favoritar e compartilhar) ---------------- */
  function buscarPorId(id) {
    for (var i = 0; i < produtos.length; i++) if (produtos[i].id === id) return produtos[i];
    return null;
  }

  document.addEventListener("click", function (ev) {
    var bFav = ev.target.closest("[data-fav]");
    if (bFav) {
      var id = bFav.getAttribute("data-fav");
      var agora = alternarFavorito(id);
      var p = buscarPorId(id);
      $$('[data-fav="' + id + '"]').forEach(function (b) {
        b.setAttribute("aria-pressed", agora);
        b.setAttribute("aria-label", (agora ? "Remover dos favoritos" : "Favoritar") + ": " + (p ? p.nome : ""));
        b.classList.remove("pulsar"); void b.offsetWidth; b.classList.add("pulsar");
      });
      avisar(agora ? "❤️ Salvo nos favoritos" : "Removido dos favoritos");
      if (document.body.getAttribute("data-pagina") === "favoritos") renderFavoritos();
      return;
    }
    var bShare = ev.target.closest("[data-share]");
    if (bShare) {
      var prod = buscarPorId(bShare.getAttribute("data-share"));
      if (!prod) return;
      var texto = "🔥 " + prod.nome +
        (prod.preco ? "\n💰 " + reais(prod.preco) : "") +
        (prod.desconto ? " (" + prod.desconto + "% OFF)" : "") +
        "\n🛒 " + prod.link +
        "\n\nMais ofertas no Gol de Desconto: " + (CFG.siteURL || location.origin);
      window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank", "noopener");
    }
  });

  /* ---------------- Botão flutuante do grupo ---------------- */
  function botaoGrupo() {
    if (!CFG.grupoWhatsApp) return;
    var a = document.createElement("a");
    a.className = "botao-grupo";
    a.href = urlSegura(CFG.grupoWhatsApp);
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = ICONE_ZAP + "<span>" + esc(CFG.textoBotaoGrupo || "Grupo de promoções") + "</span>";
    a.setAttribute("aria-label", (CFG.textoBotaoGrupo || "Grupo de promoções") + " no WhatsApp");
    document.body.appendChild(a);
    $$("[data-link-grupo]").forEach(function (el) { el.href = a.href; });
  }

  /* ---------------- Página inicial ---------------- */
  function ordenarRelevancia(a, b) {
    return (b.destaque - a.destaque) || (b.maisComprado - a.maisComprado) || (b.desconto - a.desconto) || (a.ordem - b.ordem);
  }

  function renderInicio() {
    var destaques = produtos.filter(function (p) { return p.destaque; })
      .sort(function (a, b) { return b.desconto - a.desconto || a.ordem - b.ordem; });
    var maisComprados = produtos.filter(function (p) { return p.maisComprado; });

    var heroEl = $("#hero-destaque");
    if (heroEl) {
      var top = destaques[0] || produtos.slice().sort(function (a, b) { return b.desconto - a.desconto; })[0];
      heroEl.innerHTML = top
        ? '<div class="hero-destaque-titulo">⚡ Oferta em destaque</div>' + card(top, 0, "card-grande")
        : "";
      observarRevelar(heroEl);
    }

    preencherFileira("#promocoes-dia", destaques, "Nenhuma promoção do dia no momento. Volte mais tarde!");
    preencherFileira("#mais-comprados", maisComprados, "Em breve os mais comprados aparecem aqui.");
    renderAtalhos();
  }

  function preencherFileira(sel, lista, msgVazio) {
    var el = $(sel);
    if (!el) return;
    el.innerHTML = lista.length
      ? lista.map(function (p, i) { return card(p, i); }).join("")
      : '<p class="vazio">' + esc(msgVazio) + "</p>";
    observarRevelar(el);
  }

  function subcategoriasDe(categoria) {
    var vistas = {};
    produtos.forEach(function (p) {
      if (p.subcategoria && (!categoria || semAcento(p.categoria) === semAcento(categoria))) vistas[p.subcategoria] = true;
    });
    return Object.keys(vistas).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
  }

  function icone(nome) { var ic = (CFG.icones || {})[nome]; return ic ? ic + " " : ""; }

  function renderAtalhos() {
    $$("[data-chips-categoria]").forEach(function (el) {
      var cat = el.getAttribute("data-chips-categoria");
      var pagina = el.getAttribute("data-pagina-link");
      el.innerHTML = subcategoriasDe(cat).map(function (s) {
        return '<a class="chip" href="' + pagina + "?sub=" + encodeURIComponent(s) + '#catalogo">' + icone(s) + esc(s) + "</a>";
      }).join("");
    });
  }

  /* ---------------- Catálogo (busca, filtros, ordenação) ---------------- */
  var FAIXAS = {
    "0-100": [0, 100], "100-300": [100, 300], "300-1000": [300, 1000], "1000-": [1000, Infinity]
  };
  var filtros = { q: "", cat: "", sub: "", loja: "", preco: "", ordem: "relevancia" };
  var categoriaFixa = "";

  function preencherSelect(sel, opcoes, rotuloTodos, valorAtual) {
    var el = $(sel);
    if (!el) return;
    el.innerHTML = '<option value="">' + esc(rotuloTodos) + "</option>" + opcoes.map(function (o) {
      return '<option value="' + esc(o) + '">' + esc(o) + "</option>";
    }).join("");
    el.value = opcoes.indexOf(valorAtual) > -1 ? valorAtual : "";
  }

  function montarOpcoesFiltros() {
    var cats = {}, lojas = {};
    produtos.forEach(function (p) { if (p.categoria) cats[p.categoria] = true; lojas[p.loja] = true; });
    preencherSelect("#f-categoria", Object.keys(cats).sort(), "Todas", filtros.cat);
    filtros.cat = $("#f-categoria") ? $("#f-categoria").value : filtros.cat;
    preencherSelect("#f-sub", subcategoriasDe(categoriaFixa || filtros.cat), "Todas", filtros.sub);
    filtros.sub = $("#f-sub") ? $("#f-sub").value : filtros.sub;
    preencherSelect("#f-loja", Object.keys(lojas).sort(), "Todas", filtros.loja);
    filtros.loja = $("#f-loja") ? $("#f-loja").value : filtros.loja;
    if ($("#f-preco")) $("#f-preco").value = FAIXAS[filtros.preco] ? filtros.preco : "";
    if ($("#f-ordem")) $("#f-ordem").value = filtros.ordem;
    if ($("#f-busca")) $("#f-busca").value = filtros.q;
  }

  function renderChipsSub() {
    var el = $("#chips-sub");
    if (!el) return;
    var subs = subcategoriasDe(categoriaFixa);
    el.innerHTML = '<button type="button" class="chip" data-sub="" aria-pressed="' + (!filtros.sub) + '">Todos</button>' +
      subs.map(function (s) {
        return '<button type="button" class="chip" data-sub="' + esc(s) + '" aria-pressed="' + (filtros.sub === s) + '">' + icone(s) + esc(s) + "</button>";
      }).join("");
  }

  function filtrar() {
    var termos = semAcento(filtros.q).split(/\s+/).filter(Boolean);
    var faixa = FAIXAS[filtros.preco];
    var cat = categoriaFixa || filtros.cat;
    var lista = produtos.filter(function (p) {
      if (cat && semAcento(p.categoria) !== semAcento(cat)) return false;
      if (filtros.sub && p.subcategoria !== filtros.sub) return false;
      if (filtros.loja && p.loja !== filtros.loja) return false;
      if (faixa && (p.preco == null || p.preco < faixa[0] || p.preco > faixa[1])) return false;
      if (termos.length) {
        var alvo = semAcento(p.nome + " " + p.subcategoria + " " + p.loja + " " + p.descricao);
        for (var i = 0; i < termos.length; i++) if (alvo.indexOf(termos[i]) === -1) return false;
      }
      return true;
    });
    var ordens = {
      relevancia: ordenarRelevancia,
      desconto: function (a, b) { return b.desconto - a.desconto || a.ordem - b.ordem; },
      "menor-preco": function (a, b) { return (a.preco || Infinity) - (b.preco || Infinity); },
      "mais-comprados": function (a, b) { return (b.maisComprado - a.maisComprado) || (b.desconto - a.desconto) || (a.ordem - b.ordem); }
    };
    return lista.sort(ordens[filtros.ordem] || ordenarRelevancia);
  }

  function renderCatalogo() {
    var grade = $("#grade-catalogo");
    if (!grade) return;
    var lista = filtrar();
    grade.innerHTML = lista.length
      ? lista.map(function (p, i) { return card(p, i); }).join("")
      : '<div class="vazio"><strong>Nenhum produto encontrado 😕</strong>Tente outra palavra ou limpe os filtros.<br><button type="button" class="btn btn-secundario" data-limpar>Limpar filtros</button></div>';
    observarRevelar(grade);

    var cont = $("#contagem");
    if (cont) cont.textContent = lista.length + (lista.length === 1 ? " produto" : " produtos");

    var ativos = ["q", "sub", "loja", "preco"].filter(function (k) { return filtros[k]; }).length + (!categoriaFixa && filtros.cat ? 1 : 0);
    var num = $(".num-filtros");
    if (num) num.textContent = ativos || "";
    var limpar = $("#limpar-filtros");
    if (limpar) limpar.hidden = !ativos && filtros.ordem === "relevancia";

    $$("#chips-sub [data-sub]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-sub") === filtros.sub); });
    salvarFiltrosNaURL();
  }

  function lerFiltrosDaURL() {
    var u = new URLSearchParams(location.search);
    ["q", "cat", "sub", "loja", "preco", "ordem"].forEach(function (k) { if (u.get(k)) filtros[k] = u.get(k); });
  }

  function salvarFiltrosNaURL() {
    var u = new URLSearchParams();
    ["q", "cat", "sub", "loja", "preco"].forEach(function (k) { if (filtros[k] && !(k === "cat" && categoriaFixa)) u.set(k, filtros[k]); });
    if (filtros.ordem !== "relevancia") u.set("ordem", filtros.ordem);
    var qs = u.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  function ligarCatalogo() {
    if (!$("#grade-catalogo")) return;
    var tempoBusca;
    var busca = $("#f-busca");
    if (busca) busca.addEventListener("input", function () {
      clearTimeout(tempoBusca);
      tempoBusca = setTimeout(function () { filtros.q = busca.value.trim(); renderCatalogo(); }, 180);
    });
    var mapa = { "#f-categoria": "cat", "#f-sub": "sub", "#f-loja": "loja", "#f-preco": "preco", "#f-ordem": "ordem" };
    Object.keys(mapa).forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      el.addEventListener("change", function () {
        filtros[mapa[sel]] = el.value || (sel === "#f-ordem" ? "relevancia" : "");
        if (sel === "#f-categoria") {
          filtros.sub = "";
          preencherSelect("#f-sub", subcategoriasDe(filtros.cat), "Todas", "");
        }
        renderCatalogo();
      });
    });
    var bFiltros = $("#btn-filtros");
    if (bFiltros) bFiltros.addEventListener("click", function () {
      var painel = $("#painel-filtros");
      var aberto = painel.classList.toggle("aberto");
      bFiltros.setAttribute("aria-expanded", aberto);
    });
    document.addEventListener("click", function (ev) {
      var chip = ev.target.closest("#chips-sub [data-sub]");
      if (chip) {
        filtros.sub = chip.getAttribute("data-sub");
        if ($("#f-sub")) $("#f-sub").value = filtros.sub;
        renderCatalogo();
        return;
      }
      if (ev.target.closest("[data-limpar], #limpar-filtros")) {
        filtros = { q: "", cat: "", sub: "", loja: "", preco: "", ordem: "relevancia" };
        montarOpcoesFiltros();
        renderCatalogo();
      }
    });
  }

  /* Busca do banner: leva para o catálogo já filtrado */
  function ligarBuscaBanner() {
    var form = $("#form-busca-banner");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var q = $("#busca-banner").value.trim();
      filtros.q = q;
      if ($("#f-busca")) $("#f-busca").value = q;
      renderCatalogo();
      var cat = $("#catalogo");
      if (cat) cat.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------------- Favoritos ---------------- */
  function renderFavoritos() {
    var el = $("#grade-favoritos");
    if (!el) return;
    var ids = lerFavoritos();
    var lista = ids.map(buscarPorId).filter(Boolean);
    el.innerHTML = lista.length
      ? lista.map(function (p, i) { return card(p, i); }).join("")
      : '<div class="vazio"><strong>Você ainda não tem favoritos ❤️</strong>Toque no coração de um produto para guardar aqui. Fica salvo neste aparelho.<br><a class="btn btn-primario" href="index.html#promocoes">Ver promoções</a></div>';
    observarRevelar(el);
  }

  /* ---------------- Erro ao carregar ---------------- */
  function mostrarErro() {
    var msg = '<div class="vazio"><strong>Não foi possível carregar as ofertas agora.</strong>Verifique sua internet e tente de novo.<br><button type="button" class="btn btn-primario" onclick="location.reload()">Tentar de novo</button></div>';
    ["#grade-catalogo", "#grade-favoritos", "#promocoes-dia", "#mais-comprados"].forEach(function (s) { var el = $(s); if (el) el.innerHTML = msg; });
    var hero = $("#hero-destaque"); if (hero) hero.innerHTML = "";
  }

  /* ---------------- Início ---------------- */
  function iniciar() {
    categoriaFixa = document.body.getAttribute("data-categoria") || "";
    $$("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    atualizarContadorFavoritos();
    botaoGrupo();
    observarRevelar(document);
    lerFiltrosDaURL();
    ligarCatalogo();
    ligarBuscaBanner();

    ["#grade-catalogo", "#grade-favoritos"].forEach(function (s) { var el = $(s); if (el) el.innerHTML = esqueletos(6); });
    ["#promocoes-dia", "#mais-comprados"].forEach(function (s) { var el = $(s); if (el) el.innerHTML = esqueletos(4); });

    carregarProdutos().then(function (lista) {
      produtos = lista;
      renderInicio();
      montarOpcoesFiltros();
      renderChipsSub();
      renderCatalogo();
      renderFavoritos();
      iniciarRelogio();
    }).catch(function (e) {
      console.error("Erro ao carregar produtos:", e);
      mostrarErro();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
