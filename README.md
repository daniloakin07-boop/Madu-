# madu backend

Backend do app madu. Recebe a foto de um texto (base64) e devolve, em um único pedido à IA:
- o texto que estava na imagem
- uma explicação simples do contexto
- 3 sugestões de resposta (educada, amigável, formal)

## Como rodar

1. Instale as dependências:
   ```
   npm install
   ```

2. Copie `.env.example` para `.env` e coloque sua chave da API da Anthropic:
   ```
   cp .env.example .env
   ```
   Você consegue essa chave em https://console.anthropic.com

3. Rode o servidor:
   ```
   npm run dev
   ```

O servidor sobe em `http://localhost:3000`.

## Endpoint

### POST /analyze-image

**Corpo da requisição (JSON):**
```json
{
  "image_base64": "string em base64 da foto",
  "media_type": "image/jpeg"
}
```

**Resposta:**
```json
{
  "texto_lido": "...",
  "explicacao": "...",
  "e_conversa": true,
  "sugestoes": {
    "educada": "...",
    "amigavel": "...",
    "formal": "..."
  }
}
```



## Demonstração ao vivo (página web)

O servidor já vem com uma página pronta em `public/index.html`. Depois de rodar `npm run dev`, abra:

```
http://localhost:3000
```



No celular, funciona direto no navegador: toque em "Tirar foto do texto", tire a foto, e a IA lê, explica e mostra as 3 sugestões de resposta. A leitura em voz alta usa a função nativa de fala do próprio navegador (não precisa de nenhuma API extra de TTS).



**Importante para amanhã:** teste isso ANTES da apresentação, de preferência no mesmo celular/rede que você vai usar. Se for apresentar num celular, o navegador vai pedir permissão de câmera — aceite antes de começar.



## Instalar como app no celular (PWA)

A página é um PWA (Progressive Web App) — dá pra instalar de verdade na tela inicial do celular, com ícone próprio e abrindo em tela cheia, sem barra de navegador:



- **Android (Chrome):** abra o endereço do servidor, toque nos três pontinhos (⋮) e depois em "Instalar aplicativo" (ou "Adicionar à tela inicial").



- **iPhone (Safari):** abra o endereço, toque no ícone de compartilhar (□↑) e depois em "Adicionar à Tela de Início".

Depois de instalado, o app abre como qualquer outro do celular — isso conta como "plataforma mobile" mesmo sem ser um APK compilado em Flutter.

Se o professor pedir para acessar de outro dispositivo na mesma rede (não só localhost), troque `localhost` pelo IP do seu computador na rede local (ex: `http://192.168.0.10:3000`) e use o mesmo Wi-Fi nos dois aparelhos.



## Testando sem o app

Com uma imagem de teste (`teste.jpg`) na mesma pasta, você pode gerar o base64 e testar o endpoint direto pelo terminal:



```bash
BASE64=$(base64 -i teste.jpg)
curl -X POST http://localhost:3000/analyze-image \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\": \"$BASE64\", \"media_type\": \"image/jpeg\"}"
```



## Próximo passo

No app Flutter, depois de tirar a foto:
1. Converter a imagem para base64
2. Enviar um POST para `/analyze-image` (hospedado em algum lugar — Railway, Render, Fly.io são opções simples e baratas para começar)
3. Usar `explicacao` como texto para o serviço de texto-para-fala (TTS)
4. Mostrar/falar as 3 opções em `sugestoes` quando o usuário pedir uma resposta#