// src/lib/url-extractor.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { VMCounter } from '@/types';

export async function extractTextFromURL(url: string, vmCounter: VMCounter): Promise<string | null> {
  try {
    console.log(`🌐 Fetching URL: ${url}`);
    
    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000, // 10 second timeout
    });

    const html = response.data;
    
    // Parse HTML with cheerio
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();
    $('header').remove();
    
    // Extract text from body
    const text = $('body').text()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
    
    if (!text || text.length === 0) {
      console.warn('⚠️ No text extracted from URL');
      vmCounter.increment('text_extraction_error');
      return null;
    }
    
    vmCounter.increment('text_extracted_url');
    console.log('✅ URL text extracted successfully');
    
    return text;
  } catch (error) {
    console.error('❌ URL extraction error:', error);
    vmCounter.increment('text_extraction_error');
    return null;
  }
}
