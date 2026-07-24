require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// aceita imagens em base64, então precisamos de um limite maior que o padrão
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';

// Esse é o "cérebro" do madu: recebe a foto e devolve texto lido,
// explicação do contexto e as 3 sugestões de resposta, tudo em um
// único pedido à IA.
const SYSTEM_PROMPT = `Você é a IA do aplicativo de acessibilidade "madu". Você recebe a foto de um texto (mensagem, carta, documento, conversa) e ajuda uma pessoa com deficiência visual, idosa ou com dificuldade de leitura a entender e responder a esse texto.

Responda SEMPRE em português do Brasil, em tom simples e direto, como se estivesse explicando para alguém que vai ouvir a resposta em voz alta (não ler na tela).

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, no seguinte formato:

{
  "texto_lido": "transcrição fiel do texto que está na imagem",
  "explicacao": "explicação curta e simples do que o texto significa, em 1 ou 2 frases, como se estivesse contando pra alguém",
  "e_conversa": true ou false (true se parecer uma mensagem/conversa que espera resposta, false se for só um documento informativo),
  "sugestoes": {
    "educada": "sugestão de resposta em tom educado e respeitoso",
    "amigavel": "sugestão de resposta em tom amigável e descontraído",
    "formal": "sugestão de resposta em tom formal, para contextos profissionais"
  }
}

Se o texto não parecer uma conversa que precisa de resposta (por exemplo, uma bula de remédio ou uma placa), deixe "sugestoes" como null e "e_conversa" como false.
Se a imagem não tiver texto legível, devolva "texto_lido": null e explique isso em "explicacao".`;

app.post('/analyze-image', async (req, res) => {
  try {
    const { image_base64, media_type } = req.body;

    if (!image_base64) {
      return res.status(400).json({ error: 'image_base64 é obrigatório' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inline_data: {
                    mime_type: media_type || 'image/jpeg',
                    data: image_base64,
                  },
                },
                { text: 'Analise essa imagem seguindo as instruções do sistema e devolva apenas o JSON.' },
              ],
            },
          ],
          generationConfig: { response_mime_type: 'application/json' },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro da API de IA:', data);
      return res.status(502).json({ error: 'Falha ao processar a imagem' });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // a IA foi instruída a devolver só JSON, mas por segurança removemos
    // possíveis blocos de markdown (```json ... ```) antes de fazer o parse
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Não foi possível interpretar a resposta da IA:', rawText);
      return res.status(502).json({ error: 'Resposta da IA em formato inesperado' });
    }

    res.json(parsed);
  } catch (err) {
    console.error('Erro no /analyze-image:', err);
    res.status(500).json({ error: 'Erro interno ao processar a imagem' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`madu backend rodando na porta ${PORT}`));