require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS Configuration ---
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
};
app.use(cors(corsOptions));

// --- Session Configuration ---
// This line is crucial for secure cookies to work behind a proxy like Heroku
app.set('trust proxy', 1); 
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: true, // Requires HTTPS
        httpOnly: true,
        sameSite: 'none', // Necessary for cross-site cookie exchange in OAuth
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// --- Passport (Authentication) Strategy ---
passport.use('learnworlds', new OAuth2Strategy({
    // This is the URL the USER is sent to for login. This path is correct.
    authorizationURL: `${process.env.LEARNWORLDS_SCHOOL_URL}/oauth2/authorize`,
    
    // CORRECTED PATH: This is the URL our SERVER calls to get the token.
    // This now matches the documentation you provided.
    tokenURL: `${process.env.LEARNWORLDS_SCHOOL_URL}/admin/api/oauth2/access_token`,
    
    clientID: process.env.LEARNWORLDS_CLIENT_ID,
    clientSecret: process.env.LEARNWORLDS_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const userResponse = await axios.get(`${process.env.LEARNWORLDS_SCHOOL_URL}/api/v2/users/me`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        const user = userResponse.data;
        return done(null, user);
    } catch (err) {
        console.error("Error fetching user from Learnworlds:", err);
        return done(err);
    }
  }
));

// Passport session management
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

// --- ROUTES ---

app.get('/auth/learnworlds', passport.authenticate('learnworlds'));

app.get('/auth/learnworlds/callback',
    passport.authenticate('learnworlds', { failureRedirect: '/auth/failure' }),
    (req, res) => {
        // On success, redirect back to the frontend app
        res.redirect(process.env.FRONTEND_URL);
    }
);

app.get('/auth/failure', (req, res) => {
    res.status(401).send('Authentication failed. Please try logging in again via Learnworlds.');
});

// Middleware to ensure a route is protected
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // If not authenticated, the frontend will redirect to /auth/learnworlds
    res.status(401).send('You are not authenticated');
}

// The protected API endpoint that serves the quiz questions
app.get('/api/quiz-data', ensureAuthenticated, (req, res) => {
    const articlesData = [
         {
            id: 10, code: "Código de Processo Civil", articleNumber: "Artigo 588.º", articleTitle: "Termos em que são admitidos",
            articleText: "1 - Os factos constitutivos, modificativos ou extintivos do direito que forem supervenientes podem ser deduzidos em articulado posterior ou em novo articulado, pela parte a quem aproveitem, até ao encerramento da discussão.\n2 - Dizem-se supervenientes tanto os factos ocorridos posteriormente ao termo dos prazos marcados nos artigos precedentes como os factos anteriores de que a parte só tenha conhecimento depois de findarem esses prazos, devendo neste caso produzir-se prova da superveniência.\n3 - O novo articulado em que se aleguem factos supervenientes é oferecido:\na) Na audiência prévia, quando os factos hajam ocorrido ou sido conhecidos até ao respetivo encerramento;\nb) Nos 10 dias posteriores à notificação da data designada para a realização da audiência final, quando não se tenha realizado a audiência prévia;\nc) Na audiência final, se os factos ocorreram ou a parte deles teve conhecimento em data posterior às referidas nas alíneas anteriores.\n4 - O juiz profere despacho liminar sobre a admissão do articulado superveniente, rejeitando-o quando, por culpa da parte, for apresentado fora de tempo, ou quando for manifesto que os factos não interessam à boa decisão da causa; ou ordenando a notificação da parte contrária para responder em 10 dias, observando-se, quanto à resposta, o disposto no artigo anterior.\n5 - As provas são oferecidas com o articulado e com a resposta.\n6 - Os factos articulados que interessem à decisão da causa constituem tema da prova nos termos do disposto no artigo 596.º.",
            question: "Uma parte tem conhecimento de um facto relevante para a causa após a audiência prévia. Em que momento deve apresentar o articulado superveniente?",
            options: ["A qualquer momento, até ao trânsito em julgado.", "Na própria audiência final.", "Nos 10 dias posteriores à notificação da data designada para a audiência final.", "Apenas se a parte contrária concordar."],
            correctAnswerIndex: 2,
            explanation: "De acordo com a alínea b) do n.º 3 do Artigo 588.º, se não houver audiência prévia ou os factos forem conhecidos após esta, o articulado superveniente deve ser oferecido nos 10 dias posteriores à notificação da data da audiência final."
        },
        // ... all 24 of your questions go here ...
        {
            id: 34, code: "Código de Processo Civil", articleNumber: "Artigo 7.º", articleTitle: "Princípio da cooperação",
            articleText: "1 - Na condução e intervenção no processo, devem os magistrados, os mandatários judiciais e as próprias partes cooperar entre si, concorrendo para se obter, com brevidade e eficácia, a justa composição do litígio.\n2 - O juiz pode, em qualquer altura do processo, ouvir as partes, seus representantes ou mandatários judiciais, convidando-os a fornecer os esclarecimentos sobre a matéria de facto ou de direito que se afigurem pertinentes e dando-se conhecimento à outra parte dos resultados da diligência.\n3 - As pessoas referidas no número anterior são obrigadas a comparecer sempre que para isso forem notificadas e a prestar os esclarecimentos que lhes forem pedidos, sem prejuízo do disposto no n.º 3 do artigo 417.°.\n4 - Sempre que alguma das partes alegue justificadamente dificuldade séria em obter documento ou informação que condicione o eficaz exercício de faculdade ou o cumprimento de ónus ou dever processual, deve o juiz, sempre que possível, providenciar pela remoção do obstáculo.",
            question: "O princípio da cooperação, previsto no Artigo 7.º, impõe deveres a quem?",
            options: ["Apenas ao juiz.", "Apenas às partes e aos seus mandatários.", "Aos magistrados, aos mandatários judiciais e às próprias partes.", "Apenas às testemunhas e peritos."],
            correctAnswerIndex: 2,
            explanation: "O Artigo 7.º, n.º 1, é claro ao estabelecer que o dever de cooperação é recíproco e abrange todos os intervenientes processuais: magistrados (juiz e Ministério Público), mandatários judiciais e as próprias partes, todos devendo concorrer para a justa e célere composição do litígio."
        }
    ];
    res.json(articlesData);
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

