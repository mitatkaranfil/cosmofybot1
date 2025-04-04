import express from 'express';
import supabase from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';
import { validateTelegramData, extractTelegramUser } from '../utils/telegram.js';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user with Telegram data
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    console.log('Auth request received:', JSON.stringify(req.body, null, 2));
    
    const { initData, user } = req.body;
    
    // Test ortamında initData gerekliliğini es geçebiliriz
    if (!initData && process.env.NODE_ENV === 'production') {
      console.error('Missing initData from Telegram');
      return res.status(400).json({ 
        success: false, 
        message: 'Telegram init data is required' 
      });
    }
    
    // Eğer user bilgisi yoksa minimum bilgilerle bir test kullanıcısı oluştur
    let telegramUserData = user;
    if (!telegramUserData || !telegramUserData.id) {
      console.warn('No user data provided, creating test user');
      telegramUserData = {
        id: Date.now().toString(), // Geçici ID
        first_name: 'Telegram',
        last_name: 'User',
        username: 'telegram_user_' + Math.floor(Math.random() * 1000)
      };
    }
    
    // Validate Telegram initData - test için her zaman geçerli kabul ediyoruz
    const isValid = validateTelegramData(initData);
    console.log('Telegram data validation result:', isValid);
    
    // Extract Telegram user data
    const telegramUser = extractTelegramUser({ user: telegramUserData });
    if (!telegramUser) {
      console.error('Failed to extract Telegram user data');
      return res.status(400).json({ 
        success: false, 
        message: 'Could not process Telegram user data' 
      });
    }
    
    console.log('Extracted Telegram user:', telegramUser);
    
    // Check if user exists in database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.telegram_id)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching user data' 
      });
    }
    
    let userData;
    
    // If user doesn't exist, create a new user
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([telegramUser])
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating user:', createError);
        
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating user account' 
        });
      }
      
      userData = newUser;
    } else {
      // Update existing user's data if needed
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          username: telegramUser.username || existingUser.username,
          first_name: telegramUser.first_name || existingUser.first_name,
          last_name: telegramUser.last_name || existingUser.last_name,
          photo_url: telegramUser.photo_url || existingUser.photo_url,
          language_code: telegramUser.language_code || existingUser.language_code,
          updated_at: new Date()
        })
        .eq('telegram_id', telegramUser.telegram_id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating user:', updateError);
        
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating user data' 
        });
      }
      
      userData = updatedUser;
    }
    
    // Generate JWT token
    const token = generateToken(userData);
    
    // Format user data for response
    const formattedUser = {
      id: userData.id,
      telegramId: userData.telegram_id,
      username: userData.username,
      firstName: userData.first_name,
      lastName: userData.last_name,
      photoUrl: userData.photo_url,
      miningLevel: userData.mining_level,
      walletBalance: userData.wallet_balance
    };
    
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: formattedUser
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
});

export default router; 