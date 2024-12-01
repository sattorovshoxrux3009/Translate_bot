import TelegramBot from 'node-telegram-bot-api';
import { translate } from '@vitalets/google-translate-api';

// Telegram bot tokenini o‘rnatish
const token = 'YOUR_TOKEN';
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchilarning tanlovlari
let userChoices = {};

// Til kombinatsiyalari
let languagePairs = {
  'uz-en': ['uz', 'en'],
  'en-uz': ['en', 'uz'],
  'uz-ru': ['uz', 'ru'],
  'ru-uz': ['ru', 'uz']
};

// Tilga mos xabarlar
let selectRegionMessage = {
  uz: 'Iltimos, til kombinatsiyasini tanlang:',
  en: 'Please select language pair:',
  ru: 'Пожалуйста, выберите пару языков:'
};

// Til tanlash menyusi
let languageOptions = {
  reply_markup: {
    keyboard: [
      ['🇺🇿 O‘zbekcha', '🇷🇺 Русский', '🇬🇧 English']
    ],
    one_time_keyboard: true,
    resize_keyboard: true
  }
};

// Til kombinatsiyasini tanlash menyusi
let languagePairOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🇺🇿 Uz - 🇬🇧 En", callback_data: 'uz-en' },
        { text: "🇬🇧 En - 🇺🇿 Uz", callback_data: 'en-uz' }
      ],
      [
        { text: "🇺🇿 Uz - 🇷🇺 Ru", callback_data: 'uz-ru' },
        { text: "🇷🇺 Ru - 🇺🇿 Uz", callback_data: 'ru-uz' }
      ]
    ]
  }
};

// Boshlang'ich: Bot kirganida til tanlash
bot.onText(/\/start/, (msg) => {
  let chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Iltimos, tilni tanlang:', languageOptions);
});
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Yordam: Bu bot sizga matnlarni tarjima qilishga yordam beradi. Tilni tanlash uchun /options buyrug‘ini yuboring.');
});

// Tilni tanlash va kombinatsiyalarni ko'rsatish
bot.on('message', (msg) => {
  let chatId = msg.chat.id;
  let data = msg.text;

  // Foydalanuvchi tilni tanlaganida
  if (data === '🇺🇿 O‘zbekcha' || data === '🇬🇧 English' || data === '🇷🇺 Русский') {
    userChoices[chatId] = { language: data }; // Tanlangan tilni eslab qolish
    
    // Tanlangan tilga mos xabarni olish
    let selectedLanguage = data === '🇺🇿 O‘zbekcha' ? 'uz' : data === '🇬🇧 English' ? 'en' : 'ru';
    let messageText = selectRegionMessage[selectedLanguage];

    // Til kombinatsiyalarini ko'rsatish
    bot.sendMessage(chatId, messageText, languagePairOptions);
  }
});

// Til kombinatsiyasini tanlash
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const selectedPair = callbackQuery.data;

  if (userChoices[chatId]) {
    userChoices[chatId].languagePair = selectedPair; // Tanlangan til kombinatsiyasini eslab qolish

    let selectedLanguage = userChoices[chatId].language;

    // Matn yuborishni so'rash
    let messageText = selectedLanguage === '🇺🇿 O‘zbekcha' ? 'Iltimos, matn yuboring:' :
                      selectedLanguage === '🇬🇧 English' ? 'Please send the text:' : 
                      'Пожалуйста, отправьте текст:';
    
    bot.sendMessage(chatId, messageText);
  } else {
    // Foydalanuvchidan til tanlashni so'rash
    bot.sendMessage(chatId, 'Iltimos, tilni tanlang!');
  }
});

// /options komandasini qo'shish
bot.onText(/\/options/, (msg) => {
  let chatId = msg.chat.id;
  
  if (userChoices[chatId]) {
    // Agar foydalanuvchi allaqachon til kombinatsiyasini tanlagan bo'lsa, uni yangilash uchun qayta tanlashga ruxsat berish
    let messageText = 'Iltimos, yangi til kombinatsiyasini tanlang:';
    bot.sendMessage(chatId, messageText, languagePairOptions);
  } else {
    // Foydalanuvchi tilni tanlamagan bo'lsa, avval tilni tanlashini so'rash
    bot.sendMessage(chatId, 'Iltimos, avval tilni tanlang!');
  }
});

// Matn yuborilganda tarjima qilish
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text && !msg.text.startsWith('/')) {
    // Foydalanuvchining til kombinatsiyasini tekshirish
    if (userChoices[chatId] && userChoices[chatId].languagePair) {
      const textToTranslate = msg.text;
      const [fromLang, toLang] = userChoices[chatId].languagePair.split('-');
      
      try {
        const { text } = await translate(textToTranslate, {  to: toLang });
        bot.sendMessage(chatId, `${text}`);
      } catch (error) {
        bot.sendMessage(chatId, 'Xatolik yuz berdi, iltimos qaytadan urinib ko\'ring.');
        console.log(error);
      }
    } else {
      // Til yoki kombinatsiya tanlanmagan bo'lsa
      // bot.sendMessage(chatId, 'Iltimos, avval til va kombinatsiyani tanlang.');
    }
  }
});
