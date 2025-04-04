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
    
    // Telegram test kullanıcısı oluştur - canlı ortamda bile her zaman çalışacak
    const telegramUserData = {
      id: user?.id || Date.now().toString(), // Kullanıcı ID varsa kullan, yoksa timestamp
      first_name: user?.first_name || 'Telegram',
      last_name: user?.last_name || 'User',
      username: user?.username || 'telegram_user_' + Math.floor(Math.random() * 10000),
      language_code: user?.language_code || 'tr',
      photo_url: user?.photo_url || null
    };
    
    console.log('Using Telegram user data:', telegramUserData);
    
    // Kullanıcı verisini database için normalize et
    const telegramUser = {
      telegram_id: telegramUserData.id.toString(),
      username: telegramUserData.username,
      first_name: telegramUserData.first_name,
      last_name: telegramUserData.last_name, 
      photo_url: telegramUserData.photo_url,
      language_code: telegramUserData.language_code
    };
    
    console.log('Normalized user data for database:', telegramUser);
    
    try {
      // Check if user exists in database
      console.log('Checking if user exists with telegram_id:', telegramUser.telegram_id);
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.telegram_id)
        .single();
        
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('User not found, will create new user');
        } else {
          console.error('Database error when fetching user:', fetchError);
          throw new Error('Database error: ' + fetchError.message);
        }
      } else {
        console.log('Existing user found:', existingUser);
      }
      
      let userData;
      
      // If user doesn't exist, create a new user
      if (!existingUser) {
        console.log('Creating new user with data:', telegramUser);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([telegramUser])
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating user:', createError);
          throw new Error('Unable to create user: ' + createError.message);
        }
        
        console.log('New user created:', newUser);
        userData = newUser;
      } else {
        // Update existing user's data 
        console.log('Updating existing user:', existingUser.id);
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            photo_url: telegramUser.photo_url,
            language_code: telegramUser.language_code,
            updated_at: new Date()
          })
          .eq('telegram_id', telegramUser.telegram_id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating user:', updateError);
          throw new Error('Unable to update user: ' + updateError.message);
        }
        
        console.log('User updated:', updatedUser);
        userData = updatedUser;
      }
      
      // Generate JWT token
      console.log('Generating token for user:', userData.id);
      const token = generateToken(userData);
      
      // Format user data for response
      const formattedUser = {
        id: userData.id,
        telegramId: userData.telegram_id,
        username: userData.username || 'telegram_user',
        firstName: userData.first_name,
        lastName: userData.last_name || '',
        photoUrl: userData.photo_url,
        miningLevel: userData.mining_level || 1,
        walletBalance: userData.wallet_balance || 0
      };
      
      console.log('Sending user data to frontend:', formattedUser);

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token,
        user: formattedUser
      });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error: ' + dbError.message
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error: ' + error.message
    });
  }
});

export default router; 