# RCT Team Editor

Aplicação estática para importar arquivos de treinador do Radical Cobblemon Trainers, editar o time em texto Showdown e exportar o JSON mantendo a estrutura original. O processamento acontece localmente no navegador; não há backend, banco de dados ou chamadas a APIs.

## Recursos

- Importação de JSON por seletor ou arrastar e soltar; inclui o exemplo `hoenn_norman.json`.
- Editor Poképaste sincronizado com cartões para editar espécie, nível, habilidade, item e natureza.
- Cartões mostram golpes e EVs; controles permitem reordenar/remover Pokémon.
- Exportação e cópia do JSON, mantendo todos os demais dados do treinador e Pokémon.
- Validação básica de espécie, nível, EVs/IVs e limite de golpes.
- Build para GitHub Pages via GitHub Actions.

## Executar localmente

Requer Node.js 22 ou superior e npm.

```sh
npm ci
npm run dev
```

## Testes e build

```sh
npm test
npm run build
npm run preview
```

## Publicar no GitHub Pages

Envie esta pasta para a branch `main` do repositório. Em **Settings → Pages**, selecione **GitHub Actions** como fonte. O workflow `.github/workflows/deploy.yml` fará build e publicação a cada push em `main`. O Vite usa caminhos relativos (`base: './'`), adequados a sites de projeto em `https://usuario.github.io/nome-do-repositorio/` e a execução local.

## Formato e preservação

O exemplo fornecido e a [documentação oficial de trainers do RCT](https://srcmc.gitlab.io/rct/docs/latest/configuration/data_pack/trainers/) confirmam `team` como lista de Pokémon. O exemplo `hoenn_norman.json` usa `species`, `moveset`, `ivs`, `evs`, `heldItem` (inclusive lista), `gender`, `level`, `nature`, `ability` e `gimmicks`; no treinador, traz `name.literal`, `ai`, `battleRules`, `battleFormat` e `battleTheme`. A documentação ainda cita propriedades como `identity`, `bag`, `nickname`, `shiny`, `aspects` e `gimmicks` (`tera`, `dynamax`, `gmax`).

O texto converte espécie, apelido (quando escrito como `Apelido (Espécie)`), item, habilidade, nível, gênero, shiny, natureza, EVs, IVs e golpes. Natureza e IDs são exibidos em forma legível e normalizados para IDs no texto de volta. Os demais campos do RCT, inclusive `ai`, `battleTheme`, `gimmicks`, `aspects`, `bag`, namespaces e propriedades desconhecidas, permanecem no objeto original e são copiados para o JSON exportado. A lista de itens alternativos em `heldItem` é preservada quando o item primário não muda.

## Limitações

- Pokémon novos pelo Poképaste não são aceitos como estruturas RCT novas; a aplicação mantém a associação posicional com a entrada original e só suporta edição/remoção/reordenação de membros existentes.
- O parser cobre a sintaxe Showdown usada pelo conversor, sem tentar validar existência ou legalidade competitiva de espécies, golpes, itens ou habilidades.
- Ao editar texto que altera a ordem de membros duplicados, não existe identidade explícita no Poképaste para inferir qual entrada original foi movida. Reordene duplicados pelos controles dos cartões para preservar sem ambiguidade seus campos exclusivos.
- A validação implementada cobre estrutura, espécie, nível, EVs/IVs e até quatro golpes; validação semântica depende da versão e dos dados do mod.
- A documentação online pode abranger uma versão diferente da que gerou o arquivo de exemplo. Propriedades desconhecidas não são removidas, mas não são interpretadas.
