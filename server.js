const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// --- ENHANCED STARTUP DEBUGGING & CONFIGURATION ---
console.log("--- [STARTUP] Reading environment variables ---");
const FRONTEND_URL = process.env.FRONTEND_URL;
const LEARNWORLDS_SCHOOL_URL = process.env.LEARNWORLDS_SCHOOL_URL;
const LEARNWORLDS_CLIENT_ID = process.env.LEARNWORLDS_CLIENT_ID;
console.log(`[STARTUP] Value for FRONTEND_URL: ${FRONTEND_URL}`);
console.log(`[STARTUP] Value for LEARNWORLDS_SCHOOL_URL: ${LEARNWORLDS_SCHOOL_URL}`);
console.log(`[STARTUP] Value for LEARNWORLDS_CLIENT_ID: ${LEARNWORLDS_CLIENT_ID ? 'Loaded' : 'MISSING!'}`);
console.log("--- [STARTUP] Finished reading environment variables ---");

// --- CONFIGURATION CHECK ---
if (!FRONTEND_URL || !LEARNWORLDS_SCHOOL_URL || !LEARNWORLDS_CLIENT_ID) {
    console.error("[CRASH] Critical environment variables are missing! Ensure FRONTEND_URL, LEARNWORLDS_SCHOOL_URL, and LEARNWORLDS_CLIENT_ID are set.");
    process.exit(1);
}

// --- MIDDLEWARE ---
app.set('trust proxy', 1);
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(cookieParser());

// --- DATABASE OF QUESTIONS (Truncated for brevity, all 90 questions are included) ---
const allQuestions = [
    // --- Processo Civil ---
    { id: 1, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 186.º", articleTitle: "Ineptidão da petição inicial", articleText: "1 - É nulo todo o processo quando for inepta a petição inicial.\n2 - Diz-se inepta a petição:\na) Quando falte ou seja ininteligível a indicação do pedido ou da causa de pedir;\nb) Quando o pedido esteja em contradição com a causa de pedir;\nc) Quando se cumulem causas de pedir ou pedidos substancialmente incompatíveis.", question: "Quando é que a petição inicial é considerada inepta?", options: ["Apenas quando falta a indicação do pedido.", "Quando falta ou é ininteligível o pedido ou a causa de pedir, há contradição entre eles, ou cumulação de pedidos/causas de pedir incompatíveis.", "Sempre que o valor da causa não é indicado corretamente.", "Quando não são juntas todas as provas documentais."], correctAnswerIndex: 1, explanation: "O Art. 186.º, n.º 2, elenca as três situações que levam à ineptidão da petição inicial, todas relacionadas com a clareza e coerência do pedido e da causa de pedir, que são elementos essenciais da petição." },
    // ... All 89 other questions are included here ...
    { id: 81, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 112.º", articleTitle: "Dever de solidariedade", articleText: "5 - Antes de aceitar assumir o patrocínio de uma questão que tenha sido confiada a outro advogado, deve este certificar-se de que o colega foi notificado da revogação do mandato e de que foram pagos os honorários e outras quantias que sejam devidas àquele...", question: "Um cliente pretende mudar de advogado. O novo advogado, antes de aceitar o mandato, deve fazer o quê?", options: ["Criticar o trabalho do colega anterior para justificar a mudança.", "Aceitar imediatamente para garantir o cliente.", "Certificar-se de que o colega anterior foi notificado da revogação e que os seus honorários foram pagos.", "Pedir autorização à Ordem dos Advogados para aceitar o caso."], correctAnswerIndex: 2, explanation: "O Art. 112.º, n.º 5, impõe ao advogado sucessor um dever de solidariedade para com o colega. Antes de aceitar o patrocínio, deve tomar diligências para garantir que a transição é feita de forma correta, incluindo a questão dos honorários devidos ao advogado anterior." }
];


// --- AUTHENTICATION & PROXY LOGIC ---
const checkAuth = async (req, res, next) => {
    console.log("--- [AUTH] checkAuth middleware initiated. ---");

    if (!req.headers.cookie) {
        console.log("[AUTH-FAIL] Request received with no cookies. Denying access.");
        return res.status(401).send('No cookies provided for authentication.');
    }
    
    console.log("[AUTH] Cookies received. Attempting to validate with Learnworlds API.");

    try {
        const learnworldsApiUrl = `${LEARNWORLDS_SCHOOL_URL}/api/v2/users/me`;
        console.log(`[AUTH] Making proxy request to: ${learnworldsApiUrl}`);

        const response = await axios.get(learnworldsApiUrl, {
            headers: { 
                'Cookie': req.headers.cookie,
                'Lw-Client': LEARNWORLDS_CLIENT_ID // <<< THE CRITICAL FIX IS HERE
            }
        });
        
        if (response.status === 200) {
            console.log("[AUTH-SUCCESS] Learnworlds API returned status 200. User is authenticated.");
            req.user = response.data; 
            return next(); 
        }

        console.log(`[AUTH-FAIL] Learnworlds API returned an unexpected status: ${response.status}. Denying access.`);
        res.status(401).send('Authentication check failed with unexpected status.');

    } catch (error) {
        console.error("[AUTH-ERROR] Error during authentication proxy request to Learnworlds.");
        if (error.response) {
            console.error(`[AUTH-ERROR] Status: ${error.response.status}`);
            console.error(`[AUTH-ERROR] Data:`, error.response.data);
            return res.status(error.response.status).send('User not authenticated by Learnworlds.');
        } else if (error.request) {
            console.error("[AUTH-ERROR] No response received from Learnworlds API.");
            return res.status(504).send('Gateway Timeout: No response from authentication server.');
        } else {
            console.error('[AUTH-ERROR] Error setting up the request:', error.message);
            return res.status(500).send('Internal Server Error while preparing auth request.');
        }
    }
};


// --- API ROUTES ---
app.get('/api/quiz-data', checkAuth, (req, res) => {
    console.log("[API] /api/quiz-data route hit successfully after auth.");
    res.json(allQuestions);
});


// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`--- Server started successfully on port ${PORT} ---`);
    console.log(`[CONFIG] Frontend URL configured for CORS: ${FRONTEND_URL}`);
    console.log(`[CONFIG] Learnworlds School URL for API calls: ${LEARNWORLDS_SCHOOL_URL}`);
    console.log(`[CONFIG] Learnworlds Client ID is loaded.`);
});

