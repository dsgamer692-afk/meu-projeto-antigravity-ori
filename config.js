/**
 * Configurações Gerais do Funil de Chat (Typebot para Hot)
 * Edite este arquivo para alterar os textos, imagens, áudios e comportamento do robô.
 */

window.FUNNEL_CONFIG = {
  // Informações da Persona (a garota com quem o lead conversa)
  persona: {
    name: "Juliana Mendes",
    age: 22,
    city: "São Paulo",
    tagline: "Online agora",
    avatar: "assets/avatar.jpg", // Caminho para a imagem de perfil
    verified: true, // Se true, exibe um selinho azul de verificado ao lado do nome
    bio: "22 anos • Conversar me deixa animada... 😈🔥",
    phrase: "Oi… você veio do TikTok né? 😌 Tava te esperando por aqui... Só respondo quem clicar no botão embaixo 👇",
    ctaText: "Mandar mensagem para Juliana",
    gridImages: [
      "assets/photo1.jpg",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=200&h=200"
    ]
  },

  // Configurações gerais da página
  settings: {
    welcomeTitle: "Aviso de Privacidade 🔞",
    welcomeDescription: "Esta conversa contém conteúdo adulto e interações personalizadas. Você confirma que tem mais de 18 anos e deseja continuar?",
    welcomeButton: "Sim, quero entrar",
    inputPlaceholder: "Digite sua mensagem aqui...",
    audioRecordInstructions: "Segure ou clique para gravar áudio",
    sendButtonText: "Enviar"
  },

  // Passos do funil de conversação
  // Tipos de passos:
  // - 'text': A garota envia uma mensagem de texto.
  // - 'image': A garota envia uma imagem.
  // - 'audio': A garota envia um áudio (precisa indicar a duração simulada).
  // - 'user_wait': O robô para e aguarda qualquer interação do usuário (texto, áudio ou clique) para continuar.
  // - 'action_button': A garota envia um balão com um botão de ação (ex: checkout, link de compra, etc.).
  steps: [
    {
      id: 1,
      sender: "bot",
      type: "text",
      content: "Oi, tudo bem? Fico feliz que tenha me chamado aqui! 🥰",
      delay: 1000,        // Tempo de espera (ms) antes de aparecer o indicador de digitando
      typingTime: 2000    // Tempo (ms) simulando o indicador de "digitando..."
    },
    {
      id: 2,
      sender: "bot",
      type: "text",
      content: "Estava aqui no meu quarto sem fazer nada, pensando em algumas coisas... e resolvi entrar. De onde você é?",
      delay: 800,
      typingTime: 2500
    },
    {
      id: 3,
      sender: "user_wait", // Pausa o funil e aguarda o usuário digitar ou mandar áudio
      placeholder: "Digite de onde você é..."
    },
    {
      id: 4,
      sender: "bot",
      type: "text",
      content: "Que legal! Adoro pessoas daí. Olha, acabei de deitar na cama e gravei um áudio pra você, escuta aí com fone de preferência rs 👇",
      delay: 1200,
      typingTime: 2000
    },
    {
      id: 5,
      sender: "bot",
      type: "audio",
      content: "assets/audio1.mp3", // Caminho do áudio
      duration: "0:14",             // Duração exibida no player
      delay: 1000,
      typingTime: 3500              // Exibe "Gravando áudio..." no lugar de digitando
    },
    {
      id: 6,
      sender: "user_wait", // Aguarda reação ou resposta do áudio
      placeholder: "O que achou do áudio?..."
    },
    {
      id: 7,
      sender: "bot",
      type: "text",
      content: "Nossa, adorei sua resposta! Você é muito simpático. Vou te mandar uma foto que acabei de tirar aqui, mas promete que é segredo nosso? 🤫",
      delay: 1000,
      typingTime: 2500
    },
    {
      id: 8,
      sender: "bot",
      type: "image",
      content: "assets/photo1.jpg", // Foto sensual/casual simulada
      delay: 800,
      typingTime: 3000              // Exibe "Enviando foto..." ou "digitando..."
    },
    {
      id: 9,
      sender: "bot",
      type: "text",
      content: "O que achou? Sou tímida mas às vezes me empolgo... rs. Me manda um áudio dizendo o que achou, quero ouvir sua voz!",
      delay: 1500,
      typingTime: 2500
    },
    {
      id: 10,
      sender: "user_wait", // Incentiva o lead a usar o gravador de áudio
      placeholder: "Grave um áudio ou responda..."
    },
    {
      id: 11,
      sender: "bot",
      type: "text",
      content: "Adorei seu áudio, que voz gostosa! Olha, eu tenho um canal privado onde posto coisas bem mais íntimas e converso de pertinho sem filtros com quem eu gosto.",
      delay: 1200,
      typingTime: 3000
    },
    {
      id: 12,
      sender: "bot",
      type: "text",
      content: "Liberei um desconto especial para os próximos que entrarem hoje. Quer dar uma olhada e ver o que te espera lá dentro? Clica no botão abaixo para ver mais!",
      delay: 1000,
      typingTime: 2500
    },
    {
      id: 13,
      sender: "bot",
      type: "action_button",
      content: "Quero entrar no Grupo VIP 😈🔥", // Texto do botão
      url: "https://hub.hotmart.com/exemplo",   // Link de vendas/checkout
      delay: 500
    }
  ]
};
