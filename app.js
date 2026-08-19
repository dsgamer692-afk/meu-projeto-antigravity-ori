document.addEventListener('DOMContentLoaded', () => {
  // Config reference
  const config = window.FUNNEL_CONFIG;
  if (!config) {
    console.error("Configuração do funil não encontrada.");
    return;
  }

  // DOM Elements
  const welcomeOverlay = document.getElementById('welcome-overlay');
  const btnStart = document.getElementById('btn-start');
  const chatAvatar = document.querySelector('.chat-avatar');
  const headerName = document.querySelector('.header-name');
  const headerStatus = document.querySelector('.header-status');
  const messagesContainer = document.getElementById('messages-container');
  const chatInput = document.getElementById('chat-input');
  const btnSendText = document.getElementById('btn-send');
  const btnMic = document.getElementById('btn-mic');
  const btnImage = document.getElementById('btn-image');
  const fileInputImage = document.getElementById('file-input-image');



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
- Se o lead pedir ou aceitar seu número de WhatsApp pessoal, você deve concordar em passar, mas cobrar uma taxinha simbólica de R$ 3,50 para liberar, e perguntar se pode enviar a chave Pix.`;

  // Forçar atualização do Prompt do Sistema no localStorage para garantir que a correção de truncamento funcione
  let rawAdminSettings = localStorage.getItem('FUNNEL_ADMIN_SETTINGS');
  if (rawAdminSettings) {
    try {
      let parsed = JSON.parse(rawAdminSettings);
      if (parsed.systemPrompt && (!parsed.systemPrompt.includes("NUNCA use gírias ou expressões masculinas") || !parsed.systemPrompt.includes("VOCÊ NUNCA DEVE PEDIR O NÚMERO DO LEAD"))) {
        parsed.systemPrompt = DEFAULT_SYSTEM_PROMPT;
        localStorage.setItem('FUNNEL_ADMIN_SETTINGS', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error("Erro ao verificar/atualizar configurações locais:", e);
    }
  }

  // Carrega configurações personalizadas ou usa as padrões do config.js
  const defaultAdminSettings = {
    personaName: config.persona.name,
    personaAge: config.persona.age,
    personaCity: config.persona.city,
    personaAvatar: config.persona.avatar,
    personaPhrase: config.persona.phrase,
    geminiKey: "",
    chatMode: "hybrid", // "hybrid", "ai", "static"
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    
    // New Sales Funnel defaults in app.js
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

  let adminSettings = Object.assign({}, defaultAdminSettings, JSON.parse(localStorage.getItem('FUNNEL_ADMIN_SETTINGS') || '{}'));

  // Sobrescrever propriedades do config em runtime com as do painel administrativo
  config.persona.name = adminSettings.personaName;
  config.persona.age = adminSettings.personaAge;
  config.persona.city = adminSettings.personaCity;
  config.persona.avatar = adminSettings.personaAvatar;
  config.persona.phrase = adminSettings.personaPhrase;

  // Gemini Chat History
  const chatHistory = [];

  // Pre-landing DOM Elements
  const profileOverlay = document.getElementById('profile-overlay');
  const btnToWelcome = document.getElementById('btn-to-welcome');
  const profileAvatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-name');
  const profileAge = document.getElementById('profile-age');
  const profileCity = document.getElementById('profile-city');
  const profilePhrase = document.getElementById('profile-phrase');
  
  // Recording panel elements
  const recordingPanel = document.getElementById('recording-panel');
  const recordingTimer = document.getElementById('recording-timer');
  const btnRecordCancel = document.getElementById('btn-record-cancel');
  const btnRecordSend = document.getElementById('btn-record-send');

  // Lightbox elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  // State Variables
  let currentStepIndex = 0;
  let currentAudio = null; // Currently playing HTML5 Audio object
  let currentAudioBtn = null; // Currently playing button element
  let currentProgressBar = null; // Currently playing progress bar
  let currentWaveform = null; // Currently active waveform container
  let currentAudioTimerText = null; // Currently active audio timer text

  // Recording State
  let mediaRecorder = null;
  let audioChunks = [];
  let recordingInterval = null;
  let recordingSeconds = 0;
  let isRecording = false;

  // Gemini response queue state
  let isGeneratingResponse = false;
  let hasPendingUserInput = false;
  let userInteractedSinceLastStep = false;

  // Funnel State Machine Variables
  let chatState = 'greeting'; // 'greeting', 'contact_saved', 'ask_photo', 'preview_sent', 'tabela_sent', 'pix_sent', 'paid'
  let selectedPackage = null; // '8.50', '15.00', '29.00'
  let sentPreviews = []; // tracks previews sent to this lead
  let promisedPix = false; // tracks if user promised pix for second preview
  let waitingForResponse = false; // blocks input during simulation
  let pendingUserMessage = null; // queues messages during bot actions
  let tabelaTimeoutId = null; // timer to automatically ask where user is from if they don't answer table query

  // Append Bot Video Message Bubble
  function appendBotVideoMessage(videoUrl) {
    const row = document.createElement('div');
    row.className = 'message-row bot';
    const now = getFormattedTime();
    row.innerHTML = `
      <div class="message-bubble video-bubble">
        <video src="${videoUrl}" controls playsinline class="chat-video"></video>
        <span class="message-time">${now}</span>
      </div>
    `;
    messagesContainer.appendChild(row);
    scrollChatToBottom();
    saveMessageToHistory('model', `[Vídeo prévia enviado pela Juliana: ${videoUrl}]`);
  }

  // Quick Replies Helpers
  const quickRepliesContainer = document.getElementById('quick-replies-container');

  function showQuickReplies(options) {
    if (!quickRepliesContainer) return;
    quickRepliesContainer.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        // Envia o texto da opção como se o usuário tivesse digitado
        chatInput.value = opt.value;
        sendTextMessage();
        hideQuickReplies();
      });
      quickRepliesContainer.appendChild(btn);
    });
    quickRepliesContainer.style.display = 'flex';
    scrollChatToBottom();
  }

  function hideQuickReplies() {
    if (!quickRepliesContainer) return;
    quickRepliesContainer.style.display = 'none';
    quickRepliesContainer.innerHTML = '';
  }

  // Start Funnel Flow
  async function startFunnelFlow() {
    if (waitingForResponse) return;
    waitingForResponse = true;

    chatState = 'greeting';
    selectedPackage = null;
    sentPreviews = [];
    promisedPix = false;
    hideQuickReplies();

    chatInput.placeholder = `${config.persona.name} está gravando áudio...`;
    showStatusIndicator('audio');
    const typingBubble = showTypingBubble();
    await sleep(7000); // 7.0s delay for audio 1 (doubled)
    typingBubble.remove();
    clearStatusIndicator();

    appendBotAudioMessage(adminSettings.audio1Path, "0:12");
    chatInput.placeholder = "Responda se você está bem...";

    waitingForResponse = false;

    // Process any queued message sent during startup
    if (pendingUserMessage) {
      const msg = pendingUserMessage;
      pendingUserMessage = null;
      processFunnelResponse(msg);
    }
  }

  function startTabelaTimeout() {
    if (tabelaTimeoutId) {
      clearTimeout(tabelaTimeoutId);
    }
    tabelaTimeoutId = setTimeout(async () => {
      if (chatState === 'tabela_sent' && !waitingForResponse) {
        waitingForResponse = true;
        
        await sendTextMessageWithTyping("meu bem, vc é de onde ?");
        chatState = 'downsell_ask_city';
        hideQuickReplies();
        
        waitingForResponse = false;
        
        // Process any queued message
        if (pendingUserMessage) {
          const msg = pendingUserMessage;
          pendingUserMessage = null;
          processFunnelResponse(msg);
        }
      }
    }, 60000); // 1 minuto
  }

  // Auxiliar para simular digitação do bot
  async function simulateBotTyping(type = 'text', durationOrText = 2000) {
    let duration = 2000;
    if (typeof durationOrText === 'string') {
      duration = calculateTypingDuration(durationOrText, type);
    } else {
      duration = durationOrText * 2; // Dobrado
    }
    
    chatInput.placeholder = type === 'audio' ? `${config.persona.name} está gravando áudio...` : (type === 'image' ? `${config.persona.name} está enviando foto...` : `${config.persona.name} está digitando...`);
    showStatusIndicator(type);
    const bubble = showTypingBubble();
    await sleep(duration);
    bubble.remove();
    clearStatusIndicator();
    chatInput.placeholder = config.settings.inputPlaceholder;
  }

  // Função auxiliar para enviar mensagem de texto simulando digitação dinâmica
  async function sendTextMessageWithTyping(text) {
    await simulateBotTyping('text', text);
    appendBotTextMessage(text);
  }

  // Gera respostas de transição personalizadas por IA correspondendo ao que o lead disse
  async function generateCustomTransition(userText, promptGuidance, fallbackText) {
    const apiKey = adminSettings.geminiKey;
    if (!apiKey) return fallbackText;

    const transitionPrompt = `Você é a Juliana Mendes, uma garota de 22 anos de São Paulo.
Você está conversando com um lead no WhatsApp e quer vender seus vídeos.

Responda à seguinte mensagem do lead: "${userText}"

Orientação para a resposta:
${promptGuidance}

Regras:
- Responda apenas em português casual (gírias de SP, estilo WhatsApp).
- Nunca use gírias masculinas.
- Responda de forma muito curta (máximo 1 frase).
- Nunca use reticências (...) no final da mensagem. Termine com pontuação adequada (. ou ! ou ? ou rs).
- Escreva apenas a mensagem de resposta direta do WhatsApp. Não use explicações, marcadores ou cabeçalhos.`;

    try {
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash'];
      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: transitionPrompt }] }],
              generationConfig: {
                maxOutputTokens: 100,
                temperature: 0.8
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResult) {
              return cleanAiResponse(textResult);
            }
          }
        } catch (err) {
          console.error("Erro ao gerar transição no modelo:", modelName, err);
        }
      }
    } catch (err) {
      console.error("Erro na geração da transição personalizada:", err);
    }
    return fallbackText;
  }

  // Process Funnel Response (State Machine)
  async function processFunnelResponse(text) {
    if (waitingForResponse) return;
    waitingForResponse = true;

    if (tabelaTimeoutId) {
      clearTimeout(tabelaTimeoutId);
      tabelaTimeoutId = null;
    }

    // Delay de leitura humano antes de digitar
    const readingDelay = 1500 + Math.random() * 2000; // 1.5 a 3.5 segundos
    await sleep(readingDelay);
    
    const lowerText = text.toLowerCase().trim();

    const isBronzeSelect = lowerText.includes('bronze') || 
                           lowerText.includes('8,50') || 
                           lowerText.includes('8.50') || 
                           lowerText.includes('8,5') || 
                           lowerText.includes('8.5') ||
                           lowerText.includes('pacote 1') ||
                           lowerText.includes('pacote um') ||
                           lowerText.includes('primeiro pacote') ||
                           lowerText.includes('primeira opção') ||
                           lowerText.includes('primeira opcao') ||
                           lowerText.includes('opção 1') ||
                           lowerText.includes('opcao 1') ||
                           lowerText.includes('5 vídeo') ||
                           lowerText.includes('5 video') ||
                           lowerText.includes('5 foto') ||
                           lowerText.includes('5 midia') ||
                           lowerText.includes('5 mídia') ||
                           (/\b5\b/.test(lowerText) && !lowerText.includes('15') && !lowerText.includes('25'));

    const isPrataSelect = lowerText.includes('prata') || 
                          lowerText.includes('15,00') || 
                          lowerText.includes('15.00') || 
                          lowerText.includes('15') ||
                          lowerText.includes('pacote 2') ||
                          lowerText.includes('pacote dois') ||
                          lowerText.includes('segundo pacote') ||
                          lowerText.includes('segunda opção') ||
                          lowerText.includes('segunda opcao') ||
                          lowerText.includes('opção 2') ||
                          lowerText.includes('opcao 2') ||
                          lowerText.includes('10 vídeo') ||
                          lowerText.includes('10 video') ||
                          lowerText.includes('10 foto') ||
                          lowerText.includes('10 midia') ||
                          lowerText.includes('10 mídia') ||
                          (/\b10\b/.test(lowerText));

    const isCallSelect = lowerText.includes('chamada') || 
                         lowerText.includes('29,00') || 
                         lowerText.includes('29.00') || 
                         lowerText.includes('29') || 
                         lowerText.includes('ligar') ||
                         lowerText.includes('ligação') ||
                         lowerText.includes('ligacao') ||
                         lowerText.includes('pacote 3') ||
                         lowerText.includes('pacote três') ||
                         lowerText.includes('pacote tres') ||
                         lowerText.includes('terceiro pacote') ||
                         lowerText.includes('terceira opção') ||
                         lowerText.includes('terceira opcao') ||
                         lowerText.includes('opção 3') ||
                         lowerText.includes('opcao 3') ||
                         (lowerText.includes('video') && !lowerText.includes('faz video') && !lowerText.includes('manda video') && !lowerText.includes('quero video')) ||
                         (lowerText.includes('vídeo') && !lowerText.includes('faz vídeo') && !lowerText.includes('manda vídeo') && !lowerText.includes('quero vídeo'));

    // Interceptor global para escolha de pacotes quando em estados avançados de venda ou downsell
    const isChoosingPackage = chatState === 'preview_sent' || 
                              chatState === 'tabela_sent' || 
                              chatState === 'pix_sent' ||
                              chatState === 'downsell_ask_city' ||
                              chatState === 'whats_downsell_confirm' ||
                              chatState === 'ask_photo' ||
                              chatState === 'contact_saved';
    
    if (isChoosingPackage) {
      if (isBronzeSelect || isPrataSelect || isCallSelect) {
        if (isBronzeSelect) {
          selectedPackage = '8.50';
          await sendTextMessageWithTyping("Perfeito amor! Vou te passar a chave Pix agora:");
          await sleep(500);
          
          const pixMsg = `${adminSettings.pixKey}\n${adminSettings.pixName} o nome, Mande o pix aí e o comprovante porfavor\n8,50`;
          await sendTextMessageWithTyping(pixMsg.replace(/\n/g, '<br>'));
          chatState = 'pix_sent';
          hideQuickReplies();
        } else if (isPrataSelect) {
          selectedPackage = '15.00';
          await sendTextMessageWithTyping("Ótima escolha, vai amar os vídeos! Vou te passar a chave Pix:");
          await sleep(500);
          
          const pixMsg = `${adminSettings.pixKey}\n${adminSettings.pixName} o nome, Mande o pix aí e o comprovante porfavor\n15,00`;
          await sendTextMessageWithTyping(pixMsg.replace(/\n/g, '<br>'));
          chatState = 'pix_sent';
          hideQuickReplies();
        } else if (isCallSelect) {
          selectedPackage = '29.00';
          await simulateBotTyping('audio', 3000);
          appendBotAudioMessage(adminSettings.audio3Path, "0:10");
          
          await sleep(1500);
          await sendTextMessageWithTyping("Aqui está a chave Pix para a nossa chamada de vídeo:");
          await sleep(500);
          
          const pixMsg = `${adminSettings.pixKey}\n${adminSettings.pixName} o nome, Mande o pix aí e o comprovante porfavor\n29,00`;
          await sendTextMessageWithTyping(pixMsg.replace(/\n/g, '<br>'));
          chatState = 'pix_sent';
          hideQuickReplies();
        }
        waitingForResponse = false;
        if (pendingUserMessage) {
          const msg = pendingUserMessage;
          pendingUserMessage = null;
          processFunnelResponse(msg);
        }
        return;
      }
    }

    // Interceptor para pedidos de prévia/vídeo
    const isAskingSexVideo = lowerText.includes('transando') || 
                             lowerText.includes('outro cara') || 
                             lowerText.includes('outro homem') || 
                             lowerText.includes('com outro') || 
                             lowerText.includes('com cara') || 
                             lowerText.includes('com homem') || 
                             lowerText.includes('fudendo') || 
                             lowerText.includes('fode') || 
                             lowerText.includes('foder') || 
                             lowerText.includes('trepando') || 
                             lowerText.includes('sexo') ||
                             lowerText.includes('comendo') ||
                             lowerText.includes('trepar');

    const isAskingPrevia = lowerText.includes('previa') || 
                           lowerText.includes('prévia') || 
                           lowerText.includes('preview') || 
                           lowerText.includes('amostra') ||
                           lowerText.includes('manda mais') ||
                           lowerText.includes('manda outro') ||
                           lowerText.includes('manda outra') ||
                           lowerText.includes('quero mais') ||
                           lowerText.includes('tem mais') ||
                           isAskingSexVideo;

    const wantsBoth = lowerText.includes('as duas') || 
                      lowerText.includes('os dois') || 
                      lowerText.includes('ambas') || 
                      lowerText.includes('todas') || 
                      lowerText.includes('os 2') || 
                      lowerText.includes('as 2') || 
                      lowerText.includes('manda tudo') || 
                      lowerText.includes('as 2 previas') || 
                      lowerText.includes('duas previas') || 
                      lowerText.includes('as duas prévias') || 
                      lowerText.includes('duas prévias');

    if (chatState !== 'paid' && chatState !== 'ask_previa_type' && isAskingPrevia && !(chatState === 'ask_photo' && wantsBoth)) {
      // 1. Se já mandou as duas prévias
      if (sentPreviews.includes('transando') && sentPreviews.includes('sozinha')) {
        const responsesPaid = [
          "amor, de graça são só essas duas de amostra, as outras completas só no VIP pagando rs",
          "já te mandei minhas duas amostras grátis lindo rs, o resto só pagando",
          "essas são as únicas de amostra amor, pra ver mais só pagando os vídeos rs",
          "de amostra são só essas duas amor rs, o resto é pago"
        ];
        const textToAppend = responsesPaid[Math.floor(Math.random() * responsesPaid.length)];
        await sendTextMessageWithTyping(textToAppend);
        waitingForResponse = false;
        return;
      }

      // 2. Se o lead pedir vídeo de sexo especificamente
      if (isAskingSexVideo) {
        if (!sentPreviews.includes('transando')) {
          await simulateBotTyping('image', 3000);
          appendBotVideoMessage(adminSettings.previaTransando);
          sentPreviews.push('transando');
          
          await sleep(1000);
          await sendTextMessageWithTyping("gostou? rs");
          await sleep(1000);
          
          if (!sentPreviews.includes('sozinha')) {
            await sendTextMessageWithTyping("quer ver a minha sozinha também ou quer a tabela de preço? rs");
          } else {
            await sendTextMessageWithTyping("se quiser ver o resto completo te mando a tabela de preço ok? rs");
            chatState = 'preview_sent';
          }
        } else {
          // Já enviou a transando, mas falta a sozinha
          await sendTextMessageWithTyping("já te mandei essa de eu transando amor rs, quer ver a minha sozinha agora?");
        }
        waitingForResponse = false;
        return;
      }

      // 3. Se ele pedir prévia genérica (e não for sexo especificamente)
      // Se nenhuma foi enviada ainda:
      if (sentPreviews.length === 0) {
        const questionsPrevia = [
          "você quer previa comigo sozinha ou transando? rs",
          "quer ver prévia de mim sozinha ou de eu transando? rs",
          "quer prévia minha sozinha ou com outro cara? rs",
          "prefere vídeo meu sozinha ou transando com outro? rs"
        ];
        const questionText = questionsPrevia[Math.floor(Math.random() * questionsPrevia.length)];
        await sendTextMessageWithTyping(questionText);
        chatState = 'ask_previa_type';
        waitingForResponse = false;
        return;
      }

      // Se já enviou uma delas, manda a outra de amostra
      if (sentPreviews.includes('sozinha') && !sentPreviews.includes('transando')) {
        await simulateBotTyping('image', 3000);
        appendBotVideoMessage(adminSettings.previaTransando);
        sentPreviews.push('transando');
        
        await sleep(1000);
        await sendTextMessageWithTyping("essa é a de eu transando... gostou? rs");
        await sleep(1000);
        await sendTextMessageWithTyping("se quiser ver mais completo te mando a tabela de preço ok? rs");
        chatState = 'preview_sent';
        waitingForResponse = false;
        return;
      }

      if (sentPreviews.includes('transando') && !sentPreviews.includes('sozinha')) {
        await simulateBotTyping('image', 3000);
        appendBotVideoMessage(adminSettings.previaSozinha);
        sentPreviews.push('sozinha');
        
        await sleep(1000);
        await sendTextMessageWithTyping("essa é de mim sozinha... gostou? rs");
        await sleep(1000);
        await sendTextMessageWithTyping("se quiser ver mais completo te mando a tabela de preço ok? rs");
        chatState = 'preview_sent';
        waitingForResponse = false;
        return;
      }
    }

    if (chatState === 'greeting') {
      // Verifica se o lead enviou uma saudação simples (ex: "oi", "olá", "oii", sem responder se está bem)
      const isGreetingPure = (lowerText === 'oi' || lowerText === 'oii' || lowerText === 'oiii' || lowerText === 'olá' || lowerText === 'ola' || lowerText === 'hello' || lowerText === 'opa');
      
      // Verifica se o lead respondeu que está bem ou perguntou de volta
      const answersWell = lowerText.includes('bem') || lowerText.includes('tudo') || lowerText.includes('bom') || lowerText.includes('otimo') || lowerText.includes('ótimo') || lowerText.includes('vou') || lowerText.includes('suave') || lowerText.includes('de boa') || lowerText.includes('estou') || lowerText.includes('tô') || lowerText.includes('to') || lowerText.includes('legal') || lowerText.includes('sim') || lowerText === 's' || lowerText === 'ss';
      
      // Verifica se perguntou o que está fazendo
      const isAskingWhatDoing = 
        lowerText.includes('fazendo') || 
        lowerText.includes('faz de bom') || 
        lowerText.includes('fazendo de bom') ||
        (/\bo\s*q\b/.test(lowerText) && (lowerText.includes('faz') || lowerText.includes('ta') || lowerText.includes('tá'))) ||
        (/\boque\b/.test(lowerText) && (lowerText.includes('faz') || lowerText.includes('ta') || lowerText.includes('tá'))) ||
        (/\bo\s*que\b/.test(lowerText) && (lowerText.includes('faz') || lowerText.includes('ta') || lowerText.includes('tá'))) ||
        lowerText.includes('ta faz') ||
        lowerText.includes('tá faz') ||
        lowerText.includes('que vc tá') ||
        lowerText.includes('que vc ta') ||
        lowerText.includes('que você está') ||
        lowerText.includes('que voce esta');

      // Verifica se o lead insiste/pede diretamente o número
      const isInsistingWhatsNumber = 
        lowerText.includes('número') || 
        lowerText.includes('numero') || 
        lowerText.includes('whatsapp') || 
        lowerText.includes('whats') || 
        lowerText.includes('zap') || 
        lowerText.includes('nº') ||
        lowerText.includes('passa logo') ||
        lowerText.includes('cadê') ||
        lowerText.includes('cade');

      if (answersWell && !isGreetingPure) {
        const askedBack = lowerText.includes('você') || lowerText.includes('vc') || lowerText.includes('contigo') || lowerText.includes('e tu') || lowerText.includes('como vai') || lowerText.includes('e vc') || lowerText.includes('e você');
        
        if (askedBack) {
          await sendTextMessageWithTyping("ah que bom, tou bem também");
        } else {
          await sendTextMessageWithTyping("Aaah, que bom! 😊");
        }
        
        await sleep(2000); // Dobrado
        await sendTextMessageWithTyping("Amor, se você for uma pessoa legal eu posso pensar em te passar meu Whatsapp pessoal, tá bom?");
        chatState = 'contact_saved';
      } else if (isInsistingWhatsNumber) {
        await handleFunnelDeviation(text,
          "O usuário está insistindo em querer o seu número de WhatsApp pessoal. Responda de forma carinhosa que você passa sim, mas cobra uma taxinha simbólica de R$ 3,50 apenas para liberar. Em seguida, pergunte se pode enviar a chave Pix.",
          "eu te passo meu whats pessoal sim amor, mas cobro uma taxinha de 3,50 só pra eu liberar rs... posso te passar a chave pix? rs"
        );
        chatState = 'whats_downsell_confirm';
      } else if (isAskingWhatDoing) {
        await handleFunnelDeviation(text,
          "O usuário perguntou o que você está fazendo. Responda de forma sensual que está deitada na cama aqui amor, peladinha do jeito que ele gosta. Em seguida, na mesma mensagem, puxe de volta perguntando amigavelmente se está tudo bem com ele.",
          "estou aqui deitada na cama amor, peladinha do jeito que você gosta rs... Mas me conta, tudo bem com você? rs"
        );
      } else if (isGreetingPure) {
        // Responde ao oi e puxa o fluxo perguntando se está bem
        await sendTextMessageWithTyping("Oii! Tudo bem com você? rs");
      } else {
        // Desvio
        await handleFunnelDeviation(text, 
          "O usuário não respondeu se está bem ou muito bem. Responda de forma casual perguntando amigavelmente se está tudo bem com ele, forçando a resposta de volta.",
          "está tudo bem com você amor? rs"
        );
      }
    }

    else if (chatState === 'contact_saved') {
      const isRefusingWhats = lowerText === 'não' || lowerText === 'nao' || lowerText === 'n' || lowerText === 'nn' ||
                              lowerText.includes('não quero') || lowerText.includes('nao quero') ||
                              lowerText.includes('não precisa') || lowerText.includes('nao precisa') ||
                              lowerText.includes('dispensa') || lowerText.includes('nem a pau') ||
                              lowerText.includes('não vale a pena') || lowerText.includes('prefiro não') ||
                              lowerText.includes('prefiro nao') || lowerText.includes('não obrigado') ||
                              lowerText.includes('nao obrigado');

      if (isRefusingWhats) {
        const refusalQuestions = [
          "ué, por que você não quer meu whats pessoal? 🥺",
          "por que não meu bem? rs",
          "nossa, por que não quer? fiquei triste agora kkk rs",
          "por que não quer amor? 🥺"
        ];
        const refusalQuestionText = refusalQuestions[Math.floor(Math.random() * refusalQuestions.length)];
        await sendTextMessageWithTyping(refusalQuestionText);
        chatState = 'contact_refused';
      } else {
        // Usuário deve responder se quer/aceita (adicionada mais flexibilidade)
        const isSaved = lowerText.includes('salvo') || lowerText.includes('salvei') || lowerText.includes('pronto') || lowerText.includes('ok') || lowerText.includes('sim') || lowerText.includes('feito') || lowerText.includes('ja') || lowerText.includes('já') || lowerText.includes('salva') || lowerText.includes('tá bom') || lowerText.includes('ta bom') || lowerText === 'tá' || lowerText === 'ta' || lowerText.includes('blz') || lowerText.includes('beleza') || lowerText.includes('salve') || lowerText.includes('combinado') || lowerText.includes('fechou') || lowerText.includes('fechado') || lowerText.includes('tá certo') || lowerText.includes('ta certo') ||
                        lowerText.includes('manda') || lowerText.includes('mande') || lowerText.includes('envia') || lowerText.includes('quero') || lowerText.includes('pode') || lowerText.includes('passa') || lowerText.includes('enviar');
        
        // Verifica se o lead insiste/pede diretamente o número
        const isInsistingWhatsNumber = 
          lowerText.includes('número') || 
          lowerText.includes('numero') || 
          lowerText.includes('whatsapp') || 
          lowerText.includes('whats') || 
          lowerText.includes('zap') || 
          lowerText.includes('nº') ||
          lowerText.includes('passa logo') ||
          lowerText.includes('cadê') ||
          lowerText.includes('cade');

        // Verifica se perguntou o que está fazendo
        const isAskingWhatDoing = 
          lowerText.includes('fazendo') || 
          lowerText.includes('faz de bom') || 
          lowerText.includes('fazendo de bom') ||
          (/\bo\s*q\b/.test(lowerText) && (lowerText.includes('faz') || lowerText.includes('ta') || lowerText.includes('tá'))) ||
          (/\boque\b/.test(lowerText) && (lowerText.includes('faz') || lowerText.includes('ta') || lowerText.includes('tá'))) ||
          (/\bo\s*que\b/.test(lowerText) && (lowerText.includes('faz') || lowerText.includes('ta') || lowerText.includes('tá'))) ||
          lowerText.includes('ta faz') ||
          lowerText.includes('tá faz') ||
          lowerText.includes('que vc tá') ||
          lowerText.includes('que vc ta') ||
          lowerText.includes('que você está') ||
          lowerText.includes('que voce esta');

        if (isSaved || isInsistingWhatsNumber) {
          await handleFunnelDeviation(text,
            "O usuário aceitou ou pediu o seu número de WhatsApp pessoal (ex: disse 'sim', 'quero', 'me envia', 'manda', etc.). Responda de forma carinhosa que você passa sim, mas cobra uma taxinha simbólica de R$ 3,50 apenas para liberar. Em seguida, pergunte se pode enviar a chave Pix.",
            "eu te passo meu whats pessoal sim amor, mas cobro uma taxinha de 3,50 só pra eu liberar rs... posso te passar a chave pix? rs"
          );
          chatState = 'whats_downsell_confirm';
        } else if (isAskingWhatDoing) {
          const whatsOffers = [
            "mas me diz, quer que eu te passe meu Whatsapp pessoal? rs",
            "mas e aí, vai querer meu Whats pessoal pra gente se falar melhor? rs",
            "mas diz aí, quer meu número pessoal pra gente conversar? rs"
          ];
          const chosenOffer = whatsOffers[Math.floor(Math.random() * whatsOffers.length)];
          
          await handleFunnelDeviation(text,
            "O usuário perguntou o que você está fazendo. Responda de forma sensual que está deitada na cama aqui amor, peladinha do jeito que você gosta. Em seguida, na mesma mensagem, puxe de volta perguntando se ele quer seu WhatsApp pessoal para vocês conversarem melhor.",
            "estou aqui deitada na cama amor, peladinha do jeito que você gosta rs... " + chosenOffer
          );
        } else {
          // Desvio comum
          const whatsOffersCommon = [
            "Mas me diz, quer que eu te passe meu Whatsapp pessoal? rs",
            "Mas e aí, vai querer meu Whats pessoal pra gente se falar melhor? rs",
            "Mas diz aí, quer meu número pessoal pra gente conversar? rs"
          ];
          const chosenOfferCommon = whatsOffersCommon[Math.floor(Math.random() * whatsOffersCommon.length)];

          await handleFunnelDeviation(text,
            "O usuário não respondeu se quer seu WhatsApp pessoal ou se concorda. Responda brevemente e puxe de volta perguntando se ele quer seu WhatsApp pessoal. Lembre-o de forma firme e fofa que você disse que iria PENSAR em dar o número, se ele insistir ou pedir o número dele, diga para parar de ser insistentemente apressado porque você ainda vai pensar.",
            chosenOfferCommon
          );
        }
      }
    }

    else if (chatState === 'whats_downsell_confirm') {
      const isRefusing = lowerText.includes('não') || lowerText.includes('nao') || lowerText.includes('nem') || lowerText.includes('nunca') || lowerText.includes('prefiro não') || lowerText.includes('prefiro nao') || lowerText === 'n' || lowerText === 'nn';

      const wantsYes = !isRefusing && (
        lowerText.includes('sim') || 
        lowerText.includes('pode') || 
        lowerText.includes('quero') || 
        lowerText.includes('manda') || 
        lowerText.includes('mande') || 
        lowerText.includes('envia') || 
        lowerText.includes('passa') || 
        lowerText.includes('tá bom') || 
        lowerText.includes('ta bom') || 
        lowerText === 'tá' || 
        lowerText === 'ta' || 
        lowerText.includes('ok') || 
        lowerText.includes('blz') || 
        lowerText.includes('beleza') || 
        lowerText.includes('manda o pix') || 
        lowerText.includes('passa o pix') || 
        lowerText.includes('manda a chave') || 
        lowerText.includes('passa a chave') ||
        lowerText.includes('cadê') || 
        lowerText.includes('cade') || 
        lowerText.includes('número') || 
        lowerText.includes('numero') || 
        lowerText.includes('whats') || 
        lowerText.includes('whatsapp') || 
        lowerText.includes('zap')
      );
      
      if (wantsYes) {
        selectedPackage = '3.50';
        await sendTextMessageWithTyping("Vou te passar a chave Pix do meu número pessoal então amor:");
        await sleep(1000);
        
        const pixMsg = `${adminSettings.pixKey}\n${adminSettings.pixName} o nome, Mande o pix aí e o comprovante porfavor\n3,50`;
        await sendTextMessageWithTyping(pixMsg.replace(/\n/g, '<br>'));
        
        chatState = 'pix_sent';
        hideQuickReplies();
      } else {
        // Se recusar ou desviar, a gente tenta voltar pro fluxo normal da prévia
        await sendTextMessageWithTyping("entendi amor rs, mas ó, posso te mandar uma prévia minha por aqui então pra você ver? 😏");
        chatState = 'ask_photo';
      }
    }

    else if (chatState === 'contact_refused') {
      if (adminSettings.chatMode === 'hybrid' && adminSettings.geminiKey) {
        const convencerText = await generateCustomTransition(
          text,
          "O usuário explicou por que não quer seu WhatsApp pessoal. Responda de forma extremamente curta (1 frase, estilo WhatsApp) correspondendo ao motivo dele de forma simpática, e termine convencendo ele a ver uma prévia sua aqui mesmo (ex: 'mas ó, posso te mandar uma prévia minha por aqui então? 😏').",
          "entendi amor rs, mas ó, posso te mandar uma prévia minha por aqui mesmo então? 😏"
        );
        await sendTextMessageWithTyping(convencerText);
      } else {
        await sendTextMessageWithTyping("entendi amor rs, mas ó, posso te mandar uma prévia minha por aqui mesmo então? 😏");
      }
      chatState = 'ask_photo';
    }

    else if (chatState === 'downsell_ask_city') {
      // O lead respondeu de onde é. Agora tocamos o áudio de downsell (R$ 3,50) e enviamos a chave Pix.
      await simulateBotTyping('audio', 3000);
      appendBotAudioMessage(adminSettings.audioDeOndePath, "0:10"); // Duração simulada
      
      await sleep(3000);
      selectedPackage = '3.50';
      await sendTextMessageWithTyping("Vou te passar a chave Pix do meu número pessoal então amor, já que não quer os vídeos:");
      await sleep(1000);
      
      const pixMsg = `${adminSettings.pixKey}\n${adminSettings.pixName} o nome, Mande o pix aí e o comprovante porfavor\n3,50`;
      await sendTextMessageWithTyping(pixMsg.replace(/\n/g, '<br>'));
      
      chatState = 'pix_sent';
      hideQuickReplies();
    }

    else if (chatState === 'ask_previa_type') {
      const isSex = lowerText.includes('transando') || lowerText.includes('outro cara') || lowerText.includes('outro homem') || lowerText.includes('com outro') || lowerText.includes('com cara') || lowerText.includes('com homem') || lowerText.includes('fudendo') || lowerText.includes('fode') || lowerText.includes('foder') || lowerText.includes('trepando') || lowerText.includes('sexo');
      
      if (isSex) {
        await simulateBotTyping('image', 3000);
        appendBotVideoMessage(adminSettings.previaTransando);
        sentPreviews.push('transando');
      } else {
        await simulateBotTyping('image', 3000);
        appendBotVideoMessage(adminSettings.previaSozinha);
        sentPreviews.push('sozinha');
      }
      
      await sleep(1000);
      await sendTextMessageWithTyping("Aprovada? rs");
      await sleep(1000);
      await sendTextMessageWithTyping("Se quiser te mando aqui a tabela de preço ok?");
      chatState = 'preview_sent';
    }
    
    else if (chatState === 'ask_photo') {
      // Usuário respondendo à pergunta da fotinha
      const wantsBoth = lowerText.includes('as duas') || lowerText.includes('os dois') || lowerText.includes('ambas') || lowerText.includes('todas') || lowerText.includes('os 2') || lowerText.includes('as 2') || lowerText.includes('manda tudo') || lowerText.includes('as 2 previas') || lowerText.includes('duas previas') || lowerText.includes('as duas prévias') || lowerText.includes('duas prévias');
      const wantsSex = lowerText.includes('transando') || lowerText.includes('outro cara') || lowerText.includes('com cara') || lowerText.includes('com homem') || lowerText.includes('com outro') || lowerText.includes('fudendo') || lowerText.includes('fode');
      const wantsYes = lowerText.includes('sim') || lowerText.includes('pode') || lowerText.includes('quero') || lowerText.includes('manda') || lowerText.includes('mande') || lowerText.includes('bora') || lowerText.includes('com certeza') || lowerText.includes('clar') || lowerText.includes('demorou') || lowerText.includes('opa') || lowerText.includes('obvio') || lowerText.includes('óbvio') || lowerText.includes('ctz') || lowerText.includes('com crtz') || lowerText.includes('mandaa') || lowerText.includes('tá bom') || lowerText.includes('ta bom') || lowerText === 'tá' || lowerText === 'ta';
      const wantsNo = lowerText.includes('não') || lowerText.includes('nao') || lowerText === 'n' || lowerText === 'nn' || lowerText.includes('dispensa') || lowerText.includes('precisa não') || lowerText.includes('precisa nao');

      if (wantsBoth) {
        if (promisedPix) {
          // Já prometeu Pix, então envia a outra prévia
          const prevToSend = sentPreviews.includes('sozinha') ? adminSettings.previaTransando : adminSettings.previaSozinha;
          await sendTextMessageWithTyping("Tá bom amor, aqui está a outra prévia então... 😈");
          await simulateBotTyping('image', 2500); // simulate video upload
          appendBotVideoMessage(prevToSend);
          sentPreviews.push(prevToSend.includes('transando') ? 'transando' : 'sozinha');
          
          await sleep(1000);
          await sendTextMessageWithTyping("Aprovadas? rs");
          await sleep(1000);
          await sendTextMessageWithTyping("Se quiser te mando aqui a tabela de preço ok?");
          chatState = 'preview_sent';
        } else {
          await sendTextMessageWithTyping("Se eu te mandar a outra prévia também, depois você promete que vai fechar um dos meus pacotes no Pix? 🥺");
          promisedPix = true;
          // permanece no estado ask_photo até confirmar
        }
      } else if (wantsSex) {
        await simulateBotTyping('image', 3000);
        appendBotVideoMessage(adminSettings.previaTransando);
        sentPreviews.push('transando');
        
        await sleep(1000);
        await sendTextMessageWithTyping("Aprovada? rs");
        await sleep(1000);
        await sendTextMessageWithTyping("Se quiser te mando aqui a tabela de preço ok?");
        chatState = 'preview_sent';
      } else if (wantsYes || promisedPix) {
        // Se prometeu Pix agora (confirmou o sim do wantsBoth) ou só disse sim comum
        if (promisedPix && (lowerText.includes('prometo') || lowerText.includes('sim') || lowerText.includes('com certeza') || lowerText.includes('fecho') || lowerText.includes('vou'))) {
          // Envia as duas
          await simulateBotTyping('image', 3000);
          appendBotVideoMessage(adminSettings.previaSozinha);
          sentPreviews.push('sozinha');
          
          await sleep(1000);
          await sendTextMessageWithTyping("E essa é a que você pediu transando... 😈🔥");
          await simulateBotTyping('image', 3000);
          appendBotVideoMessage(adminSettings.previaTransando);
          sentPreviews.push('transando');
          
          await sleep(1000);
          await sendTextMessageWithTyping("Aprovadas? rs");
          await sleep(1000);
          await sendTextMessageWithTyping("Se quiser te mando aqui a tabela de preço ok?");
          chatState = 'preview_sent';
        } else {
          // Envia prévia sozinha padrão
          await simulateBotTyping('image', 3000);
          appendBotVideoMessage(adminSettings.previaSozinha);
          sentPreviews.push('sozinha');
          
          await sleep(1000);
          await sendTextMessageWithTyping("Aprovada? rs");
          await sleep(1000);
          await sendTextMessageWithTyping("Se quiser te mando aqui a tabela de preço ok?");
          chatState = 'preview_sent';
        }
      } else if (wantsNo) {
        await sendTextMessageWithTyping("Ué, por que não? 🥺 Deixa de ser bobo, prometo que você vai gostar rs. Dá uma olhadinha aí e me diz o que achou:");
        await sleep(1000);
        
        await simulateBotTyping('image', 3000);
        appendBotVideoMessage(adminSettings.previaSozinha);
        sentPreviews.push('sozinha');
        
        await sleep(1000);
        await sendTextMessageWithTyping("Aprovada? rs");
        await sleep(1000);
        await sendTextMessageWithTyping("Se quiser te mando aqui a tabela de preço ok?");
        chatState = 'preview_sent';
      } else {
        // Desvio
        await handleFunnelDeviation(text,
          "O usuário não respondeu se quer ver a foto/prévia. Responda brevemente e termine perguntando se ele quer ver a prévia.",
          "Mas me diz, posso te mandar uma fotinha da prévia pra você ver? kkkk"
        );
      }
    }
    
    else if (chatState === 'preview_sent') {
      const isConfirmed = lowerText.includes('sim') || lowerText.includes('pode') || lowerText.includes('quero') || lowerText.includes('manda') || lowerText.includes('mande') || lowerText.includes('tabela') || lowerText.includes('preco') || lowerText.includes('preço') || lowerText.includes('valor') || lowerText.includes('quanto') || lowerText.includes('qnt') || lowerText.includes('qnto') || lowerText.includes('custa') || lowerText.includes('valores') || lowerText.includes('certeza') || lowerText.includes('claro') || lowerText.includes('clar') || lowerText.includes('ctz') || lowerText.includes('demorou') || lowerText.includes('bora') || lowerText.includes('ok') || lowerText.includes('envia') || lowerText.includes('enviar') || lowerText.includes('blz') || lowerText.includes('beleza') || lowerText.includes('óbvio') || lowerText.includes('obvio') || lowerText.includes('tá bom') || lowerText.includes('ta bom') || lowerText === 'tá' || lowerText === 'ta';
      const wantsNo = lowerText.includes('não') || lowerText.includes('nao') || lowerText === 'n' || lowerText === 'nn' || lowerText.includes('dispensa') || lowerText.includes('precisa não') || lowerText.includes('precisa nao');
      
      const isPraising = lowerText.includes('gostosa') || 
                         lowerText.includes('delicia') || 
                         lowerText.includes('delícia') || 
                         lowerText.includes('linda') || 
                         lowerText.includes('perfeita') || 
                         lowerText.includes('gata') || 
                         lowerText.includes('gatinha') || 
                         lowerText.includes('tesão') || 
                         lowerText.includes('tesao') || 
                         lowerText.includes('tesuda') || 
                         lowerText.includes('maravilhosa') || 
                         lowerText.includes('deliciosa') || 
                         lowerText.includes('gostoso') || 
                         lowerText.includes('gostosura') || 
                         lowerText.includes('gatinho') ||
                         lowerText.includes('gato') ||
                         lowerText.includes('lindo') ||
                         lowerText.includes('fofo') ||
                         lowerText.includes('amor');

      if (isConfirmed) {
        const isAskingNaked = lowerText.includes('pelada') || 
                              lowerText.includes('peladinha') || 
                              lowerText.includes('nua') || 
                              lowerText.includes('nude') || 
                              lowerText.includes('nudes') || 
                              lowerText.includes('peito') || 
                              lowerText.includes('bunda') || 
                              lowerText.includes('ver você') || 
                              lowerText.includes('ver vc') || 
                              lowerText.includes('gostosa') ||
                              lowerText.includes('pelado');
        
        let transitionText = "";
        if (isAskingNaked) {
          transitionText = "amor, eu sei que você quer me ver peladinha 😈 mas eu prometo que você não vai se arrepender de dar uma analisada na tabela de preços rs";
        } else {
          if (adminSettings.chatMode === 'hybrid' && adminSettings.geminiKey) {
            transitionText = await generateCustomTransition(
              text,
              "O usuário concordou em ver a tabela de preços. Responda de forma extremamente curta (1 frase, estilo WhatsApp, poucas palavras) correspondendo de forma fofa ao que ele disse e introduzindo a tabela de preços. Termine com 'rs'.",
              "perfeito amor, vou te mandar a tabela aqui então rs"
            );
          } else {
            transitionText = "perfeito amor, vou te mandar a tabela aqui então rs";
          }
        }
        await sendTextMessageWithTyping(transitionText);
        await sleep(1000);

        await simulateBotTyping('audio', 3000);
        appendBotAudioMessage(adminSettings.audio2Path, "0:15");
        
        await sleep(1500);
        // Tabela enviada como foto (assets/tabela.png ou caminho personalizado)
        await simulateBotTyping('image', 3000);
        appendBotImageMessage(adminSettings.tabelaImagemPath || "assets/tabela.png");
        
        await sleep(1000);
        await sendTextMessageWithTyping("Existem essas 3 opções no pacote amor. Qual delas você vai querer? 😊");
        
        chatState = 'tabela_sent';
        startTabelaTimeout();
        // Mostrar botões de respostas rápidas
        showQuickReplies([
          { text: "Bronze - R$ 8,50", value: "Bronze (R$ 8,50)" },
          { text: "Prata - R$ 15,00", value: "Prata (R$ 15,00)" },
          { text: "Chamada - R$ 29,00", value: "Chamada de Vídeo (R$ 29,00)" }
        ]);
      } else if (wantsNo) {
        if (adminSettings.chatMode === 'hybrid' && adminSettings.geminiKey) {
          const convencerText = await generateCustomTransition(
            text,
            "O usuário não quer ver a tabela de preços dos seus vídeos. Responda de forma extremamente curta (1 frase, estilo WhatsApp) correspondendo de forma fofa ao que ele disse, e convença ele a dar uma olhada na tabela sem compromisso (ex: 'deixa de ser bobo amor, dá uma olhadinha sem compromisso rs').",
            "Ué, por que não? 🥺 Deixa de ser bobo, garanto que você vai amar rs. Dá uma olhada sem compromisso na tabela:"
          );
          await sendTextMessageWithTyping(convencerText);
        } else {
          await sendTextMessageWithTyping("Ué, por que não? 🥺 Deixa de ser bobo, garanto que você vai amar rs. E é super baratinho... Dá uma olhada sem compromisso na tabela:");
        }
        await sleep(1000);
        
        await simulateBotTyping('image', 3000);
        appendBotImageMessage(adminSettings.tabelaImagemPath || "assets/tabela.png");
        
        await sleep(1000);
        await sendTextMessageWithTyping("Existem essas 3 opções no pacote amor. Qual delas você vai querer? 😊");
        
        chatState = 'tabela_sent';
        startTabelaTimeout();
        showQuickReplies([
          { text: "Bronze - R$ 8,50", value: "Bronze (R$ 8,50)" },
          { text: "Prata - R$ 15,00", value: "Prata (R$ 15,00)" },
          { text: "Chamada - R$ 29,00", value: "Chamada de Vídeo (R$ 29,00)" }
        ]);
      } else if (isPraising) {
        let transitionText = "";
        if (adminSettings.chatMode === 'hybrid' && adminSettings.geminiKey) {
          transitionText = await generateCustomTransition(
            text,
            "O usuário elogiou você (ex: chamou de gostosa, delícia, etc.). Agradeça de forma muito carinhosa e fofa (ex: 'obrigada meu amor' ou 'obrigada gostoso') e diga que vai enviar a tabela de preços para ele dar uma olhadinha de qualquer forma. Seja muito breve (1 frase). Termine com 'rs'.",
            "obrigada gostoso, vou enviar a tabela para você dar uma olhadinha amor rs"
          );
        } else {
          transitionText = "obrigada gostoso, vou enviar a tabela para você dar uma olhadinha amor rs";
        }
        await sendTextMessageWithTyping(transitionText);
        await sleep(1000);

        await simulateBotTyping('audio', 3000);
        appendBotAudioMessage(adminSettings.audio2Path, "0:15");
        
        await sleep(1500);
        await simulateBotTyping('image', 3000);
        appendBotImageMessage(adminSettings.tabelaImagemPath || "assets/tabela.png");
        
        await sleep(1000);
        await sendTextMessageWithTyping("Existem essas 3 opções no pacote amor. Qual delas você vai querer? 😊");
        
        chatState = 'tabela_sent';
        startTabelaTimeout();
        showQuickReplies([
          { text: "Bronze - R$ 8,50", value: "Bronze (R$ 8,50)" },
          { text: "Prata - R$ 15,00", value: "Prata (R$ 15,00)" },
          { text: "Chamada - R$ 29,00", value: "Chamada de Vídeo (R$ 29,00)" }
        ]);
      } else {
        // Desvio
        await handleFunnelDeviation(text,
          "O usuário não respondeu se quer a tabela de preços. Responda brevemente e termine perguntando se quer receber a tabela.",
          "Mas ó, quer que eu te mande a tabela de preços dos meus vídeos pra você dar uma olhadinha? rs"
        );
      }
    }
    
    else if (chatState === 'tabela_sent') {
      const isRefusal = lowerText.includes('não') || lowerText.includes('nao') || lowerText === 'n' || lowerText === 'nn' || lowerText.includes('caro') || lowerText.includes('desisti') || lowerText.includes('sem dinheiro') || lowerText.includes('não tenho') || lowerText.includes('nao tenho') || lowerText.includes('desconto') || lowerText.includes('baix') || lowerText.includes('diminu') || lowerText.includes('menor') || lowerText.includes('desisto');

      if (isBronzeSelect) {
        selectedPackage = '8.50';
        await sendTextMessageWithTyping("Perfeito amor! Vou te passar a chave Pix agora:");
        await sleep(500);
        
        const pixMsg = `${adminSettings.pixKey}\n${adminSettings.pixName} o nome, Mande o pix aí e o comprovante porfavor\n8,50`;
        await sendTextMessageWithTyping(pixMsg.replace(/\n/g, '<br>'));
        chatState = 'pix_sent';
        hideQuickReplies();
      } else if (isPrataSelect) {
        selectedPackage = '15.00';
        await sendTextMessageWithTyping("Ótima escolha, vai amar os vídeos! Vou te passar a chave Pix:");
        await sleep(500);
        
        const pixMsg = `${adminSettings.pixKey}\n${adminSettings.pixName} o nome, Mande o pix aí e o comprovante porfavor\n15,00`;
        await sendTextMessageWithTyping(pixMsg.replace(/\n/g, '<br>'));
        chatState = 'pix_sent';
        hideQuickReplies();
      } else if (isCallSelect) {
        selectedPackage = '29.00';
        await simulateBotTyping('audio', 3000);
        appendBotAudioMessage(adminSettings.audio3Path, "0:10");
        
        await sleep(1500);
        await sendTextMessageWithTyping("Aqui está a chave Pix para a nossa chamada de vídeo:");
        await sleep(500);
        
        const pixMsg = `${adminSettings.pixKey}\n${adminSettings.pixName} o nome, Mande o pix aí e o comprovante porfavor\n29,00`;
        await sendTextMessageWithTyping(pixMsg.replace(/\n/g, '<br>'));
        chatState = 'pix_sent';
        hideQuickReplies();
      } else if (isRefusal) {
        // O lead recusou explicitamente ou achou caro. Pergunta de onde é para iniciar o downsell.
        if (adminSettings.chatMode === 'hybrid' && adminSettings.geminiKey) {
          const transicaoText = await generateCustomTransition(
            text,
            "O usuário achou caro ou disse que não quer o pacote. Responda de forma extremamente curta (1 frase, estilo WhatsApp) correspondendo de forma fofa ao que ele disse, e termine perguntando de onde ele é (ex: 'meu bem, vc é de onde?').",
            "meu bem, vc é de onde ?"
          );
          await sendTextMessageWithTyping(transicaoText);
        } else {
          await sendTextMessageWithTyping("meu bem, vc é de onde ?");
        }
        chatState = 'downsell_ask_city';
        hideQuickReplies();
      } else {
        // O lead digitou algo não relacionado (desvio). Respondemos de forma carinhosa e voltamos para a tabela, mantendo os botões ativos.
        await handleFunnelDeviation(text,
          "O usuário não escolheu nenhum pacote da tabela. Responda brevemente ao que ele disse e, na sequência, pergunte carinhosamente qual dos 3 pacotes ele vai querer levar (Bronze de R$ 8,50, Prata de R$ 15,00 ou Chamada de R$ 29,00).",
          "Qual dos pacotes você vai querer amor? rs"
        );
        // Reinicia o timeout da tabela, mantendo os botões visíveis
        startTabelaTimeout();
        showQuickReplies([
          { text: "Bronze - R$ 8,50", value: "Bronze (R$ 8,50)" },
          { text: "Prata - R$ 15,00", value: "Prata (R$ 15,00)" },
          { text: "Chamada - R$ 29,00", value: "Chamada de Vídeo (R$ 29,00)" }
        ]);
      }
    }
    
    else if (chatState === 'pix_sent') {
      // Espera comprovante. Se enviar foto ou escrever paguei/comprovante
      const isPaid = lowerText.includes('paguei') || lowerText.includes('fiz') || lowerText.includes('enviei') || lowerText.includes('comprovante') || lowerText.includes('tá aí') || lowerText.includes('ta ai') || lowerText.includes('mandei') || lowerText.includes('pronto') || lowerText.includes('pago') || lowerText.includes('feito') || lowerText.includes('foi') || lowerText.includes('enviado') || lowerText.includes('depositei') || lowerText.includes('transferi');
      const isRefusal = lowerText.includes('caro') || lowerText.includes('desisti') || lowerText.includes('não quero') || lowerText.includes('nao quero') || lowerText.includes('sem dinheiro') || lowerText.includes('não vou') || lowerText.includes('nao vou') || lowerText.includes('não tenho') || lowerText.includes('nao tenho') || lowerText.includes('desconto') || lowerText.includes('baix') || lowerText.includes('diminu') || lowerText.includes('menor') || lowerText.includes('desisto');

      if (isPaid) {
        // Simular processamento do comprovante
        await simulateBotTyping('text', 3000);
        deliverSelectedPackage();
      } else if (isRefusal && selectedPackage !== '3.50') {
        // Se o lead parecer desinteressado e não quiser pagar o pacote original, envia a pergunta de onde ele é para iniciar o downsell.
        await sendTextMessageWithTyping("meu bem, vc é de onde ?");
        chatState = 'downsell_ask_city';
      } else {
        await generatePixSentAiResponse();
      }
    }
    
    else if (chatState === 'paid') {
      // Já pago, responde livremente com a IA
      await simulateBotTyping('text', 2000);
      generateGeminiResponse();
    }

    waitingForResponse = false;

    // Process any queued message
    if (pendingUserMessage) {
      const msg = pendingUserMessage;
      pendingUserMessage = null;
      processFunnelResponse(msg);
    }
  }

  // Handle deviations dynamically using Gemini (hybrid mode) or fallback text (static mode)
  async function handleFunnelDeviation(userText, guidancePrompt, fallbackText) {
    if (adminSettings.chatMode === 'static') {
      await simulateBotTyping('text', 3000); // Dobrado
      appendBotTextMessage(fallbackText);
      return;
    }

    // Call Gemini dynamically to handle the deviation
    const apiKey = adminSettings.geminiKey;
    if (!apiKey) {
      // Fallback if no key is configured
      await simulateBotTyping('text', 3000); // Dobrado
      appendBotTextMessage(fallbackText);
      return;
    }

    // Show status & typing indicators before calling API
    chatInput.placeholder = `${config.persona.name} está digitando...`;
    showStatusIndicator('text');
    const typingBubble = showTypingBubble();
    const startTime = Date.now();

    // Create deviation system prompt
    const deviationPrompt = `Você é a Juliana Mendes, uma garota de 22 anos de São Paulo, carinhosa, fofa e atraente.
Você está conversando com um lead no WhatsApp e seu objetivo é trazê-lo de volta ao fluxo de vendas do seu pack.

Diretrizes importantes para sua fala:
- Responda apenas em português casual brasileiro, simulando o estilo de mensagens do WhatsApp (curto, carinhoso, natural).
- Nunca use gírias brutas ou masculinas (como "mano", "cara", "parceiro"). Mantenha a fala 100% doce e feminina.
- Não envie frases sem nexo ou incompletas. Toda mensagem deve fazer sentido completo.
- NUNCA use reticências (...) no final de suas frases. Termine com pontuação adequada (. ou ! ou ? ou rs).
- Você nunca deve pedir o número de telefone do lead.
- Se o lead pedir ou aceitar seu número de WhatsApp pessoal, você deve concordar em passar, mas cobrar uma taxinha simbólica de R$ 3,50 para liberar, e perguntar se pode enviar a chave Pix.

Para esta resposta específica, você deve obrigatoriamente seguir a seguinte instrução:
"${guidancePrompt}"

Escreva apenas a mensagem de resposta que será enviada ao lead. Nunca use cabeçalhos, marcadores, aspas adicionais ou explicações como "Hook Instruction" ou coisas em inglês.`;

    try {
      const preparedHistory = prepareChatHistoryForAPI(chatHistory);
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash'];
      let success = false;
      let responseText = '';
      let lastError = '';

      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: preparedHistory,
              systemInstruction: {
                parts: [{ text: deviationPrompt }]
              },
              generationConfig: {
                maxOutputTokens: 200,
                temperature: 0.8
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText) {
              success = true;
              break;
            }
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      if (success && responseText) {
        const preparedResponse = cleanAiResponse(responseText);
        const typingDuration = calculateTypingDuration(preparedResponse, 'text');
        const apiDuration = Date.now() - startTime;
        const remainingTypingTime = Math.max(0, typingDuration - apiDuration);

        if (remainingTypingTime > 0) {
          await sleep(remainingTypingTime);
        }

        typingBubble.remove();
        clearStatusIndicator();
        chatInput.placeholder = config.settings.inputPlaceholder;

        appendBotTextMessage(preparedResponse);
        return;
      }
    } catch (err) {
      console.error("Erro na resposta de desvio da IA:", err);
    }

    // Fallback if fetch fails or is empty
    const typingDuration = calculateTypingDuration(fallbackText, 'text');
    const apiDuration = Date.now() - startTime;
    const remainingTypingTime = Math.max(0, typingDuration - apiDuration);

    if (remainingTypingTime > 0) {
      await sleep(remainingTypingTime);
    }

    typingBubble.remove();
    clearStatusIndicator();
    chatInput.placeholder = config.settings.inputPlaceholder;

    appendBotTextMessage(fallbackText);
  }

  // Delivery of packages
  function deliverSelectedPackage() {
    if (selectedPackage === '8.50') {
      appendBotTextMessage("Comprovante aprovado amor! 💖 Aqui está o link com os seus 5 vídeos, aproveita bastante e depois me diz qual gostou mais: [Clique aqui para acessar o Pacote Bronze](" + adminSettings.pack850 + ")");
      chatState = 'paid';
    } else if (selectedPackage === '15.00') {
      appendBotTextMessage("Pix confirmado, meu bem! 💖 Aqui está o seu pacote de 10 vídeos VIP, você vai amar: [Clique aqui para acessar o Pacote Prata](" + adminSettings.pack1500 + ")");
      chatState = 'paid';
    } else if (selectedPackage === '29.00') {
      appendBotTextMessage("Pagamento confirmado, linda! 😍 Me adiciona aqui no meu WhatsApp pessoal ou deixa seu número com o DDD aqui que eu te ligo agora mesmo pra gente fazer nossa chamada: [Chamar no WhatsApp privado](https://wa.me/5511999999999) 😈📞");
      chatState = 'paid';
    } else if (selectedPackage === '3.50') {
      appendBotTextMessage("Pix confirmado, meu bem! 💖 Aqui está o meu número pessoal e WhatsApp privado para conversarmos, me chama lá: [Chamar no WhatsApp pessoal](https://wa.me/5511999999999) 😈📞");
      chatState = 'paid';
    } else {
      appendBotTextMessage("Comprovante recebido! Qual foi o pacote que você escolheu mesmo amor? Só pra eu te liberar o link certinho rs");
    }
  }

  // Receipt verification triggered from image upload
  async function verifyReceiptUploaded(imageUrl) {
    waitingForResponse = true;
    
    // Mostra indicador de que o bot está analisando a foto
    chatInput.placeholder = `${config.persona.name} está analisando comprovante...`;
    showStatusIndicator('text');
    const typingBubble = showTypingBubble();
    
    await sleep(4000); // 4s simulation
    
    typingBubble.remove();
    clearStatusIndicator();
    chatInput.placeholder = config.settings.inputPlaceholder;
    
    deliverSelectedPackage();
    waitingForResponse = false;

    // Process any queued message
    if (pendingUserMessage) {
      const msg = pendingUserMessage;
      pendingUserMessage = null;
      processFunnelResponse(msg);
    }
  }

  // Initialize Persona Details in Header & Pre-landing
  setupHeader();

  // Initialize Event Listeners
  btnToWelcome.addEventListener('click', () => {
    profileOverlay.classList.add('hidden');
  });
  btnStart.addEventListener('click', startChat);
  btnSendText.addEventListener('click', sendTextMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendTextMessage();
  });
  
  // Recording events
  btnMic.addEventListener('click', toggleRecording);
  btnRecordCancel.addEventListener('click', cancelRecording);
  btnRecordSend.addEventListener('click', finishAndSendRecording);

  // Lightbox events
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // User Image Upload events
  if (btnImage) {
    btnImage.addEventListener('click', () => fileInputImage.click());
  }
  if (fileInputImage) {
    fileInputImage.addEventListener('change', handleImageUpload);
  }



  // Setup Persona from Config
  function setupHeader() {
    headerName.textContent = config.persona.name;
    headerStatus.textContent = config.persona.tagline;
    chatAvatar.src = config.persona.avatar;
    
    // Welcome card contents
    document.getElementById('welcome-title').textContent = config.settings.welcomeTitle;
    document.getElementById('welcome-desc').textContent = config.settings.welcomeDescription;
    btnStart.textContent = config.settings.welcomeButton;
    chatInput.placeholder = config.settings.inputPlaceholder;
    btnSendText.title = config.settings.sendButtonText;

    // Populate pre-landing profile elements
    if (profileAvatar) profileAvatar.src = config.persona.avatar;
    if (profileName) profileName.textContent = config.persona.name;
    if (profileAge) profileAge.textContent = config.persona.age || "";
    if (profileCity) profileCity.textContent = config.persona.city || "";
    if (profilePhrase) profilePhrase.textContent = config.persona.phrase || "";
    if (btnToWelcome) btnToWelcome.textContent = config.persona.ctaText || "Conversar";

    // Populate Instagram-style grid
    const profileGrid = document.getElementById('profile-grid');
    if (profileGrid && config.persona.gridImages) {
      profileGrid.innerHTML = '';
      config.persona.gridImages.forEach(imgUrl => {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = 'Instagram Grid Photo';
        img.className = 'profile-grid-img';
        img.onerror = () => { img.style.display = 'none'; };
        profileGrid.appendChild(img);
      });
    }
  }

  // Start the Chat Flow after welcome click
  function startChat() {
    welcomeOverlay.classList.add('hidden');
    
    // Play a silent audio to unlock Web Audio API autoplay on browsers (iOS/Chrome safeguard)
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentAudio.play().catch(() => {});

    // Enable all inputs unconditionally when chat starts
    if (chatInput) chatInput.disabled = false;
    if (btnMic) btnMic.disabled = false;
    if (btnSendText) btnSendText.disabled = false;
    if (btnImage) btnImage.disabled = false;
    chatInput.placeholder = config.settings.inputPlaceholder;

    // Run the first step
    if (adminSettings.chatMode !== 'ai') {
      startFunnelFlow();
    } else {
      appendBotTextMessage("Oi, tudo bem? 🥰");
    }
  }

  // Engine: Process the funnel steps
  async function runNextStep() {
    if (currentStepIndex >= config.steps.length) {
      return;
    }

    const step = config.steps[currentStepIndex];

    if (step.sender === 'user_wait') {
      // If user interacted early during a previous bot step or wait, skip this wait turn
      if (userInteractedSinceLastStep) {
        userInteractedSinceLastStep = false;
        currentStepIndex++;
        runNextStep();
      } else {
        if (step.placeholder) {
          chatInput.placeholder = step.placeholder;
        } else {
          chatInput.placeholder = config.settings.inputPlaceholder;
        }
      }
      return;
    }

    // Set typing placeholder but keep inputs enabled
    chatInput.placeholder = `${config.persona.name} está digitando...`;

    // Delay before showing typing indicator
    if (step.delay) {
      await sleep(step.delay * 2); // Dobrado
    }

    // Show Typing/Recording status in Header and Chat
    showStatusIndicator(step.type);
    const typingBubble = showTypingBubble();

    // Duration of active typing simulation
    if (step.typingTime) {
      await sleep(step.typingTime * 2); // Dobrado
    }

    // Remove typing bubble and clear status
    typingBubble.remove();
    clearStatusIndicator();
    chatInput.placeholder = config.settings.inputPlaceholder;

    // Append actual message based on type
    if (step.type === 'text') {
      appendBotTextMessage(step.content);
    } else if (step.type === 'image') {
      appendBotImageMessage(step.content);
    } else if (step.type === 'audio') {
      appendBotAudioMessage(step.content, step.duration);
    } else if (step.type === 'action_button') {
      appendActionButton(step.content, step.url);
    }

    // Increment step index and run next step recursively
    currentStepIndex++;
    runNextStep();
  }

  // Utilities
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function scrollChatToBottom() {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  }

  // Calcula tempo de digitação realista com base no tamanho da mensagem
  function calculateTypingDuration(text, type = 'text') {
    if (!text) return 2000; // Dobrado
    if (type !== 'text') return 4000; // Dobrado
    
    // Remove tags HTML se houver (ex: tabela)
    const plainText = text.replace(/<[^>]*>/g, '');
    const charCount = plainText.length;
    
    // Velocidade de digitação média humana: ~80ms por caractere (dobrado)
    // Delay base de raciocínio de 1600ms (dobrado)
    const msPerChar = 80;
    const baseDelay = 1600;
    
    const calculated = baseDelay + (charCount * msPerChar);
    
    // Limita entre 2s e 11s para não ficar artificialmente rápido nem cansativo (dobrado de 1s e 5.5s)
    return Math.min(Math.max(calculated, 2000), 11000);
  }

  // Função para limpar e completar respostas da IA
  function cleanAiResponse(text) {
    if (!text) return "";
    let cleaned = text.trim();
    
    // Loop para remover conjunções ou pontuações incompletas no final do texto
    let changed = true;
    while (changed) {
      changed = false;
      
      // 1. Remove pontuação solta como vírgulas, hífens, reticências no final da frase
      const trailingPunctuationRegex = /[\s,;\-\.\…]+$/;
      if (trailingPunctuationRegex.test(cleaned)) {
        cleaned = cleaned.replace(trailingPunctuationRegex, '').trim();
        changed = true;
      }
      
      // 2. Remove conjunções soltas, artigos, preposições, pronomes pessoais oblíquos e possessivos, e palavras de corte comuns
      const trailingCutoffRegex = /(?:^|[\s,;!\?\-\.\…])(mas|que|porque|porquê|por que|pq|se|então|entao|tipo|e|ou|como|para|pra|com|de|da|do|das|dos|em|no|na|nos|nas|por|pelo|pela|pelos|pelas|a|até|ate|me|te|se|nos|vos|lhe|lhes|o|a|os|as|meu|minha|meus|minhas|seu|sua|seus|suas|teu|tua|teus|tuas|nosso|nossa|nossos|nossas|quando|enquanto|pois|porém|porem|contudo|todavia|entretanto|portanto|eu|tu|ele|ela|eles|elas|você|voce|vocês|voces|tá|ta)$/i;
      if (trailingCutoffRegex.test(cleaned)) {
        cleaned = cleaned.replace(trailingCutoffRegex, '').trim();
        changed = true;
      }
    }
    
    // Garantir que a frase finalizada tenha pontuação adequada se não for vazia
    if (cleaned && !/[\.\!\?]$/.test(cleaned) && !/rs$/i.test(cleaned)) {
      cleaned += ".";
    }
    
    return cleaned;
  }

  // Typing/Recording status helpers
  function showStatusIndicator(type) {
    if (type === 'audio') {
      headerStatus.textContent = "Gravando áudio...";
      headerStatus.classList.add('typing');
    } else if (type === 'image') {
      headerStatus.textContent = "Enviando foto...";
      headerStatus.classList.add('typing');
    } else if (type === 'text') {
      headerStatus.textContent = "Digitando...";
      headerStatus.classList.add('typing');
    }
  }

  function clearStatusIndicator() {
    headerStatus.textContent = config.persona.tagline;
    headerStatus.classList.remove('typing');
  }

  function showTypingBubble() {
    const row = document.createElement('div');
    row.className = 'message-row bot';
    row.innerHTML = `
      <div class="message-bubble typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    messagesContainer.appendChild(row);
    scrollChatToBottom();
    return row;
  }

  // Append Bot Messages
  function appendBotTextMessage(text) {
    const row = document.createElement('div');
    row.className = 'message-row bot';
    const now = getFormattedTime();
    row.innerHTML = `
      <div class="message-bubble">
        ${text}
        <span class="message-time">${now}</span>
      </div>
    `;
    messagesContainer.appendChild(row);
    scrollChatToBottom();
    saveMessageToHistory('model', text);
  }

  function appendBotImageMessage(imageSrc) {
    const row = document.createElement('div');
    row.className = 'message-row bot';
    const now = getFormattedTime();
    row.innerHTML = `
      <div class="message-bubble image-bubble">
        <img src="${imageSrc}" alt="Foto enviada" class="chat-photo" onerror="this.src='https://placehold.co/400x300/12131a/f3f4f6?text=Foto+Indisponivel'">
        <span class="message-time">${now}</span>
      </div>
    `;
    
    // Add Click listener for Lightbox zoom
    const img = row.querySelector('img');
    img.addEventListener('click', () => openLightbox(imageSrc));

    messagesContainer.appendChild(row);
    scrollChatToBottom();
    saveMessageToHistory('model', `[Foto enviada pela Juliana: ${imageSrc}]`);
  }

  function appendBotAudioMessage(audioUrl, duration) {
    const row = document.createElement('div');
    row.className = 'message-row bot';
    const now = getFormattedTime();
    const uniqueId = 'audio-' + Math.random().toString(36).substr(2, 9);
    
    row.innerHTML = `
      <div class="message-bubble audio-bubble">
        <div class="audio-player" id="${uniqueId}">
          <button class="play-pause-btn" data-playing="false" data-src="${audioUrl}">
            <svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <div class="audio-controls-right">
            <div class="waveform-visualizer">
              <div class="waveform-bar" style="height: 4px;"></div>
              <div class="waveform-bar" style="height: 7px;"></div>
              <div class="waveform-bar" style="height: 12px;"></div>
              <div class="waveform-bar" style="height: 8px;"></div>
              <div class="waveform-bar" style="height: 5px;"></div>
              <div class="waveform-bar" style="height: 10px;"></div>
              <div class="waveform-bar" style="height: 14px;"></div>
              <div class="waveform-bar" style="height: 6px;"></div>
              <div class="waveform-bar" style="height: 9px;"></div>
              <div class="waveform-bar" style="height: 4px;"></div>
            </div>
            <div class="audio-progress-container">
              <div class="audio-progress-bar"></div>
            </div>
            <div class="audio-meta-info">
              <span class="audio-timer">0:00</span>
              <span>${duration}</span>
            </div>
          </div>
        </div>
        <span class="message-time">${now}</span>
      </div>
    `;

    messagesContainer.appendChild(row);
    setupCustomPlayer(row.querySelector(`#${uniqueId}`));
    scrollChatToBottom();
    saveMessageToHistory('model', `[Áudio enviado pela Juliana com duração de ${duration}]`);
  }

  function appendActionButton(text, url) {
    const row = document.createElement('div');
    row.className = 'message-row bot';
    row.innerHTML = `
      <div class="message-bubble action-button-bubble">
        <a href="${url}" target="_blank" class="action-btn-link">
          ${text}
          <svg style="width:20px;height:20px" viewBox="0 0 24 24"><path fill="currentColor" d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" /></svg>
        </a>
      </div>
    `;
    messagesContainer.appendChild(row);
    scrollChatToBottom();
    saveMessageToHistory('model', `[Botão de Ação enviado: ${text} direcionando para ${url}]`);
  }

  // Format timestamp (HH:MM)
  function getFormattedTime() {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Handle Lightbox (Fullscreen Image Preview)
  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('active');
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
  }

  // Send Text Message from User
  function sendTextMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    userInteractedSinceLastStep = true;

    // Append to Chat
    const row = document.createElement('div');
    row.className = 'message-row user';
    const now = getFormattedTime();
    row.innerHTML = `
      <div class="message-bubble">
        ${text}
        <span class="message-time">${now}</span>
      </div>
    `;
    messagesContainer.appendChild(row);
    chatInput.value = '';
    scrollChatToBottom();

    // Save to history
    saveMessageToHistory('user', text);

    // Route logic based on Mode
    if (adminSettings.chatMode === 'static' || adminSettings.chatMode === 'hybrid') {
      if (waitingForResponse) {
        pendingUserMessage = text;
      } else {
        processFunnelResponse(text);
      }
    } else if (adminSettings.chatMode === 'ai') {
      generateGeminiResponse();
    }
  }

  // Advance state-machine funnel after user interaction
  function advanceFromUserInteraction() {
    if (currentStepIndex < config.steps.length) {
      const currentStep = config.steps[currentStepIndex];
      if (currentStep.sender === 'user_wait') {
        currentStepIndex++; // Move past 'user_wait'
        runNextStep(); // Trigger next bot step
      }
    }
  }

  // Custom Audio Player setup logic
  function setupCustomPlayer(playerEl) {
    const playBtn = playerEl.querySelector('.play-pause-btn');
    const progressContainer = playerEl.querySelector('.audio-progress-container');
    const progressBar = playerEl.querySelector('.audio-progress-bar');
    const visualizer = playerEl.querySelector('.waveform-visualizer');
    const timerText = playerEl.querySelector('.audio-timer');
    const audioSrc = playBtn.getAttribute('data-src');

    // Create localized audio tag for lifecycle events
    const audioObj = new Audio(audioSrc);

    playBtn.addEventListener('click', () => {
      // Toggle logic
      if (currentAudio === audioObj) {
        // Same audio clicked
        if (audioObj.paused) {
          playAudio(audioObj, playBtn, progressBar, visualizer, timerText);
        } else {
          pauseAudio(audioObj, playBtn, visualizer);
        }
      } else {
        // Different audio clicked, stop previous
        if (currentAudio) {
          pauseAudio(currentAudio, currentAudioBtn, currentWaveform);
          // reset progress if playing another
        }
        playAudio(audioObj, playBtn, progressBar, visualizer, timerText);
      }
    });

    // Time update listener
    audioObj.addEventListener('timeupdate', () => {
      if (audioObj.duration) {
        const pct = (audioObj.currentTime / audioObj.duration) * 100;
        progressBar.style.width = `${pct}%`;
        
        // Update timer
        const mins = Math.floor(audioObj.currentTime / 60);
        const secs = Math.floor(audioObj.currentTime % 60);
        timerText.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
      }
    });

    // End audio listener
    audioObj.addEventListener('ended', () => {
      pauseAudio(audioObj, playBtn, visualizer);
      progressBar.style.width = '0%';
      timerText.textContent = '0:00';
    });

    // Click on progress bar to seek
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      
      if (audioObj.duration) {
        audioObj.currentTime = percentage * audioObj.duration;
        progressBar.style.width = `${percentage * 100}%`;
      }
    });
  }

  function playAudio(audioObj, btn, bar, wave, timer) {
    audioObj.play()
      .then(() => {
        btn.setAttribute('data-playing', 'true');
        btn.innerHTML = `<svg class="pause-icon" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        wave.classList.add('playing');
        
        currentAudio = audioObj;
        currentAudioBtn = btn;
        currentProgressBar = bar;
        currentWaveform = wave;
        currentAudioTimerText = timer;
      })
      .catch(err => {
        console.error("Erro ao reproduzir áudio:", err);
      });
  }

  function pauseAudio(audioObj, btn, wave) {
    if (audioObj) {
      audioObj.pause();
    }
    if (btn) {
      btn.setAttribute('data-playing', 'false');
      btn.innerHTML = `<svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    }
    if (wave) {
      wave.classList.remove('playing');
    }
  }

  // Audio Recording Mechanism (Web Audio API)
  async function toggleRecording() {
    if (isRecording) {
      return; // Already recording, wait for action buttons in panel
    }

    try {
      // Request mic permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      recordingSeconds = 0;
      isRecording = true;

      // Swap to recording panel UI
      recordingPanel.classList.add('active');
      btnMic.classList.add('recording');
      btnMic.disabled = true; // Disabled the main mic button while recording panel is open
      chatInput.disabled = true;
      if (btnImage) btnImage.disabled = true;

      // Start recording
      mediaRecorder.start();

      // Start Timer
      recordingTimer.textContent = '0:00';
      recordingInterval = setInterval(() => {
        recordingSeconds++;
        const mins = Math.floor(recordingSeconds / 60);
        const secs = recordingSeconds % 60;
        recordingTimer.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
      }, 1000);

      // Listeners
      mediaRecorder.addEventListener('dataavailable', (e) => {
        audioChunks.push(e.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        // Handled in sending/cancelling stops
      });

    } catch (err) {
      console.error("Acesso ao microfone negado ou indisponível:", err);
      alert("Para enviar áudio, você precisa conceder permissão de uso do microfone nas configurações do seu navegador.");
      resetRecordingUI();
    }
  }

  function stopRecordingEngine() {
    if (recordingInterval) clearInterval(recordingInterval);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      // Stop all tracks to release mic icon on browser tab
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    resetRecordingUI();
  }

  function resetRecordingUI() {
    isRecording = false;
    btnMic.classList.remove('recording');
    btnMic.disabled = false;
    if (btnImage) btnImage.disabled = false;
    chatInput.disabled = false;
    recordingPanel.classList.remove('active');
    if (recordingInterval) clearInterval(recordingInterval);
  }

  function cancelRecording() {
    stopRecordingEngine();
  }

  function finishAndSendRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    // We override stop event callback briefly to send the audio blob
    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const displayDuration = formatRecordDuration(recordingSeconds);
      
      appendUserAudioMessage(audioUrl, displayDuration);
      
      userInteractedSinceLastStep = true;
      
      // Save info to Gemini history
      saveMessageToHistory('user', `[Áudio enviado pelo usuário com duração de ${displayDuration}]`);
      
      if (adminSettings.chatMode === 'static' || adminSettings.chatMode === 'hybrid') {
        if (waitingForResponse) {
          pendingUserMessage = "[Áudio enviado pelo usuário]";
        } else {
          processFunnelResponse("[Áudio enviado pelo usuário]");
        }
      } else if (adminSettings.chatMode === 'ai') {
        generateGeminiResponse();
      }
    };

    stopRecordingEngine();
  }

  function formatRecordDuration(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  // Append User Audio Message Bubble
  function appendUserAudioMessage(audioUrl, duration) {
    const row = document.createElement('div');
    row.className = 'message-row user';
    const now = getFormattedTime();
    const uniqueId = 'audio-' + Math.random().toString(36).substr(2, 9);

    row.innerHTML = `
      <div class="message-bubble audio-bubble">
        <div class="audio-player" id="${uniqueId}">
          <button class="play-pause-btn" data-playing="false" data-src="${audioUrl}">
            <svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <div class="audio-controls-right">
            <div class="waveform-visualizer">
              <div class="waveform-bar" style="height: 4px;"></div>
              <div class="waveform-bar" style="height: 7px;"></div>
              <div class="waveform-bar" style="height: 12px;"></div>
              <div class="waveform-bar" style="height: 8px;"></div>
              <div class="waveform-bar" style="height: 5px;"></div>
              <div class="waveform-bar" style="height: 10px;"></div>
              <div class="waveform-bar" style="height: 14px;"></div>
              <div class="waveform-bar" style="height: 6px;"></div>
              <div class="waveform-bar" style="height: 9px;"></div>
              <div class="waveform-bar" style="height: 4px;"></div>
            </div>
            <div class="audio-progress-container">
              <div class="audio-progress-bar"></div>
            </div>
            <div class="audio-meta-info">
              <span class="audio-timer">0:00</span>
              <span>${duration}</span>
            </div>
          </div>
        </div>
        <span class="message-time">${now}</span>
      </div>
    `;

    messagesContainer.appendChild(row);
    setupCustomPlayer(row.querySelector(`#${uniqueId}`));
    scrollChatToBottom();
  }

  // Gemini & Admin Helpers
  function saveMessageToHistory(role, text) {
    chatHistory.push({
      role: role,
      parts: [{ text: text }]
    });
  }

  function prepareChatHistoryForAPI(history) {
    if (history.length === 0) return [];

    const tempHistory = [];
    
    // Create a copy of the history
    for (const msg of history) {
      tempHistory.push({
        role: msg.role,
        parts: msg.parts.map(part => {
          if (part.inlineData) {
            return {
              inlineData: {
                mimeType: part.inlineData.mimeType,
                data: part.inlineData.data
              }
            };
          }
          return { text: part.text };
        })
      });
    }

    // Prepend a user message if the history starts with a model message
    if (tempHistory[0].role === 'model') {
      tempHistory.unshift({
        role: 'user',
        parts: [{ text: 'Oi' }]
      });
    }

    // Merge consecutive messages of the same role
    const prepared = [];
    for (const msg of tempHistory) {
      if (prepared.length > 0 && prepared[prepared.length - 1].role === msg.role) {
        // Merge the parts list of the consecutive messages
        prepared[prepared.length - 1].parts.push(...msg.parts);
      } else {
        prepared.push(msg);
      }
    }

    return prepared;
  }

  async function generateGeminiResponse() {
    if (isGeneratingResponse) {
      // Queue next response if bot is already typing
      hasPendingUserInput = true;
      return;
    }

    isGeneratingResponse = true;
    hasPendingUserInput = false;

    const apiKey = adminSettings.geminiKey;
    
    if (!apiKey) {
      appendBotTextMessage("⚠️ **Aviso de Sistema:** A chave de API do Gemini não está configurada. Abra o painel de configurações (ícone de engrenagem no cabeçalho) e insira sua API Key para ativar a inteligência artificial.");
      isGeneratingResponse = false;
      return;
    }

    // Change placeholder while thinking, but keep inputs enabled
    chatInput.placeholder = `${config.persona.name} está digitando...`;

    // Show status & typing indicators
    showStatusIndicator('text');
    const typingBubble = showTypingBubble();
    const startTime = Date.now();

    try {
      const preparedHistory = prepareChatHistoryForAPI(chatHistory);
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash'];
      let success = false;
      let responseText = '';
      let lastError = '';

      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: preparedHistory,
              systemInstruction: {
                parts: [{ text: adminSettings.systemPrompt }]
              },
              generationConfig: {
                maxOutputTokens: 350,
                temperature: 0.75
              },
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH",
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                  threshold: "BLOCK_NONE"
                }
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText) {
              success = true;
              break;
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData.error?.message || `Erro HTTP ${response.status}`;
            const errLower = lastError.toLowerCase();
            if (response.status === 400 && (errLower.includes('api key') || errLower.includes('invalid key') || errLower.includes('key not valid'))) {
              throw new Error(lastError);
            }
            if (response.status === 403) {
              throw new Error(lastError);
            }
            continue;
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      if (!success) {
        throw new Error(lastError || "Falha ao gerar resposta.");
      }

      const preparedResponse = cleanAiResponse(responseText);
      const typingDuration = calculateTypingDuration(preparedResponse, 'text');
      const apiDuration = Date.now() - startTime;
      const remainingTypingTime = Math.max(0, typingDuration - apiDuration);
      
      if (remainingTypingTime > 0) {
        await sleep(remainingTypingTime);
      }

      // Remove typing indicator
      typingBubble.remove();
      clearStatusIndicator();

      // Show the message
      appendBotTextMessage(preparedResponse);

    } catch (err) {
      console.error(err);
      typingBubble.remove();
      clearStatusIndicator();
      appendBotTextMessage(`❌ **Erro de IA:** Falha ao gerar resposta (${err.message}). Por favor, revise sua API Key.`);
    } finally {
      isGeneratingResponse = false;
      chatInput.placeholder = config.settings.inputPlaceholder;

      if (hasPendingUserInput) {
        // If user sent a photo while the bot was typing, trigger a new typing session
        setTimeout(() => {
          if (chatState === 'pix_sent') {
            generatePixSentAiResponse();
          } else {
            generateGeminiResponse();
          }
        }, 1500);
      }
    }
  }

  async function generatePixSentAiResponse() {
    if (isGeneratingResponse) {
      hasPendingUserInput = true;
      return;
    }

    isGeneratingResponse = true;
    hasPendingUserInput = false;

    const apiKey = adminSettings.geminiKey;
    
    if (!apiKey) {
      const currentPrice = selectedPackage || '8,50';
      if (selectedPackage === '3.50') {
        const fallbacks350 = [
          "Manda o comprovante do Pix de 3,50 aí amor, já quero te passar meu Whats pessoal pra gente conversar! rs 😈",
          "Tô só te esperando mandar o comprovante do Pix pra eu te liberar meu número privado meu bem! rs",
          "Assim que você fizer o Pix de R$ 3.50 e me mandar o comprovante aqui, eu já te passo meu Whats pessoal amor! 😈"
        ];
        appendBotTextMessage(fallbacks350[Math.floor(Math.random() * fallbacks350.length)]);
      } else {
        const fallbacksPack = [
          `Assim que você fizer o Pix de R$ ${currentPrice} e me mandar o comprovante aqui, eu te libero na hora amor! 😈`,
          `Manda o Pix aí amor, tô super ansiosa pra te liberar os vídeos na hora! rs 😈`,
          `Tô só esperando o comprovante do Pix pra liberar seu acesso lindo! rs`
        ];
        appendBotTextMessage(fallbacksPack[Math.floor(Math.random() * fallbacksPack.length)]);
      }
      isGeneratingResponse = false;
      return;
    }

    // Change placeholder while thinking, but keep inputs enabled
    chatInput.placeholder = `${config.persona.name} está digitando...`;

    // Show status & typing indicators
    showStatusIndicator('text');
    const typingBubble = showTypingBubble();
    const startTime = Date.now();

    try {
      const currentPrice = selectedPackage || '8,50';
      let pixPrompt = "";

      if (selectedPackage === '3.50') {
        pixPrompt = `Você é a Juliana Mendes, uma garota de 22 anos de São Paulo, simpática, atraente e muito sedutora.
O lead quer o seu número de WhatsApp pessoal pelo valor promocional de R$ 3,50 e já recebeu a chave Pix (${adminSettings.pixKey || "marianinab1@gmail.com"}).
Ele ainda NÃO enviou o comprovante de pagamento e está conversando com você.
Seu objetivo é continuar a conversa fingindo ser uma garota real no WhatsApp. Seja extremamente carinhosa, provocativa e sedutora (pode atiçar a imaginação dele com o que espera ele no seu WhatsApp pessoal).
REGRAS CRÍTICAS DE CONCORDÂNCIA E FALA:
- Responda apenas em PORTUGUÊS BRASILEIRO CASUAL (gírias de SP, estilo WhatsApp). NUNCA fale em inglês.
- NÃO FALE FRASES QUE NÃO FAÇAM SENTIDO. Suas frases devem ser completas e naturais.
- NUNCA termine com uma frase cortada ou incompleta. Termine com pontuação adequada (. ! ? ou rs) e NUNCA use reticências (...).
- NUNCA repita o mesmo texto de aviso de pagamento ou o texto anterior.
- NÃO seja chata ou repetitiva cobrando o Pix em todas as frases. Converse normalmente de forma humanizada, fale coisas carinhosas ou quentes/sugestivas.
- Mencione de forma muito sutil e provocativa que você está ansiosa para passar seu WhatsApp pessoal/privado para ele assim que ele fizer o Pix de 3,50 e te mandar o comprovante aqui.
- Se ele demonstrar que não vai pagar ou demorar muito nas desculpas, mantenha a pose provocativa mas lembre-o de que o WhatsApp pessoal só é liberado com o comprovante de R$ 3,50.`;
      } else {
        pixPrompt = `Você é a Juliana Mendes, uma garota de 22 anos de São Paulo, simpática, atraente e muito sedutora.
O lead já selecionou o pacote no valor de R$ ${currentPrice} e recebeu a chave Pix (${adminSettings.pixKey || "marianinab1@gmail.com"}).
Ele ainda NÃO enviou o comprovante de pagamento e está conversando com você.
Seu objetivo é continuar a conversa fingindo ser uma garota real no WhatsApp. Seja extremamente carinhosa, provocativa e sedutora (pode falar putaria de forma sexy e atiçar a imaginação dele com o que te espera nos vídeos).
REGRAS CRÍTICAS DE CONCORDÂNCIA E FALA:
- Responda apenas em PORTUGUÊS BRASILEIRO CASUAL (gírias de SP, estilo WhatsApp). NUNCA fale em inglês.
- NÃO FALE FRASES QUE NÃO FAÇAM SENTIDO. Suas frases devem ser completas e naturais.
- NUNCA termine com uma frase cortada ou incompleta. Termine com pontuação adequada (. ! ? ou rs) e NUNCA use reticências (...).
- NUNCA repita o mesmo texto de aviso de pagamento ou o texto anterior.
- NÃO seja chata ou repetitiva cobrando o Pix em todas as frases. Converse normalmente, fale coisas quentes/sugestivas para mantê-lo animado/excitado.
- Mencione de forma muito sutil e provocativa que você está ansiosa para liberar o link dos vídeos íntimos para ele assim que ele fizer o Pix e te mandar o comprovante aqui.
- Se ele demonstrar que não vai pagar ou demorar muito nas desculpas, mantenha a pose provocativa mas lembre-o de que o pack só sai com o comprovante.`;
      }

      const preparedHistory = prepareChatHistoryForAPI(chatHistory);
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash'];
      let success = false;
      let responseText = '';
      let lastError = '';

      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: preparedHistory,
              systemInstruction: {
                parts: [{ text: pixPrompt }]
              },
              generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.85
              },
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH",
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                  threshold: "BLOCK_NONE"
                }
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText) {
              success = true;
              break;
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData.error?.message || `Erro HTTP ${response.status}`;
            const errLower = lastError.toLowerCase();
            if (response.status === 400 && (errLower.includes('api key') || errLower.includes('invalid key') || errLower.includes('key not valid'))) {
              throw new Error(lastError);
            }
            if (response.status === 403) {
              throw new Error(lastError);
            }
            continue;
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      if (!success) {
        throw new Error(lastError || "Falha ao gerar resposta.");
      }

      const preparedResponse = cleanAiResponse(responseText);
      const typingDuration = calculateTypingDuration(preparedResponse, 'text');
      const apiDuration = Date.now() - startTime;
      const remainingTypingTime = Math.max(0, typingDuration - apiDuration);
      
      if (remainingTypingTime > 0) {
        await sleep(remainingTypingTime);
      }

      // Remove typing indicator
      typingBubble.remove();
      clearStatusIndicator();

      // Show the message
      appendBotTextMessage(preparedResponse);

    } catch (err) {
      console.error(err);
      typingBubble.remove();
      clearStatusIndicator();
      if (selectedPackage === '3.50') {
        appendBotTextMessage(`Manda o comprovante do Pix aí amor, tô super ansiosa pra te passar meu Whats pessoal! rs 😈`);
      } else {
        appendBotTextMessage(`Manda o Pix aí amor, tô super ansiosa pra te liberar os vídeos na hora! rs 😈`);
      }
    } finally {
      isGeneratingResponse = false;
      chatInput.placeholder = config.settings.inputPlaceholder;

      if (hasPendingUserInput) {
        setTimeout(() => {
          if (chatState === 'pix_sent') {
            generatePixSentAiResponse();
          } else {
            generateGeminiResponse();
          }
        }, 1500);
      }
    }
  }

  // Handle image upload from user
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      const base64Data = event.target.result;
      const base64Content = base64Data.split(',')[1];
      const localUrl = URL.createObjectURL(file);

      // Append image bubble of the user to the chat
      appendUserImageMessage(localUrl);

      userInteractedSinceLastStep = true;

      // Add image object parts to Gemini chatHistory
      chatHistory.push({
        role: 'user',
        parts: [
          { text: "[Foto enviada pelo usuário]" },
          {
            inlineData: {
              mimeType: file.type,
              data: base64Content
            }
          }
        ]
      });

      // Clear file input value
      fileInputImage.value = '';

      // Route chat continuation
      if (adminSettings.chatMode === 'static' || adminSettings.chatMode === 'hybrid') {
        if (chatState === 'pix_sent') {
          verifyReceiptUploaded(localUrl);
        } else {
          if (waitingForResponse) {
            pendingUserMessage = "[Foto enviada pelo usuário]";
          } else {
            processFunnelResponse("[Foto enviada pelo usuário]");
          }
        }
      } else if (adminSettings.chatMode === 'ai') {
        generateGeminiResponse();
      }
    };

    reader.readAsDataURL(file);
  }

  function appendUserImageMessage(imageSrc) {
    const row = document.createElement('div');
    row.className = 'message-row user';
    const now = getFormattedTime();
    row.innerHTML = `
      <div class="message-bubble image-bubble">
        <img src="${imageSrc}" alt="Foto enviada" class="chat-photo" onerror="this.src='https://placehold.co/400x300/12131a/f3f4f6?text=Foto+Indisponivel'">
        <span class="message-time">${now}</span>
      </div>
    `;

    // Add Click listener for Lightbox zoom
    const img = row.querySelector('img');
    img.addEventListener('click', () => openLightbox(imageSrc));

    messagesContainer.appendChild(row);
    scrollChatToBottom();
  }

});
