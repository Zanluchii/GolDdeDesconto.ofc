/* =========================================================
   CONFIGURAÇÃO DO GOL DE DESCONTO
   Este é o arquivo que você vai editar pelo celular.
   Troque só o que está entre aspas "assim".
   ========================================================= */
window.GOL_CONFIG = {

  /* 1) LINK DA SUA PLANILHA (Google Sheets publicada como CSV)
     Enquanto estiver vazio (""), o site usa a planilha de exemplo.
     Ex.: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv" */
  planilhaCSV: "",

  /* Planilha de exemplo que vem junto com o site (não precisa mexer) */
  planilhaExemplo: "dados/produtos-exemplo.csv",

  /* 2) LINK DO SEU GRUPO DE PROMOÇÕES NO WHATSAPP
     Abra o grupo > Convidar via link > Copiar link e cole aqui. */
  grupoWhatsApp: "https://chat.whatsapp.com/COLE-SEU-LINK-AQUI",

  /* Texto do botão flutuante do grupo */
  textoBotaoGrupo: "Grupo de promoções",

  /* 3) ENDEREÇO DO SITE (usado no compartilhamento pelo WhatsApp) */
  siteURL: "https://gol-de-desconto.vercel.app",

  /* 4) LOJAS: nome como aparece na planilha, cor do selo, cor do texto
     e como fica o botão ("na Amazon", "no Mercado Livre"...) */
  lojas: {
    "Amazon":        { cor: "#FF9900", texto: "#111111", botao: "Ver na Amazon" },
    "Shopee":        { cor: "#EE4D2D", texto: "#FFFFFF", botao: "Ver na Shopee" },
    "Mercado Livre": { cor: "#FFE600", texto: "#2D3277", botao: "Ver no Mercado Livre" },
    "Magalu":        { cor: "#0086FF", texto: "#FFFFFF", botao: "Ver na Magalu" },
    "Outra":         { cor: "#5B6875", texto: "#FFFFFF", botao: "Ver na loja" }
  },

  /* 5) ÍCONES DAS SUBCATEGORIAS (opcional, só enfeite) */
  icones: {
    "Esportes": "⚽", "Tecnologia": "⚡",
    "Futebol": "⚽", "Academia": "🏋️", "Corrida": "👟",
    "Celulares": "📱", "Fones": "🎧", "Games": "🎮", "Acessórios": "🔌"
  }
};
