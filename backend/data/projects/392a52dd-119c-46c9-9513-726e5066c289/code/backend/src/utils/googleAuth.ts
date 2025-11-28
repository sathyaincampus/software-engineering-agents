import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

export const getGoogleAuthUrl = (state?: string): string => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: state,
    });
    return authUrl;
};

export const getGoogleTokens = async (code: string): Promise<any> => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        return tokens;
    } catch (error) {
        console.error('Error obtaining Google tokens:', error);
        throw error;
    }
};

export const getGoogleUserProfile = async (accessToken: string): Promise<any> => {
    try {
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        oauth2Client.setCredentials({ access_token: accessToken }); 
        const userInfo = await oauth2.userinfo.get();
        return userInfo.data;
    } catch (error) {
        console.error('Error fetching Google user profile:', error);
        throw error;
    }
};

export const refreshGoogleAccessToken = async (refreshToken: string): Promise<any> => {
    try {
        const { credentials } = await oauth2Client.refreshToken(refreshToken);
        return credentials;
    } catch (error) {
        console.error('Error refreshing Google access token:', error);
        throw error;
    }
};
