# ⚽⚡ Gol de Desconto: manual pelo celular

Este é o seu site de ofertas de **Esportes** e **Tecnologia**. Os produtos vêm de uma **planilha do Google Sheets**. Depois que tudo estiver ligado, para adicionar produto ou trocar preço você mexe **só na planilha**, sem programar e sem publicar nada de novo.

Tudo aqui pode ser feito pelo celular. Use o navegador **Chrome** (ou Safari no iPhone) e o app **Planilhas Google**.

---

## Índice

1. [Publicar o site pela primeira vez (Vercel)](#1-publicar-o-site-pela-primeira-vez-vercel)
2. [Criar a sua planilha e ligar ao site](#2-criar-a-sua-planilha-e-ligar-ao-site)
3. [Como adicionar um produto](#3-como-adicionar-um-produto)
4. [Trocar preço, esconder ou destacar um produto](#4-trocar-preço-esconder-ou-destacar-um-produto)
5. [Como trocar o link do grupo do WhatsApp](#5-como-trocar-o-link-do-grupo-do-whatsapp)
6. [Como mudar as cores](#6-como-mudar-as-cores)
7. [Como publicar uma atualização](#7-como-publicar-uma-atualização)
8. [Se o endereço do site for diferente](#8-se-o-endereço-do-site-for-diferente)
9. [Problemas comuns](#9-problemas-comuns)

---

## 1. Publicar o site pela primeira vez (Vercel)

O site está no seu GitHub, no repositório **GolDdeDesconto.ofc**. A Vercel lê esse repositório e coloca o site no ar de graça.

### Passo 1: levar as mudanças para o ramo principal (`main`)

O site foi criado num ramo de trabalho separado. A Vercel publica o ramo `main`, então é preciso juntar os dois:

1. No Chrome, abra **github.com** e entre no repositório **GolDdeDesconto.ofc**.
2. Toque em **Pull requests**, depois em **New pull request**.
3. Em **compare**, escolha o ramo `claude/optimistic-galileo-69eads`.
4. Toque em **Create pull request** e depois em **Merge pull request** → **Confirm merge**.

> Se aparecer uma faixa amarela dizendo "had recent pushes" com o botão **Compare & pull request**, pode tocar nela. É o mesmo caminho.

### Passo 2: criar o site na Vercel

1. Abra **vercel.com** e toque em **Sign Up** (ou **Log in**).
2. Escolha **Continue with GitHub** e autorize.
3. Toque em **Add New…** → **Project**.
4. Ache o repositório **GolDdeDesconto.ofc** e toque em **Import**. Se ele não aparecer, toque em "Adjust GitHub App Permissions" e libere o repositório.
5. Em **Project Name**, escreva `gol-de-desconto`.
6. Em **Framework Preset**, deixe **Other**. Não mexa em mais nada.
7. Toque em **Deploy** e espere cerca de 1 minuto.

Pronto! O site fica em **https://gol-de-desconto.vercel.app**.

> ⚠️ Se a Vercel disser que esse nome já existe e der outro endereço, anote o endereço e siga a [seção 8](#8-se-o-endereço-do-site-for-diferente).

A partir de agora, **toda alteração salva no ramo `main` do GitHub é publicada sozinha** em cerca de 1 minuto.

---

## 2. Criar a sua planilha e ligar ao site

Enquanto você não liga a sua planilha, o site mostra os **12 produtos de exemplo** (são fictícios, com links para a página inicial das lojas). Troque pela sua antes de divulgar o site.

### Passo 1: criar a planilha com as colunas certas

O jeito mais fácil é copiar a planilha de exemplo:

1. No app **Planilhas Google**, crie uma planilha nova chamada `Gol de Desconto`.
2. Na célula **A1**, cole esta fórmula e confirme:
   ```
   =IMPORTDATA("https://gol-de-desconto.vercel.app/dados/produtos-exemplo.csv")
   ```
   Se o seu endereço for outro, troque o começo do link.
3. A planilha se enche com os produtos de exemplo.
4. Toque no quadradinho do canto (acima do "1" e à esquerda do "A") para selecionar tudo e toque em **Copiar**.
5. Toque de novo, segurando, na célula **A1** → **Colar especial** → **Colar somente valores**.
   Isso troca a fórmula pelos dados de verdade, e agora você pode editar à vontade.

> Se preferir, crie a planilha do zero digitando os títulos da tabela abaixo na **linha 1**, um por coluna.

### As colunas

A **linha 1** precisa ter estes títulos. A ordem pode mudar, mas os nomes têm que ser estes:

| Coluna | O que colocar | Exemplo |
|---|---|---|
| `nome` | Nome do produto | Chuteira Society Strike Pro |
| `categoria` | **Esportes** ou **Tecnologia** | Esportes |
| `subcategoria` | Futebol, Academia, Corrida, Celulares, Fones, Games, Acessórios… | Futebol |
| `loja` | **Amazon**, **Shopee**, **Mercado Livre**, **Magalu** ou **Outra** | Amazon |
| `link_afiliado` | Seu link de afiliado completo | https://amzn.to/xxxx |
| `imagem_url` | Link da foto do produto | https://…/foto.jpg |
| `preco_atual` | Preço de agora | 249,90 |
| `preco_antigo` | Preço "de" (opcional) | 399,90 |
| `descricao_curta` | 1 ou 2 frases | Solado para grama sintética… |
| `destaque` | **sim** para aparecer em "Promoções do dia" | sim |
| `mais_comprado` | **sim** para aparecer em "Mais comprados" | não |
| `fim_oferta` | Data e hora em que a oferta acaba (opcional) | 30/11/2026 23:59 |
| `ativo` | **não** esconde o produto sem apagar | sim |

O site faz sozinho:
- **% de desconto**: calculado a partir de `preco_antigo` e `preco_atual`. Se o preço antigo ficar vazio, não aparece desconto.
- **Contador regressivo**: só aparece quando `fim_oferta` tem uma data. A hora é a **de Brasília**. Sem data, sem contador (nada de urgência falsa). Depois que a data passa, o card avisa "Prazo da oferta encerrado".
- **Botão da loja**: "Ver na Amazon", "Ver no Mercado Livre" etc., com a cor de cada loja.

### Passo 2: publicar a planilha como CSV

Essa parte só existe na versão de computador do Google Planilhas. Dá para fazer pelo celular, e é **só uma vez**:

1. No Chrome, abra **sheets.google.com** e abra a sua planilha.
2. Toque nos **3 pontinhos** do Chrome e marque **Versão para computador**.
3. No menu da planilha: **Arquivo** → **Compartilhar** → **Publicar na Web**.
4. No primeiro campo, escolha a aba dos produtos (ex.: "Página1"). No segundo, escolha **Valores separados por vírgula (.csv)**.
5. Toque em **Publicar** → **OK**.
6. **Copie o link** que aparece. Ele termina com `output=csv`.

### Passo 3: colar o link no site

1. No GitHub, abra o repositório e entre em `js` → `config.js`.
2. Toque no **lápis ✏️** (Edit).
3. Ache esta linha:
   ```js
   planilhaCSV: "",
   ```
   e cole o seu link entre as aspas:
   ```js
   planilhaCSV: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv",
   ```
4. Toque em **Commit changes…** → **Commit changes**.

Em cerca de 1 minuto, o site passa a mostrar os produtos da **sua** planilha. 🎉

---

## 3. Como adicionar um produto

1. Abra a planilha no app **Planilhas Google**.
2. Preencha uma **linha nova** embaixo da última.
3. Pronto. O Google atualiza o arquivo publicado em **até 5 minutos** e o site mostra o produto sozinho.

### Dicas para pegar os links

- **Link de afiliado:** gere no painel de afiliados de cada loja (Amazon Associados, Shopee Afiliados, Mercado Livre Afiliados, Parceiro Magalu) e cole o link completo.
- **Foto do produto:** na página do produto (no Chrome), **segure o dedo em cima da foto** → **Copiar endereço da imagem** e cole em `imagem_url`. O link precisa começar com `https://`.
  Verifique as regras do seu programa de afiliados sobre o uso das imagens. A Amazon, por exemplo, oferece imagens pela barra **SiteStripe**.
- **Preço:** pode escrever `249,90`, `R$ 249,90` ou `1.299,00`. O site entende todos.
- **Data:** escreva `30/11/2026 23:59` (ou só `30/11/2026`, que vale até 23:59 desse dia).

---

## 4. Trocar preço, esconder ou destacar um produto

Tudo na planilha:

- **Trocar preço:** mude `preco_atual` e/ou `preco_antigo`.
- **Esconder sem apagar:** escreva `não` em `ativo`. Para voltar, escreva `sim`.
- **Promoções do dia:** escreva `sim` em `destaque`. O produto em destaque com maior desconto também aparece grande no banner do topo.
- **Mais comprados:** escreva `sim` em `mais_comprado`.
- **Mudar a ordem:** os produtos aparecem na ordem da planilha, com os destaques primeiro.

As mudanças aparecem em até 5 minutos.

---

## 5. Como trocar o link do grupo do WhatsApp

1. No WhatsApp, abra o grupo → toque no nome do grupo → **Convidar via link** → **Copiar link**.
2. No GitHub, abra `js/config.js` → lápis ✏️.
3. Troque o link nesta linha:
   ```js
   grupoWhatsApp: "https://chat.whatsapp.com/COLE-SEU-LINK-AQUI",
   ```
4. Se quiser, mude também o texto do botão em `textoBotaoGrupo`.
5. **Commit changes**.

> ⚠️ **Faça isso antes de divulgar o site.** Enquanto o link de exemplo estiver lá, o botão do grupo não funciona.

O mesmo link é usado no botão flutuante, no botão "Entrar no grupo VIP" do banner e na página Sobre.

---

## 6. Como mudar as cores

1. No GitHub, abra `css/style.css` → lápis ✏️.
2. Logo no topo há uma lista assim:
   ```css
   --fundo: #0b0f14;     /* fundo da página */
   --verde: #39ff88;     /* cor principal (botões de compra) */
   --laranja: #ff7a1a;   /* destaques */
   --amarelo: #ffd60a;   /* selo de desconto */
   ```
3. Troque só o código da cor (o `#` e as 6 letras/números). Pesquise "seletor de cores" no Google para achar o código da cor que você quer.
4. **Commit changes**.

> Dica: se trocar `--verde` por uma cor clara, mantenha `--verde-escuro` escuro, porque ele é a cor do texto dentro dos botões de compra.

**As cores das lojas** (selos e botões) ficam em `js/config.js`, na parte `lojas`. Ali você também pode **cadastrar uma loja nova**, copiando uma linha e trocando o nome e as cores.

---

## 7. Como publicar uma atualização

- **Produtos e preços:** não precisa publicar nada. É só editar a planilha.
- **Link do grupo, cores, textos:** edite o arquivo no GitHub (lápis ✏️) e toque em **Commit changes** no ramo `main`. A Vercel publica sozinha em cerca de 1 minuto.
- Para ver se publicou, entre em **vercel.com** → seu projeto → **Deployments**. O mais recente deve estar como **Ready** ✅.

Se o site não mudar no celular, feche e abra a aba de novo (às vezes o navegador guarda a versão antiga por alguns minutos).

---

## 8. Se o endereço do site for diferente

Se a Vercel deu outro endereço (ex.: `gol-de-desconto-abc.vercel.app`), ou se um dia você comprar um domínio próprio, troque `https://gol-de-desconto.vercel.app` pelo novo endereço nestes arquivos:

1. `js/config.js` → linha `siteURL` (usado ao compartilhar no WhatsApp)
2. `robots.txt` e `sitemap.xml`
3. Nas páginas `index.html`, `esportes.html`, `tecnologia.html`, `sobre.html`, `favoritos.html` e `404.html`, nas linhas `og:url`, `og:image` e `canonical` (no topo de cada arquivo). Elas servem para a prévia bonita quando alguém compartilha o link.

O site funciona mesmo sem o item 3; só a imagem de prévia no WhatsApp/Instagram pode não aparecer.

**Domínio próprio:** na Vercel, abra o projeto → **Settings** → **Domains** → **Add** e siga as instruções que ela mostra para o site onde você comprou o domínio.

---

## 9. Problemas comuns

| Problema | Solução |
|---|---|
| "Não foi possível carregar as ofertas" | Confira se o link em `planilhaCSV` termina com `output=csv` e se a planilha continua publicada (Arquivo → Compartilhar → Publicar na Web). |
| Produto não aparece | Veja se `ativo` não está como `não`, se `nome` e `link_afiliado` estão preenchidos e espere até 5 minutos. |
| Foto não aparece | O link da imagem precisa começar com `https://` e abrir só a foto. Se a foto não carregar, o site mostra um ícone no lugar. |
| Desconto não aparece | `preco_antigo` precisa ser **maior** que `preco_atual`. |
| Contador não aparece | Preencha `fim_oferta` com uma data futura, ex.: `30/11/2026 23:59`. |
| Botão diz "Ver em X" | A loja foi escrita diferente do cadastro. Use exatamente: Amazon, Shopee, Mercado Livre, Magalu ou Outra. |

---

## Mapa dos arquivos (para curiosos)

```
index.html          → página inicial
esportes.html       → página de Esportes
tecnologia.html     → página de Tecnologia
favoritos.html      → Meus favoritos (salvos no aparelho do visitante)
sobre.html          → Sobre
404.html            → página "não encontrada"
js/config.js        → ⭐ SUAS CONFIGURAÇÕES (planilha, grupo, lojas)
js/app.js           → funcionamento do site (não precisa mexer)
css/style.css       → ⭐ CORES e visual
dados/produtos-exemplo.csv → planilha de exemplo
img/                → logo, ícones, imagem de prévia e fotos de exemplo
```

Lembrete obrigatório: o aviso de afiliado está no rodapé de todas as páginas. Não remova: os programas de afiliados exigem esse aviso, e o CONAR recomenda deixar clara toda publicidade.
