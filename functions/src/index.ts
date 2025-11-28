import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import * as cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// Using .env file (Modern approach)
const MASTER_API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenAI({ apiKey: MASTER_API_KEY });

const DAILY_QUOTA_LIMIT = 50;

export const generateContentProxy = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // 1. Validate Auth
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).send({ error: 'Unauthorized' });
            return;
        }

        const idToken = authHeader.split('Bearer ')[1];
        let uid;
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
        } catch (error) {
            res.status(401).send({ error: 'Invalid Token' });
            return;
        }

        // 2. Check Quota
        const userRef = db.collection('users').doc(uid);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        try {
            await db.runTransaction(async (t) => {
                const doc = await t.get(userRef);
                const userData = doc.data() || {};
                const quota = userData.quota || { limit: DAILY_QUOTA_LIMIT, used: 0, lastReset: today };

                // Reset if new day
                if (quota.lastReset !== today) {
                    quota.used = 0;
                    quota.lastReset = today;
                }

                if (quota.used >= quota.limit) {
                    throw new Error('QUOTA_EXCEEDED');
                }

                // 3. Call Gemini API
                const { model: modelName, prompt, systemInstruction, generationConfig } = req.body;

                if (!MASTER_API_KEY) {
                    throw new Error('SERVER_CONFIG_ERROR');
                }

                // Use provided config or default
                // Extract systemInstruction and safetySettings if they are accidentally in generationConfig
                const {
                    systemInstruction: ignoredSys,
                    safetySettings,
                    ...cleanGenConfig
                } = generationConfig || {};

                const finalConfig = {
                    temperature: 0.7,
                    ...cleanGenConfig
                };

                const result = await genAI.models.generateContent({
                    model: modelName || "gemini-2.5-flash", // Stable, fast, cost-efficient
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: {
                        systemInstruction: systemInstruction,
                        ...finalConfig,
                        safetySettings: safetySettings
                    }
                });

                let responseText = "";

                // Log the entire result to see its structure
                console.log("Gemini API result structure:", JSON.stringify({
                    hasText: !!result.text,
                    hasCandidates: !!result.candidates,
                    resultKeys: Object.keys(result),
                }));

                try {
                    // New SDK: result IS the response, text is a function or getter?
                    // Based on previous findings, text() is a function in SDK v1?
                    // Wait, Step 2049 said it's a getter.
                    // But let's check if it's a function.
                    // Actually, let's try accessing it as a function first, if not, try property.
                    // BUT TS will complain if I use it wrong.
                    // If TS says 'text' is a function, I call it.
                    // If TS says 'text' is string, I access it.
                    // I'll assume it's a function based on typical SDK patterns, OR check the type definition if I could.
                    // Step 2049: "This expression is not callable because it is a 'get' accessor."
                    // So it IS a getter.
                    responseText = result.text || "";
                } catch (e) {
                    console.error("Error extracting text:", e);
                }

                if (!responseText) {
                    // Fallback check
                    const candidates = result.candidates;
                    if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
                        responseText = candidates[0].content.parts.map((p: any) => p.text).join('');
                    }
                }

                // 4. Update Quota
                quota.used += 1;
                t.set(userRef, { quota }, { merge: true });

                // 5. Return Result
                // Send back text AND candidates to handle safety/finishReason correctly on client
                console.log("Sending response:", {
                    textLength: responseText?.length || 0,
                    hasCandidates: !!result.candidates,
                    candidatesLength: result.candidates?.length || 0
                });

                res.status(200).send({
                    text: responseText || "",
                    candidates: result.candidates || []
                });
            });
        } catch (error: any) {
            console.error("Proxy Error:", error);
            if (error.message === 'QUOTA_EXCEEDED') {
                res.status(429).send({ error: 'Quota Exceeded', code: 'QUOTA_EXCEEDED' });
            } else if (error.message === 'SERVER_CONFIG_ERROR') {
                res.status(500).send({ error: 'Server Configuration Error' });
            } else {
                res.status(500).send({ error: error.message || 'Internal Server Error' });
            }
        }
    });
});
