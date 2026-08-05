# Hapuck Scents — site vitrine

Site estático. Sem build, sem dependências, sem servidor: é só subir a pasta.

## Antes de publicar

1. **Número do WhatsApp** — abra `build.py` e troque a linha `WHATSAPP = "..."`
   pelo número real (DDI + DDD + número, só dígitos). Troque também `SITE` pelo
   domínio final. Depois rode `python3 build.py` para regravar as páginas.
2. **Fotos** — veja `assets/img/FOTOS-NECESSARIAS.txt`. Enquanto o arquivo não
   existe, o site mostra um quadro na cor da marca com a legenda do que vai ali,
   então nada quebra durante a produção.
3. **Preços e textos** — tudo vive na lista `PRODUTOS`, no topo do `build.py`.
   Para incluir um produto novo, copie um bloco existente e rode o build.

## Publicar

Arraste a pasta `site/` para o Netlify Drop, ou aponte a Vercel para o
repositório. Nenhuma configuração é necessária.

## Estrutura

- `index.html` — home
- `difusores.html`, `perfumes-de-corpo.html`, `buques-de-flor.html` — coleções
- `colecao.html` — tudo junto, com filtro por nota
- uma página por produto (`difusor-flor-de-laranjeira.html` etc.)
- `sobre.html`, `contato.html`
- `assets/css/hapuck.css` — toda a identidade visual
- `assets/js/hapuck.js` — animações e filtros
- `sitemap.xml`, `robots.txt` — prontos

Cada página de produto já sai com Open Graph e Schema.org do tipo Product.
