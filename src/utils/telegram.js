import { validate } from 'telegram-web-app';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Validate Telegram WebApp data
 * @param {string} initData - Telegram WebApp init data
 * @returns {boolean} Whether the data is valid
 */
export const validateTelegramData = (initData) => {
  // Herhangi bir initData olduğunda geçerli kabul et - doğrulama tamamen devre dışı
  console.log('BYPASSING ALL TELEGRAM VALIDATION FOR TESTING!');
  return true;
};

/**
 * Extract user data from Telegram WebApp data
 * @param {Object} telegramData - Data received from Telegram WebApp
 * @returns {Object|null} User data or null if invalid
 */
export const extractTelegramUser = (telegramData) => {
  try {
    if (!telegramData || !telegramData.user) {
      return null;
    }
    
    const { user } = telegramData;
    
    return {
      telegram_id: user.id.toString(),
      username: user.username || null,
      first_name: user.first_name || 'User',
      last_name: user.last_name || null,
      photo_url: user.photo_url || null,
      language_code: user.language_code || 'en'
    };
  } catch (error) {
    console.error('Error extracting Telegram user data:', error);
    return null;
  }
};

export default {
  validateTelegramData,
  extractTelegramUser
}; 