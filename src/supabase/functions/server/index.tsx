import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-4956c4ca/health", (c) => {
  return c.json({ status: "ok" });
});

// Helper function to generate mock bias analysis
function generateMockAnalysis(text: string) {
  const lowerText = text.toLowerCase();
  const biases = [];
  let score = 100;
  const detailedExplanations = [];
  
  // Gender bias detection - gendered pronouns or unnecessary gender mentions
  if (lowerText.match(/\b(he|she|him|her|his|hers)\b/)) {
    biases.push("Gender Bias");
    detailedExplanations.push("Use of gendered pronouns instead of 'the patient' or 'their'");
    score -= 15;
  }
  if (lowerText.match(/\b(male|female|man|woman|boy|girl)\b/) && 
      !lowerText.match(/\b(male to female|female to male|assigned)\b/)) {
    if (!biases.includes("Gender Bias")) {
      biases.push("Gender Bias");
      score -= 10;
    }
    detailedExplanations.push("Gender mentioned when not medically relevant");
  }
  
  // Age bias - judgmental or stereotypical age descriptors
  if (lowerText.match(/\b(elderly|old|geriatric|ancient)\b/)) {
    biases.push("Age Bias");
    detailedExplanations.push("Use of potentially pejorative age descriptors like 'elderly' or 'old' instead of specific age");
    score -= 15;
  }
  if (lowerText.match(/\byoung\b/) && !lowerText.match(/\byear[s]?\s+old\b/)) {
    if (!biases.includes("Age Bias")) biases.push("Age Bias");
    detailedExplanations.push("Vague age descriptor 'young' used instead of specific age");
    score -= 10;
  }
  
  // Tone bias - judgmental language about patient behavior
  if (lowerText.match(/\b(non-compliant|noncompliant|difficult|uncooperative|demanding|aggressive|dramatic|hysterical|attention-seeking|manipulative)\b/)) {
    biases.push("Tone Bias / Behavioral Judgment");
    detailedExplanations.push("Judgmental language about patient behavior that could affect care quality");
    score -= 25;
  }
  if (lowerText.match(/\b(refused|failed to|wouldn't)\b/)) {
    if (!biases.includes("Tone Bias / Behavioral Judgment")) {
      biases.push("Tone Bias / Behavioral Judgment");
      score -= 15;
    }
    detailedExplanations.push("Negative framing of patient choices without medical context");
  }
  
  // Weight bias - judgmental weight descriptors without clinical context
  if (lowerText.match(/\b(obese|fat|overweight|malnourished|skinny)\b/) && 
      !lowerText.match(/\b(bmi|body mass index|weight|kg|lbs)\b/)) {
    biases.push("Weight Bias");
    detailedExplanations.push("Subjective weight descriptors without objective measurements (BMI, weight)");
    score -= 15;
  }
  
  // Racial/ethnic bias - unnecessary race mentions or stereotyping
  if (lowerText.match(/\b(race|ethnicity|african american|asian|hispanic|latino|latina|caucasian|black|white|brown)\b/i) &&
      !lowerText.match(/\b(sickle cell|thalassemia|genetic|hereditary|family history)\b/)) {
    biases.push("Racial/Ethnic Bias");
    detailedExplanations.push("Race or ethnicity mentioned without clear medical relevance");
    score -= 20;
  }
  
  // Socioeconomic bias
  if (lowerText.match(/\b(poor|homeless|low-income|poverty|wealthy|affluent|lives in|resides in)\b/)) {
    biases.push("Socioeconomic Bias");
    detailedExplanations.push("Socioeconomic status mentioned in potentially judgmental way");
    score -= 15;
  }
  
  // Substance use stigma
  if (lowerText.match(/\b(addict|junkie|alcoholic|drug-seeking|drug seeker)\b/)) {
    biases.push("Substance Use Stigma");
    detailedExplanations.push("Stigmatizing language for substance use disorder - use person-first language");
    score -= 20;
  }
  
  // Mental health stigma
  if (lowerText.match(/\b(crazy|insane|psycho|nuts|mental)\b/) && 
      !lowerText.match(/\bmental health\b/)) {
    biases.push("Mental Health Stigma");
    detailedExplanations.push("Stigmatizing mental health language");
    score -= 20;
  }
  
  // Appearance-based judgments
  if (lowerText.match(/\b(appears|looks|seems)\b/) && 
      lowerText.match(/\b(disheveled|unkempt|well-groomed|well-dressed|poorly|dirty)\b/)) {
    biases.push("Appearance Bias");
    detailedExplanations.push("Subjective judgments about patient appearance");
    score -= 10;
  }
  
  const explanation = biases.length > 0
    ? `Analysis detected ${biases.length} potential bias category(ies): ${biases.join(", ")}. Issues found:\n\n${detailedExplanations.map((exp, i) => `${i + 1}. ${exp}`).join("\n")}\n\nThese types of language can introduce implicit bias and may affect clinical decision-making and patient care quality.`
    : "No significant biases detected. The note appears to maintain clinical objectivity, uses person-first language, and focuses on medical facts without subjective characterizations or unnecessary demographic identifiers.";
  
  let suggestedRewrite = text;
  if (biases.length > 0) {
    // Apply multiple transformations for better rewrites
    suggestedRewrite = suggestedRewrite
        .replace(/\b(non-compliant|noncompliant|non compliant)\b/gi, "experiencing challenges with treatment adherence")
        .replace(/\b(difficult|uncooperative)\b/gi, "requiring additional support")
        .replace(/\b(demanding|aggressive)\b/gi, "expressing strong concerns")
        .replace(/\b(dramatic|hysterical)\b/gi, "exhibiting signs of distress")
        .replace(/\b(attention-seeking|manipulative)\b/gi, "reporting symptoms")
        .replace(/\b(refused|failed to)\b/gi, "declined")
        .replace(/\bwouldn't\b/gi, "was unable to")
        .replace(/\b(elderly|old|geriatric)\b/gi, "[XX-year-old]")
        .replace(/\byoung\b/gi, "[XX-year-old]")
        .replace(/\b(he|she)\b/gi, "the patient")
        .replace(/\b(his|her|him)\b/gi, "their")
        .replace(/\b(hers)\b/gi, "theirs")
        .replace(/\b(obese|fat)\b/gi, "with BMI of [XX]")
        .replace(/\b(skinny|malnourished)\b/gi, "with low BMI of [XX]")
        .replace(/\b(addict|junkie)\b/gi, "person with substance use disorder")
        .replace(/\balcoholic\b/gi, "person with alcohol use disorder")
        .replace(/\b(drug-seeking|drug seeker)\b/gi, "requesting pain management")
        .replace(/\b(crazy|insane|psycho|nuts)\b/gi, "experiencing psychiatric symptoms")
        .replace(/\b(appears|looks|seems)\s+(disheveled|unkempt|well-groomed|well-dressed|poorly|dirty)\b/gi, "presents with");
  }
  
  return {
    fairnessScore: Math.max(0, score),
    detectedBiases: biases,
    explanation,
    suggestedRewrite,
  };
}

// Analyze medical note for bias using Claude API
app.post("/make-server-4956c4ca/analyze-bias", async (c) => {
  try {
    const { text, mode } = await c.req.json();
    
    if (!text) {
      return c.json({ error: "No text provided" }, 400);
    }

    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY");
    console.log("Claude API Key status:", claudeApiKey ? `Present (${claudeApiKey.substring(0, 10)}...)` : "Missing");
    
    // If no API key or in demo mode, use mock analysis
    if (!claudeApiKey) {
      console.log("No Claude API key - using mock analysis");
      return c.json(generateMockAnalysis(text));
    }

    const prompt = `You are an expert medical bias detection AI system trained to identify implicit and explicit biases in clinical documentation. Your goal is to ensure medical notes are objective, person-centered, and free from language that could compromise patient care quality.

Analyze the following medical note for potential biases across these categories:

1. **Gender Bias**: Unnecessary use of gendered pronouns (he/she) or gender mentions when not medically relevant
2. **Age Bias**: Use of judgmental age descriptors (elderly, old, geriatric) instead of specific ages
3. **Tone Bias / Behavioral Judgment**: Judgmental language about patient behavior (non-compliant, difficult, uncooperative, demanding, dramatic, hysterical, attention-seeking, manipulative)
4. **Weight Bias**: Subjective weight descriptors without clinical measurements (obese, fat, skinny)
5. **Racial/Ethnic Bias**: Mention of race/ethnicity without clear medical relevance
6. **Socioeconomic Bias**: Judgmental references to socioeconomic status
7. **Substance Use Stigma**: Stigmatizing language (addict, junkie, drug-seeking) instead of person-first language
8. **Mental Health Stigma**: Derogatory mental health language (crazy, psycho, insane)
9. **Appearance Bias**: Subjective judgments about appearance (disheveled, unkempt)
10. **Language/Communication Bias**: Judgmental references to language barriers or communication styles

Medical Note:
"""
${text}
"""

**Scoring Guidelines:**
- 90-100: Excellent - objective, person-first language, no detectable bias
- 70-89: Good - minor issues with phrasing that could be improved
- 50-69: Fair - several biased terms or unnecessary demographic mentions
- 30-49: Poor - significant judgmental language or stereotyping
- 0-29: Very Poor - pervasive bias that could seriously impact care

**Important**: Be thorough but fair. Not every mention of demographics is bias - only flag when it's:
- Medically irrelevant
- Phrased in judgmental/stereotypical way
- Could influence clinical decision-making negatively

Provide your analysis in this exact JSON format:
{
  "fairnessScore": <number from 0-100>,
  "detectedBiases": [<array of bias type strings, e.g., "Gender Bias", "Tone Bias / Behavioral Judgment">],
  "explanation": "<Detailed explanation of specific issues found, referencing actual text from the note. If no bias detected, explain why the note is objective and fair>",
  "suggestedRewrite": "<Complete rewritten version of the note that: (1) replaces gendered pronouns with 'the patient' or 'their', (2) uses person-first language, (3) removes judgmental descriptors, (4) replaces subjective terms with objective clinical observations, (5) removes medically irrelevant demographic info. Maintain ALL clinical facts and medical accuracy.>"
}

Respond ONLY with the JSON object, no additional text before or after.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Claude API error during bias analysis (status ${response.status}): ${errorText}`);
      
      // Check if it's a credit/billing error - use mock analysis instead
      if (response.status === 400 || errorText.includes("credit balance") || errorText.includes("billing")) {
        console.log("API credits exhausted - using demo mode with mock analysis");
        const result = generateMockAnalysis(text);
        return c.json({
          ...result,
          isDemoMode: true,
          warning: "API credits exhausted - using pattern-based analysis. Please add credits at https://console.anthropic.com for AI-powered analysis."
        });
      }
      
      return c.json({ error: `Claude API error: ${errorText}` }, 500);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse the JSON response from Claude
    const analysisResult = JSON.parse(content);

    return c.json(analysisResult);
  } catch (error) {
    console.log(`Error analyzing bias: ${error}`);
    
    // On any error, try to use mock analysis as fallback
    try {
      const { text } = await c.req.json();
      if (text) {
        console.log("Error occurred - falling back to mock analysis");
        return c.json(generateMockAnalysis(text));
      }
    } catch (fallbackError) {
      // If fallback also fails, return original error
    }
    
    return c.json({ error: `Failed to analyze bias: ${error.message}` }, 500);
  }
});

// Extract text from image/PDF using OCR
app.post("/make-server-4956c4ca/extract-text", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Get file buffer
    const buffer = await (file as Blob).arrayBuffer();
    const fileType = (file as File).type;
    const fileName = (file as File).name;

    console.log(`Processing OCR for file: ${fileName}, type: ${fileType}`);
    
    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY");
    
    // If no API key, return mock text
    if (!claudeApiKey) {
      console.log("No Claude API key - using mock OCR");
      const mockExtractedText = `Patient presents with chief complaint of chest pain, duration 2 hours. Pain described as pressure-like, radiating to left arm. Associated symptoms include shortness of breath and diaphoresis. Past medical history significant for hypertension and hyperlipidemia. Current medications: Lisinopril 10mg daily, Atorvastatin 40mg nightly. Vital signs: BP 145/92, HR 98, RR 20, O2 sat 96% on room air. Physical exam reveals anxious-appearing patient, heart sounds regular, lungs clear bilaterally. EKG ordered and pending. Initial impression: acute coronary syndrome versus anxiety. Plan: Aspirin 325mg given, serial troponins, cardiology consult.`;
      return c.json({ text: mockExtractedText });
    }

    // PDFs are not supported by Claude Vision API
    if (fileType === 'application/pdf') {
      console.log("PDF upload detected - Claude Vision doesn't support PDFs");
      return c.json({ 
        error: "PDF files are not supported. Please convert your PDF to an image (JPG or PNG) or take a photo of the document." 
      }, 400);
    }

    // Convert buffer to base64 for Claude Vision API
    const base64Image = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Determine media type
    let mediaType = 'image/jpeg';
    if (fileType === 'image/png') mediaType = 'image/png';
    else if (fileType === 'image/webp') mediaType = 'image/webp';
    else if (fileType === 'image/gif') mediaType = 'image/gif';

    // Use Claude Vision API to extract text from image
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: "This is a handwritten medical note. Please extract ALL of the text from this image exactly as it appears, preserving the original wording, grammar, and spelling. Do not correct, summarize, or modify anything - just transcribe the text verbatim. If any text is unclear, make your best guess and put [unclear] after uncertain words.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Claude Vision API error during OCR (status ${response.status}): ${errorText}`);
      
      // Check if it's a credit/quota issue
      if (response.status === 400 && errorText.includes("credit balance")) {
        console.log("API credits exhausted - using demo mode with mock OCR");
        const mockExtractedText = `Ms. Lopez, 32 y/o female.
The patient seems overly emotional and anxious. Chest pain for a week. 
I think it's not serious since she looks healthy and fit. Probably just anxiety. 
She should try to relax more and avoid worrying too much.`;
        return c.json({ 
          text: mockExtractedText,
          isDemoMode: true,
          warning: "API credits exhausted - using demo text. Please add credits at https://console.anthropic.com"
        });
      }
      
      throw new Error(`Claude Vision API returned ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const extractedText = data.content[0].text;

    console.log(`OCR successful - extracted ${extractedText.length} characters`);
    return c.json({ text: extractedText });
  } catch (error) {
    console.log(`Error extracting text from image: ${error}`);
    return c.json({ error: `Failed to extract text: ${error.message}` }, 500);
  }
});

// Convert speech to text using ElevenLabs API (for uploaded audio files)
app.post("/make-server-4956c4ca/speech-to-text", async (c) => {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return c.json({ error: "No audio file provided" }, 400);
    }

    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    console.log("ElevenLabs API Key status:", elevenlabsApiKey ? `Present (${elevenlabsApiKey.substring(0, 10)}...)` : "Missing");
    
    // If no API key, return mock transcription
    if (!elevenlabsApiKey) {
      console.log("No ElevenLabs API key - returning demo transcription");
      return c.json({ 
        text: "Patient presents with chief complaint of persistent headache for the past 3 days. Denies visual changes, nausea, or vomiting. Vital signs stable. Physical examination unremarkable. Plan: prescribe acetaminophen, follow up in 1 week if symptoms persist.",
        isDemoMode: true,
        warning: "ElevenLabs API key not configured - using demo transcription"
      });
    }

    // ElevenLabs speech-to-text endpoint
    const uploadFormData = new FormData();
    uploadFormData.append("audio", audioFile);

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": elevenlabsApiKey,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`ElevenLabs API error during speech-to-text: ${errorText}`);
      
      // If API fails, return demo transcription
      if (response.status === 400 || errorText.includes("credit") || errorText.includes("quota") || errorText.includes("billing")) {
        console.log("API quota/billing issue - returning demo transcription");
        return c.json({ 
          text: "Patient presents with chief complaint of persistent headache for the past 3 days. Denies visual changes, nausea, or vomiting. Vital signs stable. Physical examination unremarkable. Plan: prescribe acetaminophen, follow up in 1 week if symptoms persist.",
          isDemoMode: true,
          warning: "ElevenLabs API credits exhausted - using demo transcription. Add credits at https://elevenlabs.io"
        });
      }
      
      return c.json({ error: `ElevenLabs API error: ${errorText}` }, 500);
    }

    const data = await response.json();
    return c.json({ text: data.text });
  } catch (error) {
    console.log(`Error converting speech to text: ${error}`);
    
    // Fallback to demo transcription
    console.log("Error occurred - returning demo transcription");
    return c.json({ 
      text: "Patient presents with chief complaint of persistent headache for the past 3 days. Denies visual changes, nausea, or vomiting. Vital signs stable. Physical examination unremarkable. Plan: prescribe acetaminophen, follow up in 1 week if symptoms persist.",
      isDemoMode: true,
      warning: "Speech-to-text service unavailable - using demo transcription"
    });
  }
});

// Live streaming speech-to-text proxy for ElevenLabs
app.post("/make-server-4956c4ca/stream-speech-to-text", async (c) => {
  try {
    const formData = await c.req.formData();
    const audioChunk = formData.get("audio");

    if (!audioChunk) {
      return c.json({ error: "No audio chunk provided" }, 400);
    }

    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    
    // If no API key, return mock transcription
    if (!elevenlabsApiKey) {
      console.log("No ElevenLabs API key - returning demo transcription chunk");
      
      // Simulate progressive transcription with random medical phrases
      const medicalPhrases = [
        "Patient presents with",
        "chief complaint of",
        "shortness of breath",
        "for the past two days",
        "denies fever or chills",
        "vital signs stable",
        "physical exam unremarkable"
      ];
      const randomPhrase = medicalPhrases[Math.floor(Math.random() * medicalPhrases.length)];
      
      return c.json({ 
        text: randomPhrase,
        is_final: false,
        isDemoMode: true
      });
    }

    // Forward to ElevenLabs streaming endpoint
    const uploadFormData = new FormData();
    uploadFormData.append("audio", audioChunk);

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": elevenlabsApiKey,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`ElevenLabs streaming API error (${response.status}): ${errorText}`);
      
      // Return demo chunk on error - use fallback phrases
      const medicalPhrases = [
        "Patient presents with",
        "chief complaint of",
        "shortness of breath",
        "for the past two days",
        "denies fever or chills",
        "vital signs stable",
        "physical exam unremarkable"
      ];
      const randomPhrase = medicalPhrases[Math.floor(Math.random() * medicalPhrases.length)];
      
      return c.json({ 
        text: randomPhrase,
        is_final: false,
        isDemoMode: true,
        warning: `ElevenLabs API error: ${response.status} - using demo mode`
      });
    }

    const data = await response.json();
    console.log("ElevenLabs response:", data);
    return c.json({ text: data.text || "", is_final: true });
  } catch (error) {
    console.log(`Error in streaming speech-to-text: ${error}`);
    return c.json({ 
      text: "",
      is_final: false,
      error: error.message 
    }, 500);
  }
});

// Analyze video frame for non-verbal bias cues using Reka Vision API
app.post("/make-server-4956c4ca/analyze-video-frame", async (c) => {
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get("frame");

    if (!imageFile) {
      return c.json({ error: "No video frame provided" }, 400);
    }

    const rekaApiKey = Deno.env.get("REKA_API_KEY");
    console.log("Reka API Key status:", rekaApiKey ? `Present (${rekaApiKey.substring(0, 10)}...)` : "Missing");
    
    // If no API key, return mock analysis
    if (!rekaApiKey) {
      console.log("No Reka API key - returning demo face analysis");
      
      // Mock random non-verbal cues for demo
      const mockCues = [
        [],
        ["GazeAvoidance"],
        ["PostureDismissive"],
        ["DistractedBehavior"],
        []
      ];
      const randomCues = mockCues[Math.floor(Math.random() * mockCues.length)];
      
      return c.json({
        detectedCues: randomCues,
        analysis: randomCues.length > 0 
          ? `Detected potential non-verbal bias indicators: ${randomCues.join(", ")}. Consider maintaining eye contact and open body language.`
          : "No concerning non-verbal cues detected in this frame.",
        isDemoMode: true,
        warning: "Reka API key not configured - using demo analysis"
      });
    }

    // Convert image to base64
    const buffer = await (imageFile as Blob).arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Analyze with Reka Vision API
    const prompt = `Analyze this video frame from a doctor-patient interaction for potential non-verbal bias indicators. Look for:

1. **Gaze & Eye Contact**: Is the doctor looking away, at screen instead of patient, or avoiding eye contact?
2. **Posture**: Does the doctor appear dismissive, closed-off, or disengaged (arms crossed, turned away)?
3. **Facial Expression**: Does the doctor show signs of impatience, annoyance, or dismissiveness?
4. **Attention**: Is the doctor distracted (looking at phone, typing while patient speaks)?
5. **Patient Reaction**: Does the patient appear uncomfortable, ignored, or dismissed?

Return ONLY a JSON object with:
{
  "detectedCues": [<array of strings like "GazeAvoidance", "PostureDismissive", "DistractedBehavior", "ImpatientExpression", "PatientDiscomfort">],
  "analysis": "<brief description of what was observed and recommendations>"
}

Be objective and only flag clear indicators. Empty array if no issues detected.`;

    const response = await fetch("https://api.reka.ai/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": rekaApiKey,
      },
      body: JSON.stringify({
        model: "reka-core-20240501",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: `data:image/jpeg;base64,${base64Image}`
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Reka API error during video analysis (status ${response.status}): ${errorText}`);
      
      // Fallback to mock analysis on error
      return c.json({
        detectedCues: [],
        analysis: "Unable to analyze video frame at this time.",
        isDemoMode: true,
        warning: "Reka API error - using demo mode"
      });
    }

    const data = await response.json();
    const content = data.responses[0].message.content;
    
    // Parse JSON response
    const analysisResult = JSON.parse(content);

    return c.json(analysisResult);
  } catch (error) {
    console.log(`Error analyzing video frame: ${error}`);
    
    // Fallback to empty analysis
    return c.json({
      detectedCues: [],
      analysis: "Video analysis unavailable.",
      isDemoMode: true
    });
  }
});

// Analyze scene for Stream mode using Reka Vision API
app.post("/make-server-4956c4ca/analyze-scene", async (c) => {
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get("frame");

    if (!imageFile) {
      return c.json({ error: "No video frame provided" }, 400);
    }

    const rekaApiKey = Deno.env.get("REKA_API_KEY");
    console.log("Reka API Key status:", rekaApiKey ? `Present (${rekaApiKey.substring(0, 10)}...)` : "Missing");
    
    // If no API key, return mock scene descriptions
    if (!rekaApiKey) {
      console.log("No Reka API key - returning demo scene description");
      
      // Mock scene descriptions for demo
      const mockScenes = [
        "Doctor is reviewing medical charts on the computer screen while taking notes.",
        "Doctor smiled warmly and leaned forward to listen to the patient.",
        "Doctor picked up a pencil and began writing in the patient's file.",
        "Doctor is maintaining eye contact and nodding attentively during the conversation.",
        "Doctor gestured with their hands while explaining the diagnosis to the patient.",
        "Doctor is examining an X-ray image displayed on the monitor.",
        "Doctor appeared thoughtful, pausing briefly before responding to the patient's question.",
        "Doctor is typing on the keyboard while occasionally glancing at the patient.",
      ];
      const randomScene = mockScenes[Math.floor(Math.random() * mockScenes.length)];
      
      return c.json({
        description: randomScene,
        isDemoMode: true,
        warning: "Reka API key not configured - using demo descriptions"
      });
    }

    // Convert image to base64
    const buffer = await (imageFile as Blob).arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Analyze with Reka Vision API
    const prompt = `You are observing a doctor-patient interaction. Describe what is happening in this frame in one natural sentence. 

Focus on:
- What the doctor is doing (examining, writing, typing, gesturing, etc.)
- Facial expressions (smiling, focused, concerned, etc.)
- Body language and posture
- Objects being used (pencil, stethoscope, computer, charts, etc.)
- The nature of the interaction (listening, explaining, examining, etc.)

Examples:
- "Doctor is reviewing medical charts on the computer screen while taking notes."
- "Doctor smiled warmly and leaned forward to listen to the patient."
- "Doctor picked up a pencil and began writing in the patient's file."

Respond with ONLY a single descriptive sentence, no preamble or explanation.`;

    const response = await fetch("https://api.reka.ai/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": rekaApiKey,
      },
      body: JSON.stringify({
        model: "reka-core-20240501",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: `data:image/jpeg;base64,${base64Image}`
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Reka API error during scene analysis (status ${response.status}): ${errorText}`);
      
      // Fallback to mock description on error
      return c.json({
        description: "Doctor is attending to the patient in the examination room.",
        isDemoMode: true,
        warning: "Reka API error - using demo mode"
      });
    }

    const data = await response.json();
    const description = data.responses[0].message.content.trim();

    return c.json({ description });
  } catch (error) {
    console.log(`Error analyzing scene: ${error}`);
    
    // Fallback to generic description
    return c.json({
      description: "Doctor is attending to the patient.",
      isDemoMode: true
    });
  }
});

Deno.serve(app.fetch);