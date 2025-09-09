// --- DEPENDENCIES ---
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS Configuration ---
// This allows your Vercel frontend to communicate with your Heroku backend.
const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
    console.error("CRITICAL ERROR: FRONTEND_URL is not set in environment variables.");
}
app.use(cors({
    origin: frontendUrl,
    credentials: true
}));

// --- SESSION MANAGEMENT ---
// This is essential for keeping the user logged in across requests.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production (Heroku)
}));

// --- PASSPORT (AUTHENTICATION) SETUP ---
app.use(passport.initialize());
app.use(passport.session());

// Define how Passport will handle Learnworlds OAuth2
passport.use('learnworlds', new OAuth2Strategy({
    authorizationURL: `${process.env.LEARNWORLDS_SCHOOL_URL}/admin/oauth2/authorize`,
    tokenURL: `${process.env.LEARNWORLDS_SCHOOL_URL}/admin/oauth2/access_token`,
    clientID: process.env.LEARNWORLDS_CLIENT_ID,
    clientSecret: process.env.LEARNWORLDS_CLIENT_SECRET,
    callbackURL: `${process.env.HEROKU_APP_URL}/auth/learnworlds/callback`,
    scope: ['read:user', 'read:courses']
  },
  function(accessToken, refreshToken, profile, done) {
    // Store the access token in the user's session
    const user = { accessToken };
    return done(null, user);
  }
));

// Serialize user to store in the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// --- YOUR INTELLECTUAL PROPERTY (QUIZ DATA) ---
// This data is now protected on the backend.
const articlesData = [
    { id: 10, code: "Código de Processo Civil", /* ... rest of the question data ... */ },
    // ... Paste all 24 of your question objects here ...
    // Example:
    {
        id: 10,
        code: "Código de Processo Civil",
        articleNumber: "Artigo 588.º",
        articleTitle: "Termos em que são admitidos",
        articleText: "1 - Os factos constitutivos, modificativos ou extintivos do direito que forem supervenientes podem ser deduzidos em articulado posterior ou em novo articulado, pela parte a quem aproveitem, até ao encerramento da discussão.\n2 - Dizem-se supervenientes tanto os factos ocorridos posteriormente ao termo dos prazos marcados nos artigos precedentes como os factos anteriores de que a parte só tenha conhecimento depois de findarem esses prazos, devendo neste caso produzir-se prova da superveniência.\n3 - O novo articulado em que se aleguem factos supervenientes é oferecido:\na) Na audiência prévia, quando os factos hajam ocorrido ou sido conhecidos até ao respetivo encerramento;\nb) Nos 10 dias posteriores à notificação da data designada para a realização da audiência final, quando não se tenha realizado a audiência prévia;\nc) Na audiência final, se os factos ocorreram ou a parte deles teve conhecimento em data posterior às referidas nas alíneas anteriores.\n4 - O juiz profere despacho liminar sobre a admissão do articulado superveniente, rejeitando-o quando, por culpa da parte, for apresentado fora de tempo, ou quando for manifesto que os factos não interessam à boa decisão da causa; ou ordenando a notificação da parte contrária para responder em 10 dias, observando-se, quanto à resposta, o disposto no artigo anterior.\n5 - As provas são oferecidas com o articulado e com a resposta.\n6 - Os factos articulados que interessem à decisão da causa constituem tema da prova nos termos do disposto no artigo 596.º.",
        question: "Uma parte tem conhecimento de um facto relevante para a causa após a audiência prévia. Em que momento deve apresentar o articulado superveniente?",
        options: ["A qualquer momento, até ao trânsito em julgado.", "Na própria audiência final.", "Nos 10 dias posteriores à notificação da data designada para a audiência final.", "Apenas se a parte contrária concordar."],
        correctAnswerIndex: 2,
        explanation: "De acordo com a alínea b) do n.º 3 do Artigo 588.º, se não houver audiência prévia ou os factos forem conhecidos após esta, o articulado superveniente deve ser oferecido nos 10 dias posteriores à notificação da data da audiência final."
    },
    // ... (All other 23 questions go here)
];


// --- MIDDLEWARE ---
// Middleware to check if the user is authenticated via session
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // If not authenticated, send a 401 Unauthorized status.
    // The frontend will see this and redirect the user to the login flow.
    res.status(401).send('Unauthorized');
}

// Middleware to check if the authenticated user is enrolled in the specific course
async function isEnrolled(req, res, next) {
    const courseId = process.env.REQUIRED_COURSE_ID;
    const accessToken = req.user.accessToken;

    if (!courseId) {
        return res.status(500).send("Error: REQUIRED_COURSE_ID is not configured on the server.");
    }
    
    try {
        // Get the current user's ID from Learnworlds
        const userResponse = await axios.get(`${process.env.LEARNWORLDS_SCHOOL_URL}/api/v2/user`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const userId = userResponse.data.id;

        // Check if that user ID is in the list of users for the required course
        const enrollmentResponse = await axios.get(`${process.env.LEARNWORLDS_SCHOOL_URL}/api/v2/courses/${courseId}/users`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const isUserEnrolled = enrollmentResponse.data.data.some(user => user.id === userId);

        if (isUserEnrolled) {
            return next();
        } else {
            res.status(403).send("Forbidden: User is not enrolled in the required course.");
        }
    } catch (error) {
        console.error("API call to Learnworlds failed:", error.response ? error.response.data : error.message);
        res.status(500).send("Failed to verify course enrollment.");
    }
}


// --- ROUTES ---

// 1. Authentication Start Route
// The user is sent here first. Passport redirects them to Learnworlds.
app.get('/auth/learnworlds', passport.authenticate('learnworlds'));

// 2. Authentication Callback Route
// Learnworlds redirects the user back here after they log in.
app.get('/auth/learnworlds/callback', 
    passport.authenticate('learnworlds', { failureRedirect: '/auth/failure' }),
    (req, res) => {
        // Successful authentication, redirect to the frontend application.
        res.redirect(process.env.FRONTEND_URL);
    }
);

// Route for failed authentication
app.get('/auth/failure', (req, res) => {
    res.status(401).send('Authentication failed. Please try again.');
});

// 3. Protected API Route for Quiz Data
// This is the "gatekeeper" route. It requires both authentication and enrollment.
app.get('/api/quiz-data', isAuthenticated, isEnrolled, (req, res) => {
    // If the user passes both middleware checks, send the quiz data.
    res.json(articlesData);
});

// --- SERVER STARTUP ---
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
