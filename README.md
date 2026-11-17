# Maré Limpa

Protótipo acadêmico para registrar resíduos nas praias de Tambaú e Cabo Branco, em João Pessoa (PB), e consultar os relatos para planejar futuros mutirões. O projeto aborda a meta 14.1 do ODS 14, que trata da prevenção e da redução da poluição marinha. [ODS 14 na ONU Brasil](https://brasil.un.org/pt-br/sdgs/14)

**Equipe** — Fábio Henrique, Marllon Lorran e Luiz Vinicius.

## Funcionalidades

- Registro de resíduos por praia, trecho e categoria, com descrição opcional.
- Filtros combináveis por praia, categoria e status, com busca por trecho.
- Atualização manual do status para **Recolhida** e persistência no navegador.
- Quatro relatos simulados para a primeira demonstração.

## Como executar

1. Abra a pasta que contém este README em um terminal.
2. Com Python 3 instalado, execute:

   ```powershell
   python -m http.server 8000 --bind 127.0.0.1
   ```

3. Abra [http://127.0.0.1:8000](http://127.0.0.1:8000) no navegador. Use o mesmo endereço e perfil do navegador ao voltar à demonstração.
4. Encerre o servidor com **Ctrl+C**.

O aplicativo usa HTML, CSS e JavaScript puro. O servidor entrega arquivos estáticos e a demonstração funciona sem internet, instalação de pacotes, cadastro, GPS, API externa ou banco de dados remoto. A abertura direta de `index.html` também funciona em navegadores que permitem `localStorage` para arquivos locais. O servidor local é o caminho recomendado para verificar a persistência.

Na primeira abertura são criados quatro relatos marcados como **Dados simulados**. Registros e alterações ficam no `localStorage` do endereço e perfil em uso. A imagem de abertura é ilustrativa, gerada a partir de uma descrição inspirada no litoral de João Pessoa.

## Roteiro curto de apresentação

1. Em **Início**, apresente o ODS 14, a meta 14.1 e a equipe. Explique como os relatos ajudam voluntários a localizar trechos para um mutirão.
2. Abra **Registrar ocorrência**. Tente salvar o formulário vazio para mostrar as mensagens de validação.
3. Selecione **Cabo Branco** e **Plástico**, informe **Acesso à areia perto da ciclovia** e, se desejar, descreva o resíduo. Salve e mostre a confirmação e o status **Registrada**.
4. Em **Ocorrências**, abra **Filtros** no celular e selecione **Cabo Branco** e **Plástico**. Mostre também a busca por trecho. Use **Limpar filtros** para voltar à lista e apontar os quatro relatos com o selo **Dados simulados**.
5. Clique em **Marcar como recolhida**. Explique que é uma atualização manual. Recarregue a página, aplique os mesmos filtros e confirme o status **Recolhida**.


## Capturas de tela

| Tela | Celular (390 px) | Desktop (1440 px) |
| --- | --- | --- |
| Início | [Ver no celular](capturas/inicio-celular.png) | [Ver no desktop](capturas/inicio-desktop.png) |
| Ocorrências | [Ver no celular](capturas/ocorrencias-celular.png) | [Ver no desktop](capturas/ocorrencias-desktop.png) |

## Imagem de abertura

`litoral.jpg` foi criada com a ferramenta integrada ImageGen. Prompt usado:

> Photoreal editorial aerial coastline photograph for the full-width shallow hero of a Brazilian beach cleanup web app. Wide landscape ratio 3:2. At the left two thirds, deep navy teal ocean water with very subtle natural surface texture and no breaking waves, to support a white text overlay. At the far right, an angled strip of warm golden sand bordered by the turquoise shallows and lacy white foam of one ocean wave, diagonal running from upper right to lower middle-right. Overhead drone viewpoint. Warm natural daylight, rich realistic ocean colors, believable fine texture. Inspired by the coast of João Pessoa without depicting identifiable landmarks. No people, no typography, no illustration, no graphics, no watermark.
