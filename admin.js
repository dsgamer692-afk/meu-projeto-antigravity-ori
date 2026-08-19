document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const adminForm = document.getElementById('admin-form');
  const btnAdminReset = document.getElementById('btn-admin-reset');
  const btnReloadPreview = document.getElementById('btn-reload-preview');
  const previewIframe = document.getElementById('preview-iframe');

  const adminPersonaName = document.getElementById('admin-persona-name');
  const adminPersonaAge = document.getElementById('admin-persona-age');
  const adminPersonaCity = document.getElementById('admin-persona-city');
  const adminPersonaAvatar = document.getElementById('admin-persona-avatar');
  const adminPersonaPhrase = document.getElementById('admin-persona-phrase');
  const adminGeminiKey = document.getElementById('admin-gemini-key');
  const adminChatMode = document.getElementById('admin-chat-mode');
  const adminSystemPrompt = document.getElementById('admin-system-prompt');
  
  // New Sales Funnel Inputs
  const adminPixKey = document.getElementById('admin-pix-key');
  const adminPixName = document.getElementById('admin-pix-name');
  const adminAudio1Path = document.getElementById('admin-audio1-path');
  const adminAudioDeOndePath = document.getElementById('admin-audio-deonde-path');
  const adminAudio2Path = document.getElementById('admin-audio2-path');
  const adminAudio3Path = document.getElementById('admin-audio3-path');
  const adminPreviaSozinha = document.getElementById('admin-previa-sozinha');
  const adminPreviaTransando = document.getElementById('admin-previa-transando');
  const adminTabelaImagem = document.getElementById('admin-tabela-imagem');
  const adminPack850 = document.getElementById('admin-pack-850');
  const adminPack1500 = document.getElementById('admin-pack-1500');

  const DEFAULT_SYSTEM_PROMPT = `Você é a Juliana Mendes, uma garota de 22 anos de São Paulo, simpática, brincalhona e atraente. 
Você veio do TikTok e está conversando com um seguidor interessado no seu perfil. 
Responda de forma casual, carinhosa, usando pouquíssimos emojis, mensagens curtas e naturais (como se estivesse no WhatsApp).
Seu objetivo é vender seu "pack de vídeos privados". Mantenha o tom informal e sedutor.
REGRAS CRÍTICAS DE CONCORDÂNCIA E FALA:
- FALAR APENAS EM PORTUGUÊS BRASILEIRO CASUAL. NUNCA fale frases em inglês ou use termos em inglês.
- NUNCA use gírias ou expressões masculinas ou brutas (como "demorô", "fechou", "mano", "cara", "parceiro"). Você deve passar a impressão de uma pessoa totalmente feminina, doce e sensual. Em vez disso, use expressões femininas e carinhosas (como "tá bom", "combinado", "amor", "lindo", "fofo", "meu bem", "imagina rs").
- NÃO FALE FRASES QUE NÃO DÊ PARA ENTENDER, TODA FRASE PRECISA FAZER SENTIDO.
- CADA MENSAGEM DEVE SER UM PENSAMENTO COMPLETO E FINALIZADO.
- NUNCA use reticências ou três pontos (...) no final de suas mensagens. Termine sempre com ponto final (.), exclamação (!), interrogação (?) ou "rs".
- NUNCA termine uma mensagem com uma frase incompleta, cortada no meio ou com conjunções/preposições soltas (ex: 'mas', 'que', 'porque', 'se', 'então', 'tipo', 'por', 'me', 'te').
- Se seus pensamentos e frases desviarem do assunto ou responderem a uma pergunta do lead, responda brevemente e, na sequência imediata da mesma mensagem, faça a pergunta de continuação do fluxo para não deixar a conversa parar.
- VOCÊ NUNCA DEVE PEDIR O NÚMERO DO LEAD.
- Você disse no fluxo que iria "pensar" se passaria o seu número de WhatsApp pessoal. Se o lead insistir pedindo seu número, responda de forma firme, pedindo de jeito carinhoso para ele parar de ser insistente/apressado, pois você disse que iria pensar no assunto.`;

  // Default values
  const defaultSettings = {
    personaName: "Juliana Mendes",
    personaAge: 22,
    personaCity: "São Paulo",
    personaAvatar: "assets/avatar.jpg",
    personaPhrase: "Oi… você veio do TikTok né? 😌 Tava te esperando por aqui... Só respondo quem clicar no botão embaixo 👇",
    geminiKey: "",
    chatMode: "hybrid",
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    
    // New Sales Funnel Defaults
    pixKey: "marianinab1@gmail.com",
    pixName: "Maria",
    audio1Path: "assets/audio1.mp3",
    audioDeOndePath: "assets/audio_deonde.mp3",
    audio2Path: "assets/audio2.mp3",
    audio3Path: "assets/audio3.mp3",
    previaSozinha: "assets/previa_sozinha.mp4",
    previaTransando: "assets/previa_transando.mp4",
    tabelaImagemPath: "assets/tabela.png",
    pack850: "https://drive.google.com/drive/folders/125qXj_A6elvI9MSYdPZx5ujpobfVPtXU",
    pack1500: "https://drive.google.com/drive/folders/19imDvC4Jk4Jr96XCVsNspeRZ_PQVbnys"
  };

  // Load settings
  let settings = Object.assign({}, defaultSettings, JSON.parse(localStorage.getItem('FUNNEL_ADMIN_SETTINGS') || '{}'));

  // Fill form fields
  function fillForm() {
    adminPersonaName.value = settings.personaName;
    adminPersonaAge.value = settings.personaAge;
    adminPersonaCity.value = settings.personaCity;
    adminPersonaAvatar.value = settings.personaAvatar;
    adminPersonaPhrase.value = settings.personaPhrase;
    adminGeminiKey.value = settings.geminiKey || "";
    adminChatMode.value = settings.chatMode;
    adminSystemPrompt.value = settings.systemPrompt;
    
    // Fill Sales Funnel Settings
    adminPixKey.value = settings.pixKey || "marianinab1@gmail.com";
    adminPixName.value = settings.pixName || "Maria";
    adminAudio1Path.value = settings.audio1Path || "assets/audio1.mp3";
    adminAudioDeOndePath.value = settings.audioDeOndePath || "assets/audio_deonde.mp3";
    adminAudio2Path.value = settings.audio2Path || "assets/audio2.mp3";
    adminAudio3Path.value = settings.audio3Path || "assets/audio3.mp3";
    adminPreviaSozinha.value = settings.previaSozinha || "assets/previa_sozinha.mp4";
    adminPreviaTransando.value = settings.previaTransando || "assets/previa_transando.mp4";
    adminTabelaImagem.value = settings.tabelaImagemPath || "assets/tabela.png";
    adminPack850.value = settings.pack850 || "https://drive.google.com/drive/folders/125qXj_A6elvI9MSYdPZx5ujpobfVPtXU";
    adminPack1500.value = settings.pack1500 || "https://drive.google.com/drive/folders/19imDvC4Jk4Jr96XCVsNspeRZ_PQVbnys";
  }

  fillForm();

  // Save Settings Form
  adminForm.addEventListener('submit', (e) => {
    e.preventDefault();

    settings.personaName = adminPersonaName.value.trim();
    settings.personaAge = parseInt(adminPersonaAge.value) || 22;
    settings.personaCity = adminPersonaCity.value.trim();
    settings.personaAvatar = adminPersonaAvatar.value.trim();
    settings.personaPhrase = adminPersonaPhrase.value.trim();
    settings.geminiKey = adminGeminiKey.value.trim();
    settings.chatMode = adminChatMode.value;
    settings.systemPrompt = adminSystemPrompt.value.trim();
    
    // Save Sales Funnel Settings
    settings.pixKey = adminPixKey.value.trim();
    settings.pixName = adminPixName.value.trim();
    settings.audio1Path = adminAudio1Path.value.trim();
    settings.audioDeOndePath = adminAudioDeOndePath.value.trim();
    settings.audio2Path = adminAudio2Path.value.trim();
    settings.audio3Path = adminAudio3Path.value.trim();
    settings.previaSozinha = adminPreviaSozinha.value.trim();
    settings.previaTransando = adminPreviaTransando.value.trim();
    settings.tabelaImagemPath = adminTabelaImagem.value.trim();
    settings.pack850 = adminPack850.value.trim();
    settings.pack1500 = adminPack1500.value.trim();

    localStorage.setItem('FUNNEL_ADMIN_SETTINGS', JSON.stringify(settings));

    alert("Configurações salvas com sucesso!");
    reloadPreview();
  });

  // Reset to Default button
  btnAdminReset.addEventListener('click', () => {
    if (confirm("Deseja realmente resetar todas as configurações do chat para o padrão?")) {
      localStorage.removeItem('FUNNEL_ADMIN_SETTINGS');
      settings = { ...defaultSettings };
      fillForm();
      alert("Configurações resetadas com sucesso!");
      reloadPreview();
    }
  });

  // Test Gemini Key Connection
  const btnTestKey = document.getElementById('btn-test-key');
  const keyTestStatus = document.getElementById('key-test-status');

  if (btnTestKey && keyTestStatus) {
    btnTestKey.addEventListener('click', async () => {
      const apiKey = adminGeminiKey.value.trim();
      if (!apiKey) {
        keyTestStatus.style.color = '#ef4444';
        keyTestStatus.textContent = '❌ Por favor, insira uma chave API para testar.';
        return;
      }

      keyTestStatus.style.color = '#e5e7eb';
      keyTestStatus.textContent = '⏳ Testando conexão com a API do Gemini...';
      btnTestKey.disabled = true;

      const modelsToTest = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash'];
      let success = false;
      let lastError = '';

      for (const modelName of modelsToTest) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'responder apenas com a palavra: OK' }] }]
            })
          });

          const data = await response.json().catch(() => ({}));

          if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            success = true;
            keyTestStatus.style.color = '#22c55e';
            keyTestStatus.textContent = `✅ API funcionando perfeitamente! (Modelo: ${modelName})`;
            break;
          } else {
            lastError = data.error?.message || `Erro HTTP ${response.status}`;
            const errLower = lastError.toLowerCase();
            
            // If the error is specifically about the API key, stop testing immediately
            if (response.status === 400 && (errLower.includes('api key') || errLower.includes('invalid key') || errLower.includes('key not valid'))) {
              break;
            }
            if (response.status === 403) {
              break;
            }
            
            // Try the next model for other errors (like deprecation/model unavailable)
            continue;
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      if (!success) {
        keyTestStatus.style.color = '#ef4444';
        keyTestStatus.textContent = `❌ Chave inválida ou erro na API: ${lastError}`;
      }

      btnTestKey.disabled = false;
    });
  }

  // Manual Preview Reload
  btnReloadPreview.addEventListener('click', reloadPreview);

  function reloadPreview() {
    if (previewIframe) {
      try {
        previewIframe.contentWindow.location.reload();
      } catch (err) {
        // Fallback in case of origin delay issues
        previewIframe.src = previewIframe.src;
      }
    }
  }
});
