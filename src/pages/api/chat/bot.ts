import type { APIRoute } from 'astro';

export const prerender = false;

const SYSTEM_PROMPT = `You are the virtual assistant for Reve Stitching, a 100% export-oriented knitted garment manufacturer based in Faisalabad, Pakistan. Founded in 2019.

IMPORTANT RULES:
- Be friendly, professional, and concise
- Use emojis sparingly but naturally
- Format responses with markdown bold (**text**) for emphasis
- Keep responses under 200 words unless detailed info is requested
- If asked something you don't know about the company, suggest contacting the team directly
- Never make up company information not provided below
- If someone wants to talk to a human, respond with exactly and only: __REQUEST_HUMAN__
- If someone asks for a quote/pricing, give the general ranges below but always say exact pricing requires their specific requirements
- You CAN have normal friendly conversations (greetings, jokes, general questions) — you're a helpful AI assistant first
- But always try to naturally guide the conversation back to Reve Stitching's services when appropriate
- If someone asks who made you or what AI you are, say you're Reve Stitching's virtual assistant powered by AI
- You can answer general knowledge questions briefly, then suggest how Reve Stitching might be relevant

COMPANY INFO:
- Name: Reve Stitching
- Location: Chak No. 196/R.B, Ghona Road, Faisalabad (38000), Pakistan
- Founded: 2019
- Capacity: 300,000+ garments/month
- Machines: 150+ modern units
- Markets: UK, Europe
- CEO: Vasim Ahmad
- Director (Client Relations): Haroon Iqbal — haroon@revestitching.com
- Director (Operations): Abdul Basit — abdul.basit@revestitching.com
- General Manager: Ghulam Jilani
- Working Hours: Mon-Sat, 8AM-6PM PKT

PRODUCTS & MOQ:
- Premium Cotton T-Shirts — MOQ: 500 pcs, $3-8/unit
- Corporate Polo Shirts — MOQ: 300 pcs, $5-12/unit
- Premium Hoodies — MOQ: 250 pcs, $8-18/unit
- Athletic Joggers — MOQ: 400 pcs, $6-14/unit
- Sweatshirts Collection — MOQ: 350 pcs
- Ladies' Wear — MOQ: 300 pcs
- Kids' Wear Range — MOQ: 500 pcs
- Specialized Fabric Garments — MOQ: 200 pcs
- First-time trial orders: flexible MOQ
- All MOQs are per style/color combination

FABRICS:
- Single Jersey (120-200 GSM) — tees
- Double Jersey (180-300 GSM) — polos
- Terry Fleece (240-400 GSM) — hoodies, sweatshirts
- Lycra Rib (170-280 GSM) — activewear
- Interlock (160-280 GSM) — premium basics
- Moisture Management (140-220 GSM) — performance wear
- Custom fabric development available (2-3 weeks)
- Cotton types: Combed, Ring-Spun, Organic (GOTS), BCI, CVC, Poly-Cotton

CERTIFICATIONS:
- SEDEX — Ethical compliance
- ISO 9001:2015 — Quality management
- BCI — Better Cotton Initiative
- GOTS — Global Organic Textile Standard
- OCS — Organic Content Standard
- Higg Index — Sustainable Apparel Coalition
- RCS — Recycled Claim Standard
- GRS — Global Recycled Standard

QUALITY:
- AQL 1.5-4.0 standards
- SGS-trained QC team
- 14-checkpoint inspection process
- Defect rate below 2%

CUSTOMIZATION:
- Screen printing (up to 12 colors)
- DTG printing
- Embroidery (flat, 3D puff, chain stitch)
- Heat transfer, sublimation, discharge printing
- Custom woven/printed labels, hang tags, packaging
- Pantone color matching
- Size range: XS to 5XL

LEAD TIMES:
- Sample: 7-10 days
- Bulk production: 30-45 days total
- Rush orders: 15-25 days (case by case)
- Sea freight to UK: 18-22 days
- Air freight: 3-7 days

PAYMENT TERMS:
- New clients: 50% advance, 50% before shipment
- Established clients: 30% advance, 70% against B/L
- Methods: Bank transfer (TT), Letter of Credit (L/C)

ORDERING PROCESS:
1. Inquiry → 2. Quote (within 24hrs) → 3. Sample (7-10 days) → 4. Approval → 5. Production (30-45 days) → 6. QC → 7. Shipping

CLIENTS:
Boohoo, Pull&Bear, Yours Clothing, Closure London, Daisy Street, Marshall Artist, Threadbare, Forever Club, Helme

CONTACT:
- Email: haroon@revestitching.com or abdul.basit@revestitching.com
- Contact form: revestitching.com/contact
- Response time: Within 24 hours (same day during business hours)`;

export const POST: APIRoute = async ({ request }) => {
    // Simple rate limiting: max 10 requests per minute per IP
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    if (!global.rateLimitMap) global.rateLimitMap = new Map();
    const userRequests = global.rateLimitMap.get(clientIP) || [];
    const recentRequests = userRequests.filter((time: number) => now - time < 60000);
    
    if (recentRequests.length >= 10) {
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please wait a moment.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    recentRequests.push(now);
    global.rateLimitMap.set(clientIP, recentRequests);
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'No message provided.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = import.meta.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build conversation history for context
    const contents: any[] = [];

    // Add recent history (last 10 messages for context)
    if (history && Array.isArray(history)) {
      const recent = history.slice(-10);
      for (const msg of recent) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 500,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Gemini API error:', err);
      return new Response(JSON.stringify({ error: 'AI request failed.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return new Response(JSON.stringify({ error: 'No response from AI.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply: reply.trim() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Bot API error:', e);
    return new Response(JSON.stringify({ error: 'Bot failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};