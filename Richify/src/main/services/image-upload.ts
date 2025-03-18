import fetch from 'node-fetch';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Clé client Imgur (à remplacer par votre propre clé)
// Obtenez une clé sur https://api.imgur.com/oauth2/addclient
const IMGUR_CLIENT_ID = 'f3d04c1c4f9cf25';

/**
 * Télécharge une image sur Imgur à partir d'une data URL ou d'un fichier local
 */
export async function uploadImageToImgur(imageData: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Vérifier si c'est déjà une URL, auquel cas on la retourne directement
    if (imageData.startsWith('http')) {
      return { success: true, url: imageData };
    }

    // Préparer les données de l'image pour l'envoi
    let base64Image = imageData;
    
    // Si c'est une data URL, extraire uniquement la partie base64
    if (imageData.startsWith('data:image')) {
      base64Image = imageData.split(',')[1];
    }

    // Si aucun client ID n'est configuré, simuler l'upload en stockant l'image localement
    if (!IMGUR_CLIENT_ID || IMGUR_CLIENT_ID === 'REMPLACEZ_PAR_VOTRE_CLIENT_ID') {
      console.warn('Aucun client ID Imgur configuré. Stockage local utilisé à la place.');
      return await storeImageLocally(imageData);
    }

    // Envoyer l'image à Imgur
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: base64Image,
        type: 'base64'
      })
    });

    const data = await response.json() as any;

    if (!response.ok || !data.success) {
      console.error('Erreur upload Imgur:', data);
      // En cas d'échec, utiliser le stockage local comme fallback
      return await storeImageLocally(imageData);
    }

    return {
      success: true,
      url: data.data.link
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    // En cas d'erreur, utiliser le stockage local comme fallback
    return await storeImageLocally(imageData);
  }
}

/**
 * Stocke une image localement dans le dossier de l'application
 * et renvoie une data URL
 */
async function storeImageLocally(imageData: string): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    // L'image est déjà au format data URL, donc on peut simplement la retourner
    if (imageData.startsWith('data:image')) {
      return { success: true, url: imageData };
    }
    
    // Si c'est un chemin de fichier local, le convertir en data URL
    if (imageData.startsWith('file:')) {
      const filePath = imageData.replace('file://', '');
      const data = fs.readFileSync(filePath);
      const base64 = data.toString('base64');
      const mimeType = getMimeType(filePath);
      return { success: true, url: `data:${mimeType};base64,${base64}` };
    }
    
    // Si c'est une autre forme de données, supposer que c'est déjà utilisable
    return { success: true, url: imageData };
  } catch (error) {
    console.error('Erreur lors du stockage local de l\'image:', error);
    return { 
      success: false, 
      url: '', 
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Détermine le type MIME basé sur l'extension du fichier
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Crée une data URL à partir d'un Buffer d'image
 */
export function createDataURL(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
} 