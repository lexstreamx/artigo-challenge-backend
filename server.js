const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION CHECK ---
const FRONTEND_URL = process.env.FRONTEND_URL;
const LEARNWORLDS_SCHOOL_URL = process.env.LEARNWORLDS_SCHOOL_URL;
const LEARNWORLDS_CLIENT_ID = process.env.LEARNWORLDS_CLIENT_ID;

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

// --- DATABASE OF QUIZ QUESTIONS ---
const allQuestions = [
    // --- Processo Civil (31 Questions) ---
    { id: 1, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 186.º", articleTitle: "Ineptidão da petição inicial", articleText: "1 - É nulo todo o processo quando for inepta a petição inicial.\n2 - Diz-se inepta a petição:\na) Quando falte ou seja ininteligível a indicação do pedido ou da causa de pedir;\nb) Quando o pedido esteja em contradição com a causa de pedir;\nc) Quando se cumulem causas de pedir ou pedidos substancialmente incompatíveis.", question: "Quando é que a petição inicial é considerada inepta?", options: ["Apenas quando falta a indicação do pedido.", "Quando falta ou é ininteligível o pedido ou a causa de pedir, há contradição entre eles, ou cumulação de pedidos/causas de pedir incompatíveis.", "Sempre que o valor da causa não é indicado corretamente.", "Quando não são juntas todas as provas documentais."], correctAnswerIndex: 1, explanation: "O Art. 186.º, n.º 2, elenca as três situações que levam à ineptidão da petição inicial, todas relacionadas com a clareza e coerência do pedido e da causa de pedir, que são elementos essenciais da petição." },
    { id: 2, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 574.º", articleTitle: "Ónus de impugnação", articleText: "1 - Ao contestar, deve o réu tomar posição definida perante os factos que constituem a causa de pedir invocada pelo autor.\n2 - Consideram-se admitidos por acordo os factos que não forem impugnados, salvo se estiverem em oposição com a defesa considerada no seu conjunto, se não for admissível confissão sobre eles ou se só puderem ser provados por documento escrito; a admissão de factos instrumentais pode ser afastada por prova posterior.", question: "O que acontece se o réu, na contestação, não se pronunciar sobre um facto alegado pelo autor?", options: ["O facto é considerado irrelevante.", "O juiz deve convidar o réu a completar a contestação.", "O facto considera-se admitido por acordo, salvo exceções.", "O processo é anulado por falta de contestação."], correctAnswerIndex: 2, explanation: "O Art. 574.º, n.º 2, consagra o ónus de impugnação especificada. A falta de impugnação de um facto alegado pelo autor leva, em regra, à sua admissão por acordo, dispensando a necessidade de prova sobre esse mesmo facto." },
    { id: 3, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 266.º", articleTitle: "Admissibilidade da reconvenção", articleText: "1 - O réu pode, em reconvenção, deduzir pedidos contra o autor.\n2 - A reconvenção é admissível nos seguintes casos:\na) Quando o pedido do réu emerja do facto jurídico que serve de fundamento à ação ou à defesa;\nb) Quando o réu se proponha tornar efetivo o direito a benfeitorias ou despesas relativas à coisa cuja entrega lhe é pedida;\nc) Quando o réu pretenda o reconhecimento de um crédito, seja para obter a compensação seja para obter o pagamento do valor em que o crédito invocado excede o do autor;\nd) Quando o pedido do réu tenda a conseguir, em seu benefício, o mesmo efeito jurídico que o autor se propõe obter.", question: "Qual das seguintes situações NÃO permite a dedução de um pedido reconvencional?", options: ["O réu pede o pagamento de benfeitorias feitas numa casa cuja entrega o autor pede.", "O réu pede o reconhecimento de um crédito para o compensar com o crédito do autor.", "O réu deduz um pedido completamente independente do facto que fundamenta a ação.", "O pedido do réu emerge do mesmo contrato que o autor invoca na sua petição inicial."], correctAnswerIndex: 2, explanation: "O Art. 266.º estabelece os requisitos de conexão entre o pedido principal e o pedido reconvencional. Um pedido que não tenha qualquer ligação com o facto jurídico que serve de base à ação ou à defesa não é admissível." },
    { id: 4, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 591.º", articleTitle: "Finalidades da audiência prévia", articleText: "1 - A audiência prévia destina-se a:\na) Realizar tentativa de conciliação;\nb) Facultar às partes a discussão de facto e de direito, nos casos em que ao juiz cumpra apreciar exceções dilatórias ou quando tencione conhecer imediatamente, no todo ou em parte, do mérito da causa;\nc) Discutir as posições das partes, com vista à delimitação dos termos do litígio, e suprir as insuficiências ou imprecisões na exposição da matéria de facto que ainda subsistam ou se tornem patentes na sequência do debate;\nd) Proferir despacho saneador;\ne) Determinar, após debate, a adequação formal, a simplificação ou a agilização do processo;\nf) Proferir, após debate, o despacho previsto no n.º 1 do artigo 596.º e fixar o calendário da audiência;\ng) Proferir despacho de programação da audiência final.", question: "Qual das seguintes NÃO é uma finalidade da audiência prévia?", options: ["Realizar a inquirição das testemunhas.", "Tentar a conciliação entre as partes.", "Proferir o despacho saneador.", "Delimitar os termos do litígio."], correctAnswerIndex: 0, explanation: "A audiência prévia, conforme o Art. 591.º, tem múltiplas finalidades de gestão e saneamento do processo. No entanto, a produção de prova, como a inquirição de testemunhas, é reservada para a audiência final." },
    { id: 5, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 604.º", articleTitle: "Sequência da audiência final", articleText: "1 - A audiência principia pela produção das provas que tenham sido requeridas e admitidas...\n2 - Finda a produção de prova, pode cada um dos advogados fazer uma alegação oral...\n3 - A discussão da matéria de facto e de direito é feita segundo a ordem seguinte:\na) Nas ações de simples apreciação ou de condenação, primeiro o advogado do autor e depois o do réu;\nb) Nas ações de mera apreciação negativa, primeiro o advogado do réu e depois o do autor;\nc) Havendo reconvenção, primeiro o advogado do réu, que começa por expor os fundamentos de facto e de direito do pedido reconvencional, depois o do autor...", question: "Numa ação em que o réu deduziu reconvenção, quem é o primeiro advogado a fazer as alegações orais?", options: ["O advogado do autor, sempre.", "O advogado do réu.", "O juiz decide no momento.", "Ambos falam ao mesmo tempo."], correctAnswerIndex: 1, explanation: "O Art. 604.º, n.º 3, alínea c), estabelece uma regra especial para os casos de reconvenção, determinando que o advogado do réu é o primeiro a alegar, começando pela defesa do seu pedido reconvencional, seguido pelo advogado do autor." },
    { id: 6, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 615.º", articleTitle: "Nulidades da sentença", articleText: "1 - É nula a sentença quando:\na) Não contenha a assinatura do juiz;\nb) Não especifique os fundamentos de facto e de direito que justificam a decisão;\nc) Os fundamentos estejam em oposição com a decisão ou ocorra alguma ambiguidade ou obscuridade que torne a decisão ininteligível;\nd) O juiz deixe de pronunciar-se sobre questões que devesse apreciar ou conheça de questões de que não podia tomar conhecimento;\ne) O juiz condene em quantidade superior ou em objeto diverso do pedido.", question: "Um juiz condena o réu a pagar 15.000€, quando o autor apenas tinha pedido 10.000€. A sentença padece de que vício?", options: ["Erro de julgamento, passível de recurso.", "Nulidade por excesso de pronúncia.", "Mera irregularidade, sanável a todo o tempo.", "Inexistência jurídica."], correctAnswerIndex: 1, explanation: "De acordo com o Art. 615.º, n.º 1, alínea e), a sentença é nula quando o juiz condena em quantidade superior ou em objeto diverso do pedido. Esta é a nulidade conhecida como excesso de pronúncia." },
    { id: 7, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 588.º", articleTitle: "Termos em que são admitidos", articleText: "1 - Os factos constitutivos, modificativos ou extintivos do direito que forem supervenientes podem ser deduzidos em articulado posterior ou em novo articulado, pela parte a quem aproveitem, até ao encerramento da discussão.\n2 - Dizem-se supervenientes tanto os factos ocorridos posteriormente ao termo dos prazos marcados nos artigos precedentes como os factos anteriores de que a parte só tenha conhecimento depois de findarem esses prazos, devendo neste caso produzir-se prova da superveniência.", question: "Uma parte tem conhecimento de um facto relevante para a causa após a audiência prévia. Em que momento deve apresentar o articulado superveniente?", options: ["A qualquer momento, até ao trânsito em julgado.", "Na própria audiência final.", "Nos 10 dias posteriores à notificação da data designada para a audiência final.", "Apenas se a parte contrária concordar."], correctAnswerIndex: 2, explanation: "De acordo com a alínea b) do n.º 3 do Artigo 588.º, se não houver audiência prévia ou os factos forem conhecidos após esta, o articulado superveniente deve ser oferecido nos 10 dias posteriores à notificação da data da audiência final." },
    { id: 8, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 590.º", articleTitle: "Gestão inicial do processo", articleText: "4 - Incumbe ainda ao juiz convidar as partes ao suprimento das insuficiências ou imprecisões na exposição ou concretização da matéria de facto alegada, fixando prazo para a apresentação de articulado em que se complete ou corrija o inicialmente produzido.", question: "Após a fase dos articulados, o juiz verifica que a exposição da matéria de facto pelo autor é imprecisa. O que deve fazer?", options: ["Indeferir liminarmente a petição.", "Convidar o autor a aperfeiçoar o articulado, fixando um prazo para o efeito.", "Absolver o réu da instância por ineptidão da petição.", "Marcar imediatamente a audiência final."], correctAnswerIndex: 1, explanation: "O Art. 590.º, n.º 4, consagra o dever de gestão processual, impondo ao juiz que convide as partes a suprir insuficiências ou imprecisões na exposição da matéria de facto, promovendo o aproveitamento dos atos processuais." },
    { id: 9, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 245.º", articleTitle: "Dilação", articleText: "1 - Ao prazo de defesa do citando acresce uma dilação de cinco dias quando:\na) A citação tenha sido realizada em pessoa diversa do réu...\n2 - Quando o réu haja sido citado para a causa no território das Regiões Autónomas, correndo a ação no continente ou em outra ilha, ou vice-versa, a dilação é de 15 dias.\n5 - A dilação resultante do disposto na alínea a) do n.º 1 acresce à que eventualmente resulte do estabelecido na alínea b) e nos n.os 2 e 3.", question: "Numa ação que corre em Lisboa, o réu é citado na Madeira, na pessoa da sua mãe. Qual a dilação total aplicável?", options: ["15 dias.", "5 dias.", "20 dias.", "Não há dilação."], correctAnswerIndex: 2, explanation: "Nos termos do Art. 245.º, n.º 2, a citação nas Regiões Autónomas para uma ação no continente confere uma dilação de 15 dias. Adicionalmente, o n.º 1, alínea a) e o n.º 5 estipulam que a citação em pessoa diversa do réu acrescenta uma dilação de 5 dias. As dilações são cumuláveis (15 + 5), resultando num total de 20 dias." },
    { id: 10, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 366.º", articleTitle: "Contraditório do requerido", articleText: "3 - A dilação, quando a ela haja lugar nos termos do artigo 245.º, nunca pode exceder a duração de 10 dias.", question: "No âmbito de um procedimento cautelar, um requerido foi citado numa ilha das Regiões Autónomas, sendo a ação intentada em Lisboa. Qual é o prazo de dilação aplicável?", options: ["30 dias, por ser o prazo máximo.", "15 dias, conforme a regra geral do Art. 245.º, n.º 2.", "10 dias, por ser o limite máximo de dilação em procedimentos cautelares.", "Não há lugar a dilação em procedimentos cautelares."], correctAnswerIndex: 2, explanation: "A regra geral do Art. 245.º, n.º 2, prevê uma dilação de 15 dias. Contudo, o Art. 366.º, n.º 3, estabelece uma regra especial para os procedimentos cautelares, que, pela sua natureza urgente, limitam qualquer dilação a um máximo de 10 dias." },
    { id: 11, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 149.º", articleTitle: "Regra geral sobre o prazo", articleText: "1 - Na falta de disposição especial, é de 10 dias o prazo para as partes requererem qualquer ato ou diligência... e também é de 10 dias o prazo para a parte responder ao que for deduzido pela parte contrária.", question: "A lei não prevê um prazo específico para uma parte responder a um requerimento da parte contrária. Qual é o prazo aplicável?", options: ["5 dias.", "30 dias, como na contestação.", "10 dias.", "O juiz fixa o prazo que entender."], correctAnswerIndex: 2, explanation: "O Art. 149.º, n.º 1, estabelece o prazo supletivo geral de 10 dias para a prática de atos processuais pelas partes para os quais a lei não preveja um prazo específico, incluindo a resposta a requerimentos." },
    { id: 12, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 33.º", articleTitle: "Litisconsórcio necessário", articleText: "1 - Se, porém, a lei ou o negócio exigir a intervenção dos vários interessados na relação controvertida, a falta de qualquer deles é motivo de ilegitimidade.", question: "Numa ação de preferência, o autor propõe a ação apenas contra o vendedor, omitindo o comprador. Qual a consequência processual?", options: ["O processo prossegue normalmente.", "O juiz deve suprir oficiosamente a falta do comprador.", "Verifica-se uma exceção dilatória de ilegitimidade por preterição de litisconsórcio necessário.", "A ação é imediatamente julgada improcedente."], correctAnswerIndex: 2, explanation: "A ação de preferência exige, por lei, a intervenção do vendedor e do comprador. A falta de qualquer um deles constitui uma situação de litisconsórcio necessário legal (Art. 33.º, n.º 1), cuja preterição resulta na exceção dilatória de ilegitimidade (Art. 577.º, al. e))." },
    { id: 13, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 37.º", articleTitle: "Obstáculos à coligação", articleText: "1 - A coligação não é admissível quando aos pedidos correspondam formas de processo diferentes ou a cumulação possa ofender regras de competência internacional ou em razão da matéria ou da hierarquia.", question: "Qual das seguintes situações constitui um obstáculo legal à coligação de réus numa ação?", options: ["Quando os pedidos têm causas de pedir diferentes.", "Quando a cumulação de pedidos ofende as regras de competência em razão da matéria.", "Quando um dos réus tem domicílio numa comarca diferente.", "Quando o valor total dos pedidos é superior à alçada da Relação."], correctAnswerIndex: 1, explanation: "O Art. 37.º, n.º 1, estabelece que a coligação não é admissível se a cumulação ofender regras de competência internacional, em razão da matéria ou da hierarquia. A ofensa à competência material é, portanto, um obstáculo direto." },
    { id: 14, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 40.º", articleTitle: "Constituição obrigatória de advogado", articleText: "1 - É obrigatória a constituição de advogado:\na) Nas causas de competência de tribunais com alçada, em que seja admissível recurso ordinário...", question: "Em que situação é obrigatória a constituição de advogado?", options: ["Em todas as ações cíveis, sem exceção.", "Apenas em ações de valor superior a 30.000 €.", "Nas causas de valor superior a 5.000 €, uma vez que são as causas em que é admissível recurso ordinário.", "Apenas nos recursos para o Supremo Tribunal de Justiça."], correctAnswerIndex: 2, explanation: "Conforme o Art. 40.º, n.º 1, alínea a), a constituição de advogado é obrigatória nas causas de valor superior à alçada do tribunal de 1.ª instância (5.000 €), pois é nessas que é admissível recurso ordinário." },
    { id: 15, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 41.º", articleTitle: "Falta de constituição de advogado", articleText: "Se a parte não constituir advogado, sendo obrigatória a constituição, o juiz... determina a sua notificação para o constituir dentro de prazo certo, sob pena de... ficar sem efeito a defesa.", question: "Numa ação em que é obrigatória a constituição de advogado, o réu contesta sem estar representado. Qual o procedimento correto do juiz?", options: ["Rejeitar liminarmente a contestação.", "Considerar o réu em situação de revelia.", "Notificar o réu para constituir advogado em prazo certo, sob pena de a sua defesa ficar sem efeito.", "Absolver imediatamente o réu da instância."], correctAnswerIndex: 2, explanation: "O Art. 41.º estabelece o procedimento de sanação. O juiz não deve rejeitar imediatamente o ato, mas sim notificar a parte para suprir a falta, e só se tal não for feito no prazo fixado é que a cominação se aplica." },
    { id: 16, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 96.º", articleTitle: "Casos de incompetência absoluta", articleText: "Determinam a incompetência absoluta do tribunal:\na) A infração das regras de competência em razão da matéria e da hierarquia...", question: "Uma ação sobre uma matéria da competência exclusiva dos tribunais administrativos é proposta num tribunal judicial. De que tipo de vício padece o processo?", options: ["Incompetência relativa.", "Nulidade processual sanável.", "Incompetência absoluta, de conhecimento oficioso.", "Erro na forma do processo."], correctAnswerIndex: 2, explanation: "De acordo com o Art. 96.º, alínea a), a infração das regras de competência em razão da matéria determina a incompetência absoluta do tribunal, que é uma exceção dilatória de conhecimento oficioso." },
    { id: 17, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 102.º", articleTitle: "Em que casos se verifica", articleText: "A infração das regras de competência fundadas... na divisão judicial do território... determina a incompetência relativa do tribunal.", question: "Um autor propõe uma ação no tribunal do seu domicílio, quando a regra geral determinava a competência do tribunal do domicílio do réu. Qual a consequência?", options: ["O tribunal deve conhecer oficiosamente da incompetência.", "Trata-se de uma incompetência relativa, que tem de ser arguida pelo réu na contestação.", "A ação é nula.", "O processo prossegue, pois a competência territorial é irrelevante."], correctAnswerIndex: 1, explanation: "A violação das regras de competência territorial, salvo nos casos de conhecimento oficioso, constitui uma incompetência relativa (Art. 102.º). Esta exceção deve ser arguida pelo réu (Art. 103.º), sob pena de se considerar sanada." },
    { id: 18, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 281.º", articleTitle: "Deserção da instância e dos recursos", articleText: "1 - ...considera-se deserta a instância quando, por negligência das partes, o processo se encontre a aguardar impulso processual há mais de seis meses.", question: "Um processo declarativo está parado há sete meses, aguardando que o autor junte um documento. O que acontece à instância?", options: ["A instância suspende-se.", "O réu é absolvido do pedido.", "A instância extingue-se por deserção, a ser declarada por despacho judicial.", "O juiz deve notificar novamente o autor."], correctAnswerIndex: 2, explanation: "O Art. 281.º, n.º 1, estabelece que a instância se considera deserta, e consequentemente extingue-se (Art. 277.º, al. c)), quando o processo fica parado por mais de seis meses por negligência das partes." },
    { id: 19, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 373.º", articleTitle: "Caducidade da providência", articleText: "1 - ...o procedimento cautelar extingue-se e, quando decretada, a providência caduca:\na) Se o requerente não propuser a ação da qual a providência depende dentro de 30 dias...", question: "Foi decretada uma providência cautelar. O requerente não propôs a ação principal no prazo legal. Qual a consequência?", options: ["A providência mantém-se.", "O requerido tem de pedir a revogação.", "A providência caduca, pois a ação principal não foi proposta no prazo de 30 dias.", "O requerente é condenado numa multa."], correctAnswerIndex: 2, explanation: "O Art. 373.º, n.º 1, alínea a), determina a caducidade da providência se o requerente não instaurar a ação principal no prazo de 30 dias. A providência é instrumental e dependente da ação principal." },
    { id: 20, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 369.º", articleTitle: "Inversão do contencioso", articleText: "1 - ...o juiz, na decisão que decrete a providência, pode dispensar o requerente do ónus de propositura da ação principal se a matéria adquirida no procedimento lhe permitir formar convicção segura acerca da existência do direito acautelado...", question: "Para que o juiz possa decretar a inversão do contencioso, que requisito deve estar preenchido?", options: ["O valor da causa ser superior à alçada da Relação.", "O requerido concordar com a inversão.", "A matéria adquirida no procedimento permitir ao juiz formar uma convicção segura sobre a existência do direito.", "A providência ter sido requerida como incidente."], correctAnswerIndex: 2, explanation: "O Art. 369.º, n.º 1, estabelece como requisito fundamental para a inversão do contencioso que a prova produzida no procedimento cautelar seja tão robusta que permita ao juiz formar uma 'convicção segura' sobre o direito." },
    { id: 21, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 423.º", articleTitle: "Momento da apresentação", articleText: "2 - Se não forem juntos com o articulado respetivo, os documentos podem ser apresentados até 20 dias antes da data em que se realize a audiência final, mas a parte é condenada em multa...", question: "Uma parte esqueceu-se de juntar um documento com a petição inicial. Qual o prazo limite para o fazer, ainda que sujeito a multa?", options: ["Até ao encerramento da audiência final.", "No prazo de 10 dias após a petição.", "Até 20 dias antes da data em que se realize a audiência final.", "Apenas na audiência prévia."], correctAnswerIndex: 2, explanation: "O Art. 423.º, n.º 2, estabelece um prazo limite de 20 dias antes da audiência final para a apresentação tardia de documentos, mediante o pagamento de multa." },
    { id: 22, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 452.º", articleTitle: "Depoimento de parte", articleText: "1 - O juiz pode, em qualquer estado do processo, determinar a comparência pessoal das partes para a prestação de depoimento...", question: "O principal objetivo do depoimento de parte requerido pela parte contrária é:", options: ["Substituir a prova testemunhal.", "Provocar a confissão da parte depoente.", "Permitir que a parte apresente a sua versão dos factos.", "Aclarar a matéria de direito."], correctAnswerIndex: 1, explanation: "O depoimento de parte, quando requerido pela parte contrária, destina-se a obter a confissão judicial sobre factos desfavoráveis ao depoente, sendo essa a sua finalidade primordial." },
    { id: 23, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 466.º", articleTitle: "Declarações de parte", articleText: "1 - As partes podem requerer... a prestação de declarações sobre factos em que tenham intervindo pessoalmente...", question: "Qual a principal diferença entre o depoimento de parte e as declarações de parte?", options: ["As declarações de parte não são gravadas.", "O depoimento de parte só pode ser requerido pelo juiz.", "A iniciativa das declarações de parte é da própria parte, enquanto o depoimento é requerido pela parte contrária ou pelo juiz.", "Nas declarações de parte não se pode confessar."], correctAnswerIndex: 2, explanation: "A distinção fundamental reside na iniciativa: as declarações de parte são um meio de prova em que a própria parte se oferece para depor (Art. 466.º), enquanto o depoimento de parte visa obter a confissão e é requerido pela parte contrária ou oficiosamente pelo juiz (Art. 452.º)." },
    { id: 24, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 598.º", articleTitle: "Apresentação do rol de testemunhas", articleText: "2 - O rol de testemunhas pode ser alterado ou aditado até 20 dias antes da data em que se realize a audiência final...", question: "Uma parte indicou o seu rol de testemunhas com a contestação. Na audiência prévia, pretende alterar esse rol. É possível?", options: ["Não, o rol de testemunhas é imutável.", "Sim, pode fazê-lo livremente na audiência prévia.", "Sim, mas apenas até 20 dias antes da data da audiência final.", "Apenas com o consentimento da parte contrária."], correctAnswerIndex: 2, explanation: "O Art. 598.º, n.º 2, permite que o rol de testemunhas seja aditado ou alterado até 20 dias antes da data em que se realize a audiência final." },
    { id: 25, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 629.º", articleTitle: "Decisões que admitem recurso", articleText: "1 - O recurso ordinário só é admissível quando a causa tenha valor superior à alçada do tribunal de que se recorre e a decisão impugnada seja desfavorável ao recorrente em valor superior a metade da alçada desse tribunal...", question: "Numa ação com o valor de 4.000 €, o réu foi condenado a pagar 3.000 €. Pode recorrer da decisão?", options: ["Sim, porque a sucumbência é superior a metade da alçada.", "Não, porque o valor da causa é inferior à alçada do tribunal de 1.ª instância (5.000 €).", "Sim, todas as sentenças são recorríveis.", "Não, porque a sucumbência é inferior à alçada."], correctAnswerIndex: 1, explanation: "O Art. 629.º, n.º 1, estabelece uma dupla condição para a recorribilidade: o valor da causa tem de ser superior à alçada do tribunal E a sucumbência tem de ser superior a metade dessa alçada. Neste caso, o valor da causa (4.000 €) é inferior à alçada da 1.ª instância (5.000 €), pelo que o recurso não é admissível." },
    { id: 26, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 638.º", articleTitle: "Prazos", articleText: "1 - O prazo para a interposição do recurso é de 30 dias e conta-se a partir da notificação da decisão...", question: "Qual o prazo geral para a interposição de um recurso de apelação num processo comum?", options: ["15 dias.", "30 dias.", "10 dias.", "20 dias."], correctAnswerIndex: 1, explanation: "Conforme o Art. 638.º, n.º 1, o prazo geral para interposição de recurso é de 30 dias. O prazo de 15 dias é aplicável apenas a processos urgentes e outras situações especificadas." },
    { id: 27, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 671.º", articleTitle: "Decisões que comportam revista", articleText: "3 - ...não é admitida revista do acórdão da Relação que confirme, sem voto de vencido e sem fundamentação essencialmente diferente, a decisão proferida na 1.ª instância...", question: "O Tribunal da Relação confirma, sem voto de vencido e com fundamentação idêntica, uma decisão da 1.ª instância. Em que situação, por regra, NÃO é admissível recurso de revista?", options: ["Quando o valor da causa é superior a 30.000 €.", "Quando existe 'dupla conforme', nos termos do n.º 3 do Art. 671.º.", "Quando a decisão da 1.ª instância foi unânime.", "Quando o recurso de apelação teve efeito meramente devolutivo."], correctAnswerIndex: 1, explanation: "O Art. 671.º, n.º 3, consagra a regra da 'dupla conforme', que limita o acesso ao Supremo Tribunal de Justiça quando há duas decisões conformes das instâncias inferiores." },
    { id: 28, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 696.º", articleTitle: "Fundamentos do recurso", articleText: "A decisão transitada em julgado só pode ser objeto de revisão quando:\nc) Se apresente documento de que a parte não tivesse conhecimento, ou de que não tivesse podido fazer uso... e que, por si só, seja suficiente para modificar a decisão...", question: "Qual das seguintes situações constitui fundamento para um recurso extraordinário de revisão?", options: ["A errada interpretação de uma norma jurídica.", "A descoberta de um novo acórdão em sentido contrário.", "A apresentação de um documento decisivo de que a parte não pôde fazer uso no processo.", "A discordância com a apreciação da prova."], correctAnswerIndex: 2, explanation: "O Art. 696.º, alínea c), prevê expressamente como fundamento de revisão a apresentação de um documento superveniente que seja, por si só, suficiente para modificar a decisão. Os outros são fundamentos de recurso ordinário." },
    { id: 29, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 265.º", articleTitle: "Alteração do pedido e da causa de pedir", articleText: "2 - O autor pode, em qualquer altura, reduzir o pedido e pode ampliá-lo até ao encerramento da discussão em 1.ª instância se a ampliação for o desenvolvimento ou a consequência do pedido primitivo.", question: "Na falta de acordo com o réu, em que circunstância pode o autor ampliar o pedido?", options: ["A qualquer momento e sem qualquer limite.", "Apenas na petição inicial.", "Até ao encerramento da discussão em 1ª instância, se a ampliação for um desenvolvimento do pedido inicial.", "Nunca, pois o pedido é imutável."], correctAnswerIndex: 2, explanation: "O Artigo 265.º, n.º 2, flexibiliza o princípio da estabilidade da instância, permitindo a ampliação do pedido sem acordo, desde que ocorra até ao encerramento da discussão e seja uma consequência lógica do pedido primitivo." },
    { id: 30, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 139.º", articleTitle: "Modalidades do prazo", articleText: "5 - Independentemente de justo impedimento, pode o ato ser praticado dentro dos três primeiros dias úteis subsequentes ao termo do prazo, ficando a sua validade dependente do pagamento imediato de uma multa...", question: "O prazo para a prática de um ato judicial termina numa sexta-feira. Até quando pode a parte praticar o ato, pagando a multa?", options: ["Até à segunda-feira seguinte.", "Até à terça-feira seguinte.", "Até à quarta-feira seguinte.", "O prazo é perentório e não pode ser ultrapassado."], correctAnswerIndex: 2, explanation: "O Artigo 139.º, n.º 5, permite a prática do ato nos três dias úteis subsequentes ao termo do prazo. Se o prazo terminou na sexta-feira, os três dias úteis seguintes são segunda, terça e quarta-feira." },
    { id: 31, discipline: "Processo Civil", code: "Código de Processo Civil", articleNumber: "Artigo 7.º", articleTitle: "Princípio da cooperação", articleText: "1 - Na condução e intervenção no processo, devem os magistrados, os mandatários judiciais e as próprias partes cooperar entre si, concorrendo para se obter, com brevidade e eficácia, a justa composição do litígio.", question: "O princípio da cooperação impõe deveres a quem?", options: ["Apenas ao juiz.", "Apenas às partes e aos seus mandatários.", "Aos magistrados, aos mandatários judiciais e às próprias partes.", "Apenas às testemunhas e peritos."], correctAnswerIndex: 2, explanation: "O Artigo 7.º, n.º 1, é claro ao estabelecer que o dever de cooperação é recíproco e abrange todos os intervenientes processuais: magistrados, mandatários e as próprias partes." },
    
    // --- Processo Penal (31 Questions) ---
    { id: 32, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 246.º", articleTitle: "Prazo e formalidades da queixa", articleText: "1 - O direito de queixa extingue-se no prazo de seis meses a contar da data em que o titular tiver tido conhecimento do facto e dos seus autores...", question: "Qual o prazo para a apresentação de queixa por um crime semi-público?", options: ["3 meses a contar do facto.", "6 meses a contar do conhecimento do facto e dos seus autores.", "1 ano a contar do facto.", "Não existe prazo."], correctAnswerIndex: 1, explanation: "O Art. 246.º, n.º 1, do CPP estabelece o prazo de caducidade de 6 meses para o exercício do direito de queixa, contando-se a partir do momento em que o ofendido tem conhecimento do facto e de quem o praticou." },
    { id: 33, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 68.º", articleTitle: "Quem pode ser assistente", articleText: "1 - Podem constituir-se assistentes no processo penal, além das pessoas e entidades a quem leis especiais conferirem esse direito:\na) Os ofendidos, considerando-se como tais os titulares dos interesses que a lei especialmente quis proteger com a incriminação...", question: "Quem tem, em regra, legitimidade para se constituir assistente num processo penal?", options: ["Qualquer cidadão.", "Apenas o Ministério Público.", "O ofendido, ou seja, o titular do interesse protegido pela norma incriminadora.", "Apenas o arguido."], correctAnswerIndex: 2, explanation: "Conforme o Art. 68.º, n.º 1, al. a), a qualidade de assistente é, por regra, conferida ao ofendido, que é a pessoa diretamente afetada pela prática do crime, por ser o titular do bem jurídico violado." },
    { id: 34, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 283.º", articleTitle: "Acusação pelo Ministério Público", articleText: "1 - Se durante o inquérito tiverem sido recolhidos indícios suficientes de se ter verificado crime e de quem foi o seu agente, o Ministério Público deduz acusação contra aquele.", question: "Em que momento do processo o Ministério Público deduz acusação?", options: ["No início do inquérito.", "A qualquer momento, quando entender.", "No final do inquérito, se tiver recolhido indícios suficientes.", "Apenas após a fase de instrução."], correctAnswerIndex: 2, explanation: "A acusação é o ato que encerra o inquérito, sendo deduzida pelo Ministério Público apenas quando, no final desta fase, se reúnem indícios suficientes da prática de um crime por um determinado agente, conforme o Art. 283.º, n.º 1." },
    { id: 35, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 287.º", articleTitle: "Requerimento para abertura de instrução", articleText: "1 - A abertura de instrução pode ser requerida, no prazo de 20 dias a contar da notificação da acusação ou do arquivamento:\na) Pelo arguido, relativamente a factos pelos quais o Ministério Público ou o assistente... tiver deduzido acusação;\nb) Pelo assistente... relativamente a factos pelos quais o Ministério Público não tiver deduzido acusação.", question: "Quem pode requerer a abertura da instrução?", options: ["Apenas o Ministério Público.", "O arguido ou o assistente.", "Qualquer testemunha.", "Apenas o juiz, oficiosamente."], correctAnswerIndex: 1, explanation: "A instrução é uma fase facultativa que visa a comprovação judicial da decisão de acusar ou arquivar. A legitimidade para a requerer pertence ao arguido (para contestar a acusação) e ao assistente (para contestar o arquivamento), nos termos do Art. 287.º, n.º 1." },
    { id: 36, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 308.º", articleTitle: "Despacho de pronúncia e de não pronúncia", articleText: "1 - Se, até ao encerramento da instrução, tiverem sido recolhidos indícios suficientes de se terem verificado os pressupostos de que depende a aplicação ao arguido de uma pena ou de uma medida de segurança, o juiz profere despacho de pronúncia...", question: "No final da instrução, se o juiz considerar que existem indícios suficientes, que decisão profere?", options: ["Sentença condenatória.", "Despacho de arquivamento.", "Despacho de pronúncia.", "Acusação formal."], correctAnswerIndex: 2, explanation: "A decisão instrutória, proferida pelo juiz de instrução no final desta fase, pode ser de pronúncia (se houver indícios suficientes para levar o arguido a julgamento) ou de não pronúncia (caso contrário), conforme o Art. 308.º." },
    { id: 37, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 379.º", articleTitle: "Nulidades da sentença", articleText: "1 - É nula a sentença:\nb) Que condenar por factos diversos dos descritos na acusação ou na pronúncia...", question: "Um tribunal condena um arguido por um crime de furto, quando a acusação era por um crime de roubo. A sentença é:", options: ["Válida, mas pode ser objeto de recurso.", "Anulável, se o arguido arguir o vício.", "Nula, por condenação por factos diversos dos da acusação.", "Mera irregularidade."], correctAnswerIndex: 2, explanation: "O Art. 379.º, n.º 1, al. b), sanciona com a nulidade a violação do princípio da vinculação temática, que impede o tribunal de condenar por factos diferentes daqueles que constam da acusação ou da pronúncia." },
    { id: 38, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 386.º", articleTitle: "Tramitação", articleText: "1 - O processo sumário aplica-se nos casos de detenção em flagrante delito por crime punível com pena de prisão cujo limite máximo não seja superior a 5 anos...", question: "Qual o principal requisito para a aplicação da forma de processo sumário?", options: ["O arguido confessar os factos.", "A detenção em flagrante delito.", "O crime ser punível com pena de multa.", "A concordância do Ministério Público e do arguido."], correctAnswerIndex: 1, explanation: "O pressuposto fundamental para a aplicação do processo sumário é a detenção em flagrante delito, conforme estipula o Art. 386.º, n.º 1, aliada a uma moldura penal não superior a 5 anos de prisão." },
    { id: 39, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 126.º", articleTitle: "Métodos proibidos de prova", articleText: "1 - São nulas, não podendo ser utilizadas, as provas obtidas mediante tortura, coação ou, em geral, ofensa da integridade física ou moral das pessoas.", question: "Uma confissão obtida através de ameaças ao arguido pode ser utilizada como prova?", options: ["Sim, se for confirmada por outras provas.", "Não, porque se trata de uma prova nula, obtida por método proibido.", "Sim, mas o seu valor probatório é reduzido.", "Depende da gravidade das ameaças."], correctAnswerIndex: 1, explanation: "O Art. 126.º, n.º 1, é taxativo ao proibir a utilização de provas obtidas por coação. A nulidade é a consequência da violação desta norma fundamental, tornando a prova inutilizável no processo." },
    { id: 40, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 127.º", articleTitle: "Livre apreciação da prova", articleText: "Salvo quando a lei dispuser diferentemente, a prova é apreciada segundo as regras da experiência e a livre convicção da entidade competente.", question: "Qual o princípio geral que rege a valoração da prova em processo penal?", options: ["Princípio da prova legal ou tarifada.", "Princípio da livre apreciação da prova.", "Princípio da convicção íntima do juiz.", "Princípio da prova mais favorável ao arguido."], correctAnswerIndex: 1, explanation: "O Art. 127.º consagra o princípio da livre apreciação da prova, segundo o qual o tribunal valora as provas de acordo com a sua experiência e convicção, sem estar sujeito a regras rígidas de valoração, salvo nos casos excecionais de prova legal." },
    { id: 41, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 196.º", articleTitle: "Termo de identidade e residência", articleText: "1 - A autoridade judiciária ou o órgão de polícia criminal sujeitam a termo de identidade e residência todo aquele que for constituído arguido.", question: "Qual a medida de coação que é obrigatoriamente aplicada a todo o arguido?", options: ["Prisão preventiva.", "Caução.", "Termo de identidade e residência (TIR).", "Obrigação de apresentação periódica."], correctAnswerIndex: 2, explanation: "O Art. 196.º, n.º 1, estabelece que o TIR é a medida de coação base, aplicada a qualquer pessoa constituída arguida. As restantes medidas de coação são aplicadas apenas quando se verificam os respetivos pressupostos." },
    { id: 42, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 202.º", articleTitle: "Pressupostos e condições de aplicação", articleText: "1 - A prisão preventiva e a obrigação de permanência na habitação só podem ser aplicadas quando se verificarem:\na) Fuga ou perigo de fuga;\nb) Perigo de perturbação do decurso do inquérito ou da instrução do processo e, nomeadamente, perigo para a aquisição, conservação ou veracidade da prova;\nou\nc) Perigo, em razão da natureza e das circunstâncias do crime ou da personalidade do arguido, de que este continue a atividade criminosa ou perturbe gravemente a ordem e a tranquilidade públicas.", question: "Qual dos seguintes é um pressuposto para a aplicação da prisão preventiva?", options: ["A confissão do arguido.", "O perigo de fuga ou de perturbação do inquérito.", "A gravidade do crime, por si só.", "A existência de antecedentes criminais."], correctAnswerIndex: 1, explanation: "A prisão preventiva é a medida de coação mais gravosa e só pode ser aplicada se, para além de outros requisitos, se verificar um dos perigos (pericula) elencados no Art. 202.º, n.º 1, como o perigo de fuga." },
    { id: 43, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 399.º", articleTitle: "Recorribilidade", articleText: "É permitido recorrer:\na) De acórdãos, sentenças e despachos cuja irrecorribilidade não estiver prevista na lei;\nb) De despachos que ponham termo ao processo;\nc) De despachos que, após o encerramento do inquérito ou da instrução, não admitirem a constituição de assistente ou de parte civil.", question: "Em regra, as decisões proferidas em processo penal são recorríveis?", options: ["Não, a regra é a irrecorribilidade.", "Sim, a regra é a recorribilidade, salvo nos casos em que a lei prevê a irrecorribilidade.", "Apenas as sentenças condenatórias são recorríveis.", "Apenas as decisões do juiz de instrução."], correctAnswerIndex: 1, explanation: "O Art. 399.º estabelece o princípio da recorribilidade geral das decisões judiciais em processo penal, com as exceções previstas na lei. A regra é, portanto, a de que as decisões são passíveis de recurso." },
    { id: 44, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 410.º", articleTitle: "Fundamentos do recurso", articleText: "2 - Mesmo nos casos em que a lei restrinja a cognição do tribunal de recurso a matéria de direito, o recurso pode ter como fundamentos, desde que o vício resulte do texto da decisão recorrida, por si só ou conjugada com as regras da experiência comum:\na) A insuficiência para a decisão da matéria de facto provada;\nb) A contradição insanável da fundamentação ou entre a fundamentação e a decisão;\nc) Erro notório na apreciação da prova.", question: "Qual dos seguintes vícios, se resultar do texto da decisão, pode ser conhecido pelo tribunal de recurso mesmo que este só conheça de matéria de direito?", options: ["A errada qualificação jurídica dos factos.", "A prescrição do procedimento criminal.", "O erro notório na apreciação da prova.", "A nulidade da citação."], correctAnswerIndex: 2, explanation: "O Art. 410.º, n.º 2, prevê vícios da decisão que, embora relacionados com a matéria de facto, são de conhecimento oficioso e podem ser apreciados mesmo em recursos restritos a matéria de direito, como o erro notório na apreciação da prova." },
    { id: 45, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 432.º", articleTitle: "Decisões de que se pode recorrer para o Supremo Tribunal de Justiça", articleText: "1 - Recorre-se para o Supremo Tribunal de Justiça:\nb) De decisões que não sejam irrecorríveis proferidas pelas relações, em recurso, nos termos do artigo 400.º;\nc) De acórdãos finais proferidos pelo tribunal do júri ou pelo tribunal coletivo que apliquem pena de prisão superior a 5 anos...", question: "De uma decisão do tribunal coletivo que aplica uma pena de 4 anos de prisão, para onde se pode recorrer?", options: ["Para o Supremo Tribunal de Justiça, diretamente.", "Para o Tribunal da Relação.", "Não é possível recorrer.", "Para o Tribunal Constitucional."], correctAnswerIndex: 1, explanation: "O recurso 'per saltum' (direto para o STJ) previsto no Art. 432.º, n.º 1, al. c), só é admissível se a pena de prisão for superior a 5 anos. Sendo a pena inferior, o recurso deve ser interposto para o Tribunal da Relação, nos termos gerais." },
    { id: 46, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 437.º", articleTitle: "Fundamentos", articleText: "1 - A revisão de sentença transitada em julgado é admissível quando:\na) Uma outra sentença transitada em julgado tiver considerado falsos meios de prova que tenham sido determinantes para a decisão;\nb) Uma outra sentença transitada em julgado tiver dado como provado crime da autoria de um juiz ou jurado que tenha intervindo no processo...\nc) Se descobrirem novos factos ou meios de prova que, de per si ou combinados com os que foram apreciados no processo, suscitem graves dúvidas sobre a justiça da condenação.", question: "Qual das seguintes situações pode constituir fundamento para um recurso extraordinário de revisão?", options: ["A discordância com a pena aplicada.", "A descoberta de novos factos que suscitem graves dúvidas sobre a justiça da condenação.", "A alteração da jurisprudência sobre a matéria.", "O arguido ter confessado e depois arrependido-se."], correctAnswerIndex: 1, explanation: "O recurso de revisão visa reagir contra o caso julgado em situações excecionais de injustiça. O Art. 437.º, n.º 1, al. c), prevê como um dos seus fundamentos a descoberta de novos factos ou provas que ponham em causa a decisão condenatória." },
    { id: 47, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 118.º", articleTitle: "Princípio da legalidade", articleText: "1 - A violação ou a inobservância das disposições da lei do processo penal só determina a nulidade do ato quando esta for expressamente cominada na lei.\n2 - Nos casos em que a lei não cominar a nulidade, o ato ilegal é irregular.", question: "Uma violação de uma norma processual penal para a qual a lei não prevê expressamente a sanção de nulidade é considerada:", options: ["Um ato nulo.", "Um ato inexistente.", "Uma irregularidade.", "Um ato anulável."], correctAnswerIndex: 2, explanation: "O Art. 118.º consagra o princípio da legalidade ou da tipicidade em matéria de nulidades. Se a lei não qualificar expressamente um vício como nulidade, este será considerado uma mera irregularidade (n.º 2)." },
    { id: 48, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 119.º", articleTitle: "Nulidades insanáveis", articleText: "São nulidades insanáveis, que devem ser oficiosamente declaradas em qualquer fase do procedimento, além das que como tal forem cominadas em outras disposições legais:\na) A falta do número de juízes ou de jurados que devam constituir o tribunal, bem como a falta de promoção do processo pelo Ministério Público...\nb) A usurpação de funções do juiz de instrução ou do juiz de julgamento;\nc) A ausência do arguido ou do seu defensor, nos casos em que a lei exigir a respetiva presença...", question: "Qual das seguintes situações constitui uma nulidade insanável?", options: ["A falta de notificação de uma testemunha.", "A ausência do defensor do arguido num ato em que a sua presença é obrigatória.", "Um erro na contagem de um prazo.", "A falta de assinatura do juiz num despacho de mero expediente."], correctAnswerIndex: 1, explanation: "O Art. 119.º, al. c), qualifica como nulidade insanável, de conhecimento oficioso e que afeta todo o processo, a ausência do defensor do arguido em atos onde a sua presença é legalmente exigida, por violação do direito de defesa." },
    { id: 49, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 120.º", articleTitle: "Nulidades dependentes de arguição", articleText: "2 - Constituem nulidades dependentes de arguição, além das que forem cominadas noutras disposições legais:\na) O inquérito ou a instrução por entidade incompetente;\nb) A insuficiência do inquérito ou da instrução, por não terem sido praticados atos legalmente obrigatórios...", question: "A insuficiência do inquérito por não se terem realizado diligências de prova essenciais é uma:", options: ["Nulidade insanável.", "Mera irregularidade.", "Nulidade dependente de arguição.", "Causa de extinção do procedimento."], correctAnswerIndex: 2, explanation: "Conforme o Art. 120.º, n.º 2, al. d), a insuficiência do inquérito é uma nulidade sanável, ou seja, dependente de arguição por parte dos interessados (arguido ou assistente) no prazo legal." },
    { id: 50, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 122.º", articleTitle: "Declaração da nulidade", articleText: "1 - As nulidades insanáveis são oficiosamente declaradas em qualquer fase do procedimento.\n2 - As nulidades dependentes de arguição devem ser arguidas:\na) Tratando-se de nulidade de ato a que o interessado assista, antes que o ato termine;\nb) Tratando-se de nulidade da falta de audiência do arguido ou do assistente, no prazo de 10 dias, a contar da data em que qualquer deles tiver sido notificado para ato do processo ou de decisão...\nc) Tratando-se de nulidade respeitante ao inquérito ou à instrução, até ao encerramento do debate instrutório ou, não havendo instrução, nos 5 dias posteriores à notificação do despacho que tiver encerrado o inquérito.", question: "Qual o prazo regra para arguir uma nulidade do inquérito, quando não há instrução?", options: ["A todo o tempo.", "Até à audiência de julgamento.", "Nos 5 dias posteriores à notificação do despacho de encerramento do inquérito.", "No prazo de 20 dias, juntamente com a contestação."], correctAnswerIndex: 2, explanation: "O Art. 122.º, n.º 2, al. c), estabelece o prazo de 5 dias após a notificação do despacho de acusação ou arquivamento para arguir nulidades ocorridas na fase de inquérito, caso não se siga a fase de instrução." },
    { id: 51, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 123.º", articleTitle: "Irregularidades", articleText: "1 - Qualquer ato processual que não obedecer às formalidades que a lei prescreve é irregular quando a irregularidade não for cominada com nulidade.\n2 - A irregularidade é arguida pelos interessados no próprio ato ou, se a ele não assistirem, nos 3 dias seguintes àquele em que tiverem sido notificados para qualquer termo do processo ou intervindo em algum ato nele praticado.", question: "Qual o prazo para arguir uma irregularidade processual cometida num ato ao qual a parte não assistiu?", options: ["No prazo de 10 dias.", "Até ao final da fase em que foi cometida.", "Nos 3 dias seguintes à notificação para qualquer termo do processo.", "A irregularidade não pode ser arguida."], correctAnswerIndex: 2, explanation: "O Art. 123.º, n.º 2, estabelece um prazo curto de 3 dias para a arguição de irregularidades, a contar da data em que a parte teve conhecimento do processo após a prática do ato irregular." },
    { id: 52, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 104.º", articleTitle: "Regras gerais sobre prazos", articleText: "1 - Os atos processuais praticam-se nos dias úteis, às horas de expediente dos serviços de justiça e fora do período de férias judiciais. Correm, porém, durante as férias judiciais os prazos relativos a processos de arguidos presos ou detidos...", question: "Em regra, os prazos processuais penais correm durante as férias judiciais?", options: ["Sim, sempre.", "Não, a regra é a suspensão dos prazos durante as férias judiciais.", "Sim, mas apenas para a interposição de recurso.", "Não, salvo nos processos com arguidos presos ou detidos e nos demais casos urgentes."], correctAnswerIndex: 3, explanation: "A regra geral, conforme o Art. 104.º, n.º 1, é a de que os prazos se suspendem durante as férias judiciais. A exceção principal a esta regra são os processos considerados urgentes, como os que envolvem arguidos privados da liberdade." },
    { id: 53, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 105.º", articleTitle: "Contagem dos prazos", articleText: "1 - A contagem dos prazos para a prática de atos processuais segue o disposto na lei do processo civil.\n2 - Na contagem dos prazos legalmente fixados em meses ou em anos inclui-se o período de férias judiciais.", question: "Como se contam os prazos processuais penais fixados em dias?", options: ["De forma contínua, incluindo sábados, domingos e feriados.", "Seguindo as regras do Código de Processo Civil, não se contando os dias não úteis.", "São contados apenas os dias úteis, mas correm em férias.", "Cada dia corresponde a 24 horas exatas."], correctAnswerIndex: 1, explanation: "O Art. 105.º, n.º 1, remete para as regras do processo civil (Art. 138.º do CPC), o que significa que na contagem de prazos em dias não se incluem sábados, domingos e feriados que ocorram no período." },
    { id: 54, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 107.º", articleTitle: "Prazo e seu excesso", articleText: "2 - O prazo processual fixado na lei ou por despacho é contínuo, suspendendo-se, no entanto, durante as férias judiciais, salvo nos casos do n.º 2 do artigo 104.º", question: "Um prazo de 10 dias para um ato num processo não urgente começa a contar a 10 de julho. Quando termina?", options: ["A 20 de julho.", "O prazo suspende-se durante as férias judiciais e recomeça a sua contagem a 1 de setembro.", "Termina a 20 de julho, pois as férias não afetam a contagem.", "O prazo duplica por ser em período de férias."], correctAnswerIndex: 1, explanation: "Conforme os Arts. 107.º, n.º 2, e 104.º, a contagem do prazo suspende-se a 15 de julho com o início das férias judiciais. Tendo decorrido 5 dias (10 a 14), os restantes 5 dias começam a contar a partir de 1 de setembro, terminando o prazo a 5 de setembro." },
    { id: 55, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 107.º-A", articleTitle: "Prática de ato fora do prazo", articleText: "Independentemente de justo impedimento, o ato processual pode ser praticado dentro dos três primeiros dias úteis subsequentes ao termo do prazo, ficando a sua validade dependente do pagamento imediato de uma multa...", question: "Um advogado perde o prazo para apresentar a contestação. Pode ainda praticar o ato?", options: ["Não, o prazo é perentório e extingue o direito.", "Sim, a todo o tempo, mas com uma multa agravada.", "Sim, nos três dias úteis seguintes ao termo do prazo, mediante o pagamento de uma multa.", "Sim, se o juiz autorizar a prorrogação do prazo."], correctAnswerIndex: 2, explanation: "O Art. 107.º-A consagra a possibilidade de praticar o ato 'fora de prazo' nos três dias úteis subsequentes, sanando a extemporaneidade através do pagamento de uma multa, um mecanismo idêntico ao previsto no processo civil." },
    { id: 56, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 119.º", articleTitle: "Nulidades insanáveis", articleText: "São nulidades insanáveis... c) A ausência do arguido ou do seu defensor, nos casos em que a lei exigir a respetiva presença...", question: "O primeiro interrogatório judicial de um arguido detido é realizado sem a presença do seu defensor. Qual a consequência?", options: ["O ato é irregular.", "O ato é anulável, se o arguido arguir o vício.", "O ato é nulo, sendo uma nulidade insanável.", "O ato é válido se o arguido prescindir do defensor."], correctAnswerIndex: 2, explanation: "A presença do defensor no primeiro interrogatório de arguido detido é obrigatória (Art. 141.º, n.º 2). A sua ausência constitui uma nulidade insanável, nos termos do Art. 119.º, al. c), por violação do núcleo essencial do direito de defesa." },
    { id: 57, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 120.º", articleTitle: "Nulidades dependentes de arguição", articleText: "2 - Constituem nulidades dependentes de arguição... c) A falta de nomeação de intérprete a arguido que não conhecer ou não dominar a língua portuguesa...", question: "Um arguido estrangeiro que não fala português é ouvido em inquérito sem intérprete. De que vício padece o ato?", options: ["Nulidade insanável.", "Nulidade dependente de arguição.", "Mera irregularidade.", "Inexistência jurídica."], correctAnswerIndex: 1, explanation: "A falta de intérprete para um arguido que não domina a língua portuguesa constitui uma nulidade dependente de arguição, conforme previsto no Art. 120.º, n.º 2, al. c). Deve ser arguida para que o ato seja invalidado." },
    { id: 58, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 121.º", articleTitle: "Sanação de nulidades", articleText: "1 - As nulidades sanáveis ficam sanadas se os interessados... a elas expressamente renunciarem... tiverem aceite expressamente os efeitos do ato... ou se tiverem prevalecido de faculdade a cujo exercício o ato se destinava.", question: "Um ato é nulo por falta de notificação da parte. A parte, no entanto, pratica o ato processual seguinte. O que acontece à nulidade?", options: ["A nulidade mantém-se e deve ser declarada pelo juiz.", "A nulidade converte-se em irregularidade.", "A nulidade considera-se sanada.", "O processo é anulado desde o início."], correctAnswerIndex: 2, explanation: "O Art. 121.º, n.º 1, prevê a sanação da nulidade por renúncia tácita. Ao praticar o ato subsequente, a parte demonstra que o vício não a prejudicou e aceita os efeitos do ato nulo, sanando a nulidade." },
    { id: 59, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 122.º", articleTitle: "Declaração da nulidade", articleText: "1 - As nulidades insanáveis são oficiosamente declaradas em qualquer fase do procedimento.", question: "Quem pode declarar uma nulidade insanável?", options: ["Apenas o arguido.", "Apenas o Ministério Público.", "O tribunal, oficiosamente, em qualquer fase do processo.", "Apenas o Supremo Tribunal de Justiça."], correctAnswerIndex: 2, explanation: "Dada a sua gravidade, as nulidades insanáveis são de conhecimento oficioso, o que significa que o juiz deve declará-las assim que delas tomar conhecimento, independentemente de arguição das partes e em qualquer altura do processo." },
    { id: 60, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 104.º", articleTitle: "Regras gerais sobre prazos", articleText: "2 - Correm, porém, durante as férias judiciais os prazos relativos a processos de arguidos presos ou detidos e aqueles nos quais o interesse público o justifique, nos termos de legislação especial, bem como os prazos de recurso de decisões proferidas em processo sumário.", question: "Um prazo de recurso de uma sentença em processo sumário corre durante as férias judiciais?", options: ["Não, suspende-se como nos processos comuns.", "Sim, pois é considerado um processo urgente.", "Depende de despacho do juiz.", "Apenas se o arguido estiver preso."], correctAnswerIndex: 1, explanation: "O Art. 104.º, n.º 2, estabelece expressamente que os prazos de recurso em processo sumário são uma exceção à regra da suspensão, correndo durante as férias judiciais devido à natureza urgente desta forma de processo." },
    { id: 61, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 103.º", articleTitle: "Quando começam a correr", articleText: "1 - Os prazos para a prática de atos processuais são contínuos, correndo também aos sábados, domingos e dias feriados. 2 - A prática de um ato processual depois das 16 horas de um dia útil equivale, para efeitos de contagem de prazos, à prática do ato no dia útil seguinte.", question: "O prazo para a prática de um ato termina no dia 10. O ato é praticado às 17h do dia 10. O ato é tempestivo?", options: ["Não, foi praticado fora de horas.", "Sim, é tempestivo.", "Depende de autorização do juiz.", "Não, pois para efeitos de contagem de prazo, considera-se praticado no dia 11."], correctAnswerIndex: 3, explanation: "Esta questão foi alterada pela jurisprudência do STJ. Atualmente, a prática do ato após as 16h não o torna extemporâneo, mas o prazo seguinte que dependa desse ato conta-se como se o ato tivesse sido praticado no dia útil seguinte. A resposta reflete a interpretação literal que seria testada." },
    { id: 62, discipline: "Processo Penal", code: "Código de Processo Penal", articleNumber: "Artigo 279.º", articleTitle: "Cômputo do termo (Código Civil)", articleText: "c) O prazo que termine em domingo ou dia feriado transfere-se para o primeiro dia útil;...", question: "Um prazo processual penal de 5 dias termina num sábado. Até quando pode o ato ser praticado (sem multa)?", options: ["Até ao próprio sábado.", "Até domingo.", "Até à segunda-feira seguinte.", "O prazo terminou na sexta-feira anterior."], correctAnswerIndex: 2, explanation: "Por remissão do Art. 105.º do CPP para o CPC, e deste para o Código Civil, o termo do prazo que caia num dia não útil (sábado) transfere-se para o primeiro dia útil seguinte, que seria a segunda-feira." },

    // --- Deontologia (34 Questions) ---
    { id: 63, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 88.º", articleTitle: "Integridade", articleText: "1. O advogado é indispensável à administração da justiça e, como tal, deve ter um comportamento público e profissional adequado à dignidade e à responsabilidade da função que exerce, cumprindo pontual e escrupulosamente os deveres consignados no presente Estatuto e todos aqueles que a lei, os usos, os costumes e as tradições profissionais lhe impõem.", question: "O dever de integridade de um advogado aplica-se a que esfera da sua vida?", options: ["Apenas à sua vida profissional.", "Apenas à sua vida pública.", "Tanto ao seu comportamento público como profissional.", "Apenas na sua relação com os tribunais."], correctAnswerIndex: 2, explanation: "O Art. 88.º, n.º 1, é claro ao estipular que o advogado deve ter um comportamento 'público e profissional' adequado. A dignidade da profissão exige que o advogado mantenha um padrão de conduta elevado em todas as suas interações visíveis." },
    { id: 64, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 89.º", articleTitle: "Independência", articleText: "1. O advogado, no exercício da profissão, mantém sempre em quaisquer circunstâncias a sua independência, devendo agir livre de qualquer pressão, especialmente a que resulte dos seus próprios interesses ou de influências exteriores, abstendo-se de negligenciar a deontologia profissional no intuito de agradar ao seu cliente, aos colegas, ao tribunal ou a terceiros.", question: "De que tipo de influências deve o advogado manter-se independente?", options: ["Apenas de influências de terceiros.", "Apenas de influências do tribunal.", "Apenas dos seus próprios interesses.", "De qualquer pressão, incluindo os seus próprios interesses, os do cliente ou de terceiros."], correctAnswerIndex: 3, explanation: "O dever de independência, consagrado no Art. 89.º, é absoluto. O advogado deve estar livre de qualquer pressão, seja ela externa (tribunais, opinião pública) ou interna (os seus próprios interesses financeiros, o desejo de agradar ao cliente)." },
    { id: 65, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 92.º", articleTitle: "Segredo profissional", articleText: "1. O advogado é obrigado a guardar segredo profissional no que respeita a todos os factos cujo conhecimento lhe advenha do exercício das suas funções ou da prestação dos seus serviços...", question: "O dever de segredo profissional abrange que factos?", options: ["Apenas os factos transmitidos pelo cliente.", "Apenas os factos relacionados com o processo judicial.", "Todos os factos cujo conhecimento advenha do exercício das suas funções, independentemente da sua proveniência.", "Apenas os factos confidenciais de outros advogados."], correctAnswerIndex: 2, explanation: "O Art. 92.º, n.º 1, estabelece uma cláusula geral muito ampla. O segredo abrange todos os factos que o advogado conhece por causa da sua profissão, não importando se foram revelados pelo cliente, pela parte contrária, por testemunhas, ou obtidos através de documentos." },
    { id: 66, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 95.º", articleTitle: "Dever geral de urbanidade", articleText: "No exercício da profissão, o advogado deve proceder com urbanidade, nomeadamente para com os colegas, os magistrados, os árbitros, os peritos, as testemunhas e demais intervenientes nos processos...", question: "O dever de urbanidade impõe-se ao advogado na sua relação com quem?", options: ["Apenas com os colegas e magistrados.", "Apenas com os clientes.", "Com todos os intervenientes nos processos e, em geral, no exercício da profissão.", "Apenas com as testemunhas."], correctAnswerIndex: 2, explanation: "O Art. 95.º é claro ao impor um dever geral de urbanidade (cortesia, respeito) para com todos os intervenientes com quem o advogado contacta no exercício da sua profissão, incluindo colegas, magistrados, e outros." },
    { id: 67, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 58.º", articleTitle: "Competência", articleText: "1. Compete aos conselhos de deontologia:\na) Exercer o poder disciplinar em primeira instância, nos termos do presente Estatuto e dos regulamentos, relativamente aos advogados e advogados estagiários com domicílio profissional na área da respetiva região...", question: "A competência para exercer o poder disciplinar sobre um advogado, em primeira instância, pertence a que órgão?", options: ["Ao Conselho Geral.", "Ao Conselho Superior.", "Ao Conselho de Deontologia da região onde o advogado tem o seu domicílio profissional.", "Ao tribunal da comarca."], correctAnswerIndex: 2, explanation: "Conforme o Art. 58.º, n.º 1, al. a), a competência disciplinar em primeira instância é territorial, cabendo ao Conselho de Deontologia da região onde o advogado está inscrito." },
    { id: 68, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 67.º", articleTitle: "Direitos e deveres", articleText: "1. Os advogados com inscrição em vigor podem, em todo o território nacional e perante qualquer jurisdição, instância, autoridade ou entidade pública ou privada, praticar atos próprios da advocacia...\n2. O mandato judicial, a representação e a assistência por advogado são sempre admissíveis e não podem ser impedidos perante qualquer jurisdição, instância, autoridade ou entidade pública ou privada, nomeadamente para defesa de direitos, patrocínio judiciário ou interconsultas.", question: "Um advogado com inscrição em vigor na Comarca de Lisboa pode praticar um ato próprio da advocacia no Porto?", options: ["Não, a sua competência é limitada à sua comarca.", "Sim, mas precisa de autorização do Conselho de Deontologia do Porto.", "Sim, o advogado pode exercer em todo o território nacional.", "Apenas se for um ato em tribunal superior."], correctAnswerIndex: 2, explanation: "O Art. 67.º, n.º 1, consagra o princípio da competência territorial nacional. Um advogado com inscrição ativa pode exercer a sua profissão em qualquer parte do país, perante qualquer entidade." },
    { id: 69, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 196.º", articleTitle: "Competência", articleText: "1 - Compete ao advogado estagiário, no decurso do período de estágio, praticar os seguintes atos sob a orientação do patrono:\na) Todos os atos da competência dos solicitadores;\nb) Exercer a consulta jurídica em todos os domínios do direito.\n2 - O advogado estagiário pode ainda praticar os seguintes atos, desde que efetivamente acompanhado pelo seu patrono:\na) Todos os atos próprios da advocacia, com exceção dos que forem da exclusiva competência dos advogados com, pelo menos, 10 anos de exercício profissional...", question: "Um advogado estagiário pode assinar sozinho uma petição inicial numa ação declarativa comum?", options: ["Sim, sempre.", "Não, nunca.", "Sim, porque é um ato da competência dos solicitadores.", "Não, porque não se enquadra nos atos que pode praticar desacompanhado."], correctAnswerIndex: 2, explanation: "O Art. 196.º, n.º 1, al. a), confere ao advogado estagiário a competência para praticar, desacompanhado, todos os atos da competência dos solicitadores. A elaboração de uma petição inicial enquadra-se nessa competência, conforme a Lei dos Atos Próprios." },
    { id: 70, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 82.º", articleTitle: "Incompatibilidades", articleText: "1. São, designadamente, incompatíveis com o exercício da advocacia os seguintes cargos, funções e atividades:\na) Titular ou membro de órgão de soberania...\nb) Membro do Ministério Público...", question: "Um juiz pode inscrever-se na Ordem dos Advogados e exercer advocacia?", options: ["Sim, desde que fora do horário de trabalho.", "Não, a função de magistrado judicial é incompatível com o exercício da advocacia.", "Sim, se obtiver autorização do Conselho Superior da Magistratura.", "Apenas em causas não judiciais."], correctAnswerIndex: 1, explanation: "O Art. 82.º, n.º 1, al. a) e b), estabelece uma incompatibilidade absoluta entre o exercício da advocacia e as funções de titular de órgão de soberania, o que inclui os magistrados. O exercício simultâneo é proibido." },
    { id: 71, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 99.º", articleTitle: "Conflito de interesses", articleText: "1 - O advogado deve recusar o patrocínio de uma questão em que já tenha intervindo em qualquer qualidade ou seja conexa com outra em que represente, ou tenha representado, a parte contrária.", question: "Um advogado representou o Autor numa ação de divórcio. Anos mais tarde, pode representar o Réu (o ex-cônjuge) numa ação de regulação de responsabilidades parentais contra o Autor?", options: ["Sim, pois são processos diferentes.", "Não, porque a questão é conexa com outra em que representou a parte contrária.", "Sim, se o Autor der o seu consentimento.", "Apenas se não tiver recebido informações confidenciais no primeiro processo."], correctAnswerIndex: 1, explanation: "O Art. 99.º, n.º 1, proíbe o patrocínio em questões conexas com outras em que o advogado representou a parte contrária. Um processo de responsabilidades parentais é materialmente conexo com o divórcio anterior, existindo um claro conflito de interesses." },
    { id: 72, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 75.º", articleTitle: "Buscas e diligências em escritório de advogado ou sociedade de advogados", articleText: "1 - A busca e as diligências em escritório de advogado ou em sociedade de advogados... são, sob pena de nulidade, presididas pelo juiz de instrução...", question: "Quem deve presidir a uma busca realizada no escritório de um advogado?", options: ["O Ministério Público.", "Um representante da Ordem dos Advogados.", "O juiz de instrução.", "O órgão de polícia criminal mais graduado."], correctAnswerIndex: 2, explanation: "O Art. 75.º, n.º 1, estabelece uma garantia fundamental da advocacia: qualquer busca em escritório de advogado tem de ser presidida por um juiz de instrução, sob pena de nulidade do ato e da prova recolhida." },
    { id: 73, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 76.º", articleTitle: "Apreensão de documentos", articleText: "1. Não é permitida a apreensão, em escritório de advogado ou em qualquer outro local de arquivo, de documentos que respeitem a factos que constituam objeto de sigilo profissional...", question: "Durante uma busca a um escritório, podem ser apreendidos documentos que contenham comunicações entre o advogado e um cliente sobre um processo?", options: ["Sim, se forem relevantes para a investigação.", "Não, a apreensão de documentos cobertos por segredo profissional não é permitida.", "Sim, mas apenas com autorização do bastonário.", "Apenas os documentos originais, não as cópias."], correctAnswerIndex: 1, explanation: "O Art. 76.º, n.º 1, protege o núcleo essencial do segredo profissional, proibindo a apreensão de documentos que contenham matéria sigilosa, como as comunicações com clientes, salvo as exceções previstas na própria lei (n.º 4)." },
    { id: 74, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 90.º", articleTitle: "Deveres para com a comunidade", articleText: "2 - Em especial, o advogado tem o dever de:\na) Pugnar pela boa aplicação das leis, pela rápida administração da justiça e pelo aperfeiçoamento da cultura e instituições jurídicas;", question: "Qual dos seguintes é um dever do advogado para com a comunidade?", options: ["Garantir sempre a vitória do seu cliente.", "Pugnar pela rápida administração da justiça.", "Cobrar honorários baixos.", "Publicitar os seus serviços."], correctAnswerIndex: 1, explanation: "O Art. 90.º, n.º 2, al. a), estabelece que o advogado, na sua função social, tem o dever de lutar não apenas pelos interesses do seu cliente, mas também pela melhoria do sistema de justiça como um todo." },
    { id: 75, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 97.º", articleTitle: "Relações com os clientes", articleText: "1 - A relação entre o advogado e o seu cliente deve fundar-se na confiança recíproca.", question: "Qual o pilar fundamental da relação entre um advogado e o seu cliente?", options: ["A amizade.", "A confiança recíproca.", "A formalidade.", "A partilha de custos."], correctAnswerIndex: 1, explanation: "O Art. 97.º, n.º 1, consagra a confiança mútua como o alicerce da relação cliente-advogado. A quebra desta confiança é a principal justa causa para a revogação do mandato." },
    { id: 76, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 100.º", articleTitle: "Outros deveres", articleText: "1 - Nas relações com o cliente, são ainda deveres do advogado:\nb) Estudar com cuidado e tratar com zelo a questão de que seja incumbido, utilizando para o efeito todos os recursos da sua experiência, saber e atividade;", question: "Um advogado que não estuda devidamente um caso e perde um prazo processual, viola qual dever deontológico?", options: ["O dever de urbanidade.", "O dever de zelo e estudo.", "O dever de segredo profissional.", "O dever de lealdade à Ordem."], correctAnswerIndex: 1, explanation: "O Art. 100.º, n.º 1, al. b), impõe ao advogado um dever de competência técnica e diligência, vulgarmente conhecido como dever de zelo. A negligência no tratamento de uma causa constitui uma violação direta deste dever." },
    { id: 77, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 105.º", articleTitle: "Fixação dos honorários", articleText: "3 - Na fixação dos honorários, o advogado deve atender à importância dos serviços prestados, à dificuldade e urgência do assunto, ao grau de criatividade intelectual da sua prestação, ao resultado obtido, ao tempo despendido, às responsabilidades por si assumidas e aos demais usos profissionais.", question: "Qual dos seguintes fatores o advogado NÃO deve considerar na fixação de honorários?", options: ["A importância dos serviços prestados.", "O resultado obtido.", "A situação económica do cliente.", "O tempo despendido."], correctAnswerIndex: 2, explanation: "O Art. 105.º, n.º 3, elenca os critérios para a fixação de honorários. Embora a situação económica do cliente possa ser considerada para efeitos de apoio judiciário ou acordos de pagamento, não é um critério legal para a fixação do valor dos honorários em si." },
    { id: 78, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 106.º", articleTitle: "Quota litis e repartição de honorários", articleText: "1 - É proibido ao advogado celebrar pactos de quota litis.\n2 - Por pacto de quota litis entende-se o acordo celebrado entre o advogado e o seu cliente, antes da conclusão definitiva da questão em que este é parte, pelo qual o direito a honorários fique exclusivamente dependente do resultado obtido na questão e em virtude do qual o constituinte se obrigue a pagar ao advogado parte do resultado que vier a obter...", question: "Um advogado acorda com um cliente que apenas receberá honorários se vencer a causa, e nesse caso receberá 30% do valor da indemnização. Este acordo é:", options: ["Válido, é um acordo de risco.", "Nulo, por se tratar de um pacto de quota litis proibido.", "Válido, se o cliente concordar por escrito.", "Anulável, a pedido do Conselho de Deontologia."], correctAnswerIndex: 1, explanation: "O Art. 106.º proíbe expressamente os pactos de 'quota litis', que são acordos onde os honorários dependem exclusivamente do resultado e consistem numa parte desse mesmo resultado. O acordo descrito é um exemplo clássico." },
    { id: 79, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 108.º", articleTitle: "Dever de lealdade", articleText: "1 - O advogado tem o dever de, com toda a independência e sem atender aos seus próprios interesses, defender os direitos e os interesses legítimos do cliente, quer em juízo, quer fora dele.", question: "Um advogado, para evitar um julgamento longo, aconselha o seu cliente a aceitar um acordo que sabe ser desfavorável. Que dever está a violar?", options: ["O dever de segredo.", "O dever de urbanidade para com o tribunal.", "O dever de lealdade para com o cliente.", "O dever de pagar quotas à Ordem."], correctAnswerIndex: 2, explanation: "O Art. 108.º, n.º 1, impõe o dever de lealdade, que exige que o advogado defenda os interesses do cliente sem atender aos seus próprios (neste caso, a conveniência de evitar um julgamento). Aconselhar um mau acordo por conveniência pessoal é uma violação deste dever." },
    { id: 80, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 112.º", articleTitle: "Dever de solidariedade", articleText: "1 - A solidariedade profissional impõe uma relação de confiança e cooperação entre os advogados, em benefício dos clientes, da boa administração da justiça e do prestígio da profissão.", question: "Um advogado recusa-se a falar com o advogado da parte contrária para tentar um acordo, tratando-o com desdém. Que dever está a violar?", options: ["O dever de segredo profissional.", "O dever de lealdade ao cliente.", "O dever de solidariedade e cooperação entre colegas.", "O dever de pugnar pela rápida administração da justiça."], correctAnswerIndex: 2, explanation: "O Art. 112.º, n.º 1, estabelece o dever de solidariedade, que implica uma relação de cooperação e respeito entre colegas. A recusa em dialogar de forma construtiva com o advogado da contraparte viola este dever." },
    { id: 81, discipline: "Deontologia", code: "Estatuto da Ordem dos Advogados", articleNumber: "Artigo 112.º", articleTitle: "Dever de solidariedade", articleText: "5 - Antes de aceitar assumir o patrocínio de uma questão que tenha sido confiada a outro advogado, deve este certificar-se de que o colega foi notificado da revogação do mandato e de que foram pagos os honorários e outras quantias que sejam devidas àquele...", question: "Um cliente pretende mudar de advogado. O novo advogado, antes de aceitar o mandato, deve fazer o quê?", options: ["Criticar o trabalho do colega anterior para justificar a mudança.", "Aceitar imediatamente para garantir o cliente.", "Certificar-se de que o colega anterior foi notificado da revogação e que os seus honorários foram pagos.", "Pedir autorização à Ordem dos Advogados para aceitar o caso."], correctAnswerIndex: 2, explanation: "O Art. 112.º, n.º 5, impõe ao advogado sucessor um dever de solidariedade para com o colega. Antes de aceitar o patrocínio, deve tomar diligências para garantir que a transição é feita de forma correta, incluindo a questão dos honorários devidos ao advogado anterior." }
];

// --- DATABASE OF FLASHCARDS ---
const allFlashcards = [
    {
        "id": 1,
        "discipline": "Deontologia",
        "front": "Qual o foco principal do estudo para a Ordem dos Advogados, segundo Fergus?",
        "back": "O estudo deve ser **eminentemente prático**, focando-se na **base legal necessária** para a resolução de problemas, em vez de longas divergências doutrinárias. É crucial referir **todos os artigos relevantes** e as suas relações."
      },
      {
        "id": 2,
        "discipline": "Deontologia",
        "front": "Quais são os três princípios basilares da advocacia, considerados estruturantes pelo Estatuto?",
        "back": "Os três princípios estruturantes são o **princípio da integridade** (Art. 88), o **princípio da independência** (Art. 89) e o **dever geral de correção e urbanidade** (Art. 95)."
      },
      {
        "id": 3,
        "discipline": "Deontologia",
        "front": "Qual a *ratio* subjacente ao princípio da integridade previsto no artigo 88 do Estatuto?",
        "back": "A advocacia é uma **profissão essencial para a administração da justiça**, exigindo um **grau de exigência ética muito elevado** – superior ao do 'homem médio' – para cumprir devidamente o seu mandato. O advogado deve procurar a solução mais justa, **não devendo ganhar a todo o custo ou obter resultados ilícitos**."
      },
      {
        "id": 4,
        "discipline": "Deontologia",
        "front": "O que acontece quando um advogado viola o dever de integridade ou probidade, nos termos do artigo 88?",
        "back": "A violação pode enquadrar-se numa **causa de averiguação de inidoneidade** para o exercício da profissão (Art. 177, nº 1). A falta de idoneidade impede a inscrição (Art. 188, nº 1, al. a))."
      },
      {
        "id": 5,
        "discipline": "Deontologia",
        "front": "Qual a ideia subjacente ao princípio da independência do advogado (Art. 89)?",
        "back": "O advogado deve ser **livre de pressões** (internas ou externas, incluindo do próprio cliente) para poder ser **íntegro** e **administrar a Justiça**, visando o **interesse público**. O interesse pessoal, embora inevitável, nunca deve levar a ações contrárias à justiça ou ao interesse público."
      },
      {
        "id": 6,
        "discipline": "Deontologia",
        "front": "O dever geral de correção e urbanidade (Art. 95) pode limitar a defesa dos interesses do cliente?",
        "back": "**Não**, o dever de urbanidade e correção **não pode impor-se ou sobrepor-se à prossecução dos interesses do cliente**. O advogado deve sempre defender esses interesses, mas de **forma correta e urbana**. Além disso, o advogado tem o dever de assegurar que o seu cliente também seja correto."
      },
      {
        "id": 7,
        "discipline": "Deontologia",
        "front": "A independência do advogado é exercida apenas face a entidades externas ou também em relação ao cliente?",
        "back": "A independência é exercida **também, e em grande parte das vezes, em relação ao próprio cliente**. O advogado deve defender os interesses legítimos do cliente, mas **sempre em estrito cumprimento das normas legais e deontológicas** (Art. 97, nº 2)."
      },
      {
        "id": 8,
        "discipline": "Deontologia",
        "front": "Qual é a natureza jurídica da Ordem dos Advogados e como é controlada?",
        "back": "A Ordem dos Advogados é uma **associação pública que prossegue atribuições de interesse público**, fazendo parte da **administração autónoma do Estado**. Não está sujeita à superintendência estatal, mas o Estado exerce controlo sobre a **legalidade das suas decisões através dos tribunais administrativos** (Art. 6, nº 3 do Estatuto)."
      },
      {
        "id": 9,
        "discipline": "Deontologia",
        "front": "Quem tem competência para decidir em última instância sobre o levantamento do sigilo profissional, segundo o Estatuto?",
        "back": "Em primeira instância, a decisão compete ao **Presidente do Conselho Regional** respetivo (Art. 55, nº 1, al. l)). O **recurso** dessa decisão é interposto para o **Bastonário** (Art. 40, nº 1, al. o))."
      },
      {
        "id": 10,
        "discipline": "Deontologia",
        "front": "Qual a função principal do Conselho de Supervisão, criado em 2024?",
        "back": "A sua principal função é **zelar pela legalidade da atuação dos órgãos da Ordem**, funcionando como um 'auditor interno', independente dos demais órgãos. É composto maioritariamente por **membros externos à Ordem**. Também aprova o regulamento de estágio."
      },
      {
        "id": 11,
        "discipline": "Deontologia",
        "front": "Onde deve ser apresentada uma participação disciplinar contra um colega advogado?",
        "back": "Deve ser apresentada no **Conselho de Deontologia da região onde o colega se encontra inscrito**, e não no local da prática do facto (Art. 58, nº 1, al. a))."
      },
      {
        "id": 12,
        "discipline": "Deontologia",
        "front": "Quais são os únicos temas que o referendo da Ordem dos Advogados não pode abordar?",
        "back": "O referendo **exclui apenas as questões disciplinares ou financeiras** (Art. 26, nº 1 do Estatuto). Pode abordar todos os outros temas da competência da Assembleia Geral, do Bastonário ou do Conselho Geral."
      },
      {
        "id": 13,
        "discipline": "Deontologia",
        "front": "Qual é o ato próprio exclusivo por excelência dos advogados e solicitadores, segundo a nova lei?",
        "back": "O **mandato forense**, que é a representação perante qualquer jurisdição, autoridade ou entidade, pública ou privada (Art. 67 do Estatuto; Art. 5 da Lei dos Atos Próprios)."
      },
      {
        "id": 14,
        "discipline": "Deontologia",
        "front": "Quem mais pode exercer a consulta jurídica, para além dos advogados, após a nova lei dos atos próprios?",
        "back": "**Notários, agentes de execução e licenciados em direito** (Art. 7 da Lei dos Atos Próprios). Os licenciados em direito devem constituir um seguro de responsabilidade civil profissional."
      },
      {
        "id": 15,
        "discipline": "Deontologia",
        "front": "Quais são as consequências da prática de atos próprios de advogado por alguém não habilitado?",
        "back": "A pessoa comete o **crime de procuradoria ilícita** (Art. 11 da Lei dos Atos Próprios). Também se pune o **auxílio** a essa prática. Este crime pode estar em concurso aparente com o **crime de usurpação de funções** (Art. 358, al. b) do Código Penal)."
      },
      {
        "id": 16,
        "discipline": "Deontologia",
        "front": "Qual o domicílio profissional de um advogado estagiário?",
        "back": "O domicílio profissional do advogado estagiário é **sempre o do patrono** (Art. 186, nº 4)."
      },
      {
        "id": 17,
        "discipline": "Deontologia",
        "front": "Em que tipo de ações judiciais um advogado estagiário pode intervir isoladamente, sob orientação do patrono?",
        "back": "Em ações cujo valor **não exceda a alçada do tribunal de primeira instância (até 5 mil euros)**, tanto em processo civil (Art. 40, nº 1, al. b) à contrário, e Art. 629, nº 1 do CPC) quanto em processo penal (para pedidos de indemnização civil até 5 mil euros)."
      },
      {
        "id": 18,
        "discipline": "Deontologia",
        "front": "O que acontece quando um advogado estagiário excede as suas competências?",
        "back": "Considera-se um **exercício irregular da advocacia**, não um crime de procuradoria ilícita. Gera **responsabilidade disciplinar** para o estagiário (Arts. 114, 115, nº 1) e, eventualmente, para o patrono (Art. 192, nº 5, al. c))."
      },
      {
        "id": 19,
        "discipline": "Deontologia",
        "front": "Qual a diferença entre incompatibilidade e impedimento na advocacia?",
        "back": "A **incompatibilidade** é uma **impossibilidade absoluta de exercício simultâneo** da advocacia com outro cargo/emprego, implicando a suspensão ou impossibilidade de inscrição. O **impedimento** é uma **impossibilidade de praticar determinados atos** enquanto advogado, obrigando a não representar um cliente ou causa específica."
      },
      {
        "id": 20,
        "discipline": "Deontologia",
        "front": "Um vereador municipal sem tempo atribuído pode ser advogado? Se sim, com que restrições?",
        "back": "**Sim, pode ser advogado**, pois não está coberto pela incompatibilidade do Art. 82, nº 1, al. a). No entanto, está **impedido** (Art. 83, nº 5) de intervir em causas contra a sua autarquia ou em atividades do executivo do seu município relacionadas com temas que o afetem."
      },
      {
        "id": 21,
        "discipline": "Deontologia",
        "front": "Que deve fazer um advogado perante uma incompatibilidade superveniente?",
        "back": "Deve **suspender imediatamente o exercício da advocacia** e, no prazo de 30 dias, **suspender a inscrição na Ordem** (Art. 188, nº 4; Art. 91, al. d)). A violação pode levar a processo de averiguação de inidoneidade (Art. 177)."
      },
      {
        "id": 22,
        "discipline": "Deontologia",
        "front": "Os impedimentos do advogado (Art. 83) estendem-se aos seus colegas de escritório ou sociedade?",
        "back": "O Art. 83, nºs 3 e 5, **prevê expressamente essa extensão** para os impedimentos de vereadores sem tempo atribuído e representantes de Assembleias Autárquicas. Nos demais casos, **não há norma expressa para uma extensão automática**, havendo divergência doutrinária."
      },
      {
        "id": 23,
        "discipline": "Deontologia",
        "front": "Quais são os dois fundamentos principais da regulação do conflito de interesses na advocacia?",
        "back": "Os fundamentos são: 1. O **dever de lealdade** na relação advogado-cliente, que impede a representação de interesses antagónicos ou a existência de interesse pessoal na causa. 2. A **proteção do segredo profissional**, para evitar o uso de informações adquiridas para beneficiar outra parte."
      },
      {
        "id": 24,
        "discipline": "Deontologia",
        "front": "O que acontece se um conflito de interesses surgir supervenientemente quando o advogado representa mais do que um cliente?",
        "back": "O advogado **tem de deixar de representar ambos os clientes** (Art. 99, nº 4 do Estatuto). Isto evita que o advogado possa aproveitar informações ou ações realizadas para uma parte em benefício da outra."
      },
      {
        "id": 25,
        "discipline": "Deontologia",
        "front": "Quais são as consequências da violação das normas sobre conflito de interesses?",
        "back": "A violação implica **tripla responsabilidade**: **Disciplinar** (Arts. 114 e 115, nº 1), **Civil** (responsabilidade civil contratual) e **Penal** (crime de prevaricação, Art. 370, nº 2 do Código Penal)."
      },
      {
        "id": 26,
        "discipline": "Deontologia",
        "front": "Quais as principais preocupações com a admissão de sociedades multidisciplinares que geraram oposição da Ordem dos Advogados?",
        "back": "As principais preocupações prendem-se com a garantia dos **deveres deontológicos, da independência, dos conflitos de interesses e do sigilo profissional**, considerando a advocacia como exercício privado de uma função pública."
      },
      {
        "id": 27,
        "discipline": "Deontologia",
        "front": "Que sucede a um sócio de uma sociedade multidisciplinar que não possua qualificações profissionais para o exercício de uma das profissões que integra o objeto social da sociedade?",
        "back": "Esse sócio, mesmo não qualificado para uma das profissões, **fica sujeito aos deveres deontológicos e ao regime disciplinar** da atividade profissional que integra o objeto social da sociedade (Art. 52-C, nº 2 da Lei 53/2015)."
      },
      {
        "id": 28,
        "discipline": "Deontologia",
        "front": "Que tipo de sociedades multidisciplinares são explicitamente proibidas ou problemáticas para advogados?",
        "back": "É problemática e ilegal uma sociedade que envolva a **advocacia e a mediação imobiliária** (pela incompatibilidade do exercício direto da mediação imobiliária com a advocacia), ou uma sociedade entre advogados e solicitadores onde o advogado **exerça o mandato forense** (pela incompatibilidade do Art. 85 do Estatuto)."
      },
      {
        "id": 29,
        "discipline": "Deontologia",
        "front": "Em que situações, excecionalmente, é permitida a discussão pública de assuntos profissionais por um advogado?",
        "back": "1. Mediante **autorização prévia do Presidente do Conselho Regional** (Art. 55, nº 1, al. n)), para exercer o direito de resposta e prevenir ofensas a dignidade, direitos e interesses legítimos. 2. Em **casos de urgência, sem autorização prévia**, mas com **informação posterior** ao Presidente do Conselho Regional, limitada ao estritamente necessário."
      },
      {
        "id": 30,
        "discipline": "Deontologia",
        "front": "Qual o objetivo do direito de protesto (Art. 80 do Estatuto) e em que consiste o seu exercício?",
        "back": "O objetivo é permitir ao advogado **agir quando o magistrado nega a palavra**, especialmente para arguir **nulidades processuais que carecem de invocação imediata**. O advogado deve requerer a ata e, em caso de recusa, exercer o direito de protesto. Se o magistrado persistir na recusa, o advogado deve **suspender os trabalhos, sair da audiência e apresentar o protesto por escrito**."
      },
      {
        "id": 31,
        "discipline": "Deontologia",
        "front": "Que responsabilidade pode recair sobre um magistrado que recusa a admissão de um protesto por parte de um advogado?",
        "back": "A falta de admissão de protesto implica sempre a **responsabilidade disciplinar do magistrado por desobediência à lei**."
      },
      {
        "id": 32,
        "discipline": "Deontologia",
        "front": "A vontade ou autorização do cliente é suficiente para levantar o segredo profissional de um advogado?",
        "back": "**Não**, a vontade ou autorização do cliente é **irrelevante**. O segredo profissional é uma **questão de interesse público** e só pode ser levantado mediante **autorização do Presidente do Conselho Regional** (Art. 92, nº 4 do Estatuto), com recurso para o Bastonário."
      },
      {
        "id": 33,
        "discipline": "Deontologia",
        "front": "O que deve fazer um advogado se for chamado a depor sobre factos abrangidos pelo segredo profissional e o tribunal o obrigar a fazê-lo, apesar da sua recusa inicial?",
        "back": "O advogado enfrenta um dilema: Viola o segredo (sujeito a **responsabilidade tripartida**, incluindo **penal** por violação do segredo, Art. 195 CP) ou mantém a recusa (sujeito a **responsabilidade penal** por desobediência, Art. 360 CP, e multa, Art. 417, nº 2 CPC). Pode alegar **exclusão da ilicitude por conflito de deveres** (Art. 31, al. c) e Art. 36 CP) e o tribunal deve solicitar **parecer à Ordem** (Art. 135 CPP)."
      },
      {
        "id": 34,
        "discipline": "Deontologia",
        "front": "Quais as regras aplicáveis às buscas em escritórios de advogados?",
        "back": "As buscas só podem ser decretadas e dirigidas pelo **juiz de instrução criminal**, com a **presença do delegado da Ordem dos Advogados** (ou outro advogado em caso de urgência). A ausência do juiz gera a **nulidade da diligência** (Art. 75, nº 1 do Estatuto; Art. 177, nº 5 do CPP)."
      },
      {
        "id": 35,
        "discipline": "Deontologia",
        "front": "Um advogado pode usar todos os meios para atingir os objetivos do seu cliente, mesmo que envolva fins injustos ou ilícitos?",
        "back": "**Não**. O advogado deve compatibilizar os interesses do cliente com o valor mais alto da justiça (Art. 90). Não deve usar **meios dilatórios** nem procurar **atingir fins injustos ou ilícitos**, mesmo que seja do interesse do cliente."
      },
      {
        "id": 36,
        "discipline": "Deontologia",
        "front": "Quais os deveres do advogado relacionados com a identificação do cliente e a utilização de contas bancárias, no âmbito do combate ao branqueamento de capitais?",
        "back": "O advogado deve **verificar a identidade do cliente**, exigindo que a procuração para novos clientes seja assinada no escritório ou na sua presença (Art. 90, nº 2, al. c)). Além disso, as suas contas bancárias **não podem ser utilizadas para esconder fundos** de origem ilícita do cliente (Art. 90, nº 2, al. e))."
      },
      {
        "id": 37,
        "discipline": "Deontologia",
        "front": "Quais são as principais exigências relativas ao domicílio profissional de um advogado?",
        "back": "O domicílio profissional deve ser um local **compatível com a dignidade da profissão**, onde seja possível receber clientes e assegurar a **proteção do segredo profissional**. Não pode ser uma caixa postal, devendo ser uma **morada fixa, permanente, em imóvel e em Portugal** (Art. 91, al. h) do Estatuto; Regulamento 5/2025)."
      },
      {
        "id": 38,
        "discipline": "Deontologia",
        "front": "O uso da toga é um dever processual ou deontológico?",
        "back": "É um **dever deontológico** (Art. 74 do Estatuto). Ninguém pode impedir o advogado de estar em juízo por falta de uso da toga, embora o juiz possa comunicar a infração à Ordem (Art. 121)."
      },
      {
        "id": 39,
        "discipline": "Deontologia",
        "front": "Um advogado pode aceitar o patrocínio de uma causa mesmo que não tenha competência ou disponibilidade para dela se ocupar devidamente?",
        "back": "**Não**, o advogado não deve aceitar o patrocínio de uma questão se souber que **não tem competência ou disponibilidade** para dela se ocupar prontamente, com todo o zelo e empenho exigidos (Art. 98, nº 2). Isto relaciona-se com o dever de zelo e empenho (Art. 100, nº 1, al. b))."
      },
      {
        "id": 40,
        "discipline": "Deontologia",
        "front": "Quais são as três principais obrigações do advogado para com o cliente, previstas no artigo 100, número 1, alínea a) do Estatuto?",
        "back": "1. Dar uma **opinião conscienciosa, honesta e independente** sobre a viabilidade do tema. 2. Prestar **acompanhamento** sobre o andamento das questões, explicando em termos compreensíveis. 3. Prestar **informações sobre os critérios de honorários, estimativa e a possibilidade de apoio judiciário**."
      },
      {
        "id": 41,
        "discipline": "Deontologia",
        "front": "Em que condições pode um advogado cessar o seu mandato?",
        "back": "O advogado só pode cessar o mandato com **justa causa** (normalmente quebra de confiança). Mesmo com justa causa, deve fazê-lo em **tempo e modo útil**, de forma a permitir ao cliente assegurar a assistência por outro advogado (Art. 100, nº 1, al. e) e nº 2)."
      },
      {
        "id": 42,
        "discipline": "Deontologia",
        "front": "Um advogado pode aceitar do seu cliente valores ou bens que sejam objeto de crime?",
        "back": "**Não**, o advogado **não pode aceitar**, sob pena de cometer um **crime de favorecimento pessoal** (Art. 367 do Código Penal)."
      },
      {
        "id": 43,
        "discipline": "Deontologia",
        "front": "Que direito tem o advogado para garantir o pagamento dos seus honorários e despesas, e quais são as suas limitações?",
        "back": "O advogado goza do **direito de retenção** sobre os bens do cliente para garantir o pagamento de honorários e despesas não cobertas por provisões (Art. 101, nº 3). No entanto, este direito é excecionado se os documentos forem necessários para a prova do cliente, causarem prejuízos irreparáveis, ou se o cliente prestar caução. **Não implica um direito de autopagamento**."
      },
      {
        "id": 44,
        "discipline": "Deontologia",
        "front": "Em que consiste a proibição da *quota litis* e quais as suas exceções?",
        "back": "A *quota litis* é um acordo onde o direito a receber honorários fica **exclusivamente dependente do resultado obtido** (Art. 106). É proibida para salvaguardar a **independência e integridade** do advogado. As exceções permitidas são: 1. **Fixação prévia de honorários em função do valor da causa** (Art. 106, nº 3, al. a)); 2. **Majoração dos honorários em função do resultado (*success fee*)**, desde que não seja a única forma de remuneração (Art. 106, nº 3, al. b))."
      },
      {
        "id": 45,
        "discipline": "Deontologia",
        "front": "O que é proibido a um advogado na sua relação com as testemunhas de uma causa?",
        "back": "É **completamente vedado ao advogado tentar por qualquer meio influenciar o depoimento de uma testemunha** (Art. 109). O mero contacto para perceber o que ela sabe é admissível, mas a instrução ou influência não são."
      },
      {
        "id": 46,
        "discipline": "Deontologia",
        "front": "Que dever tem um advogado em relação ao seu cliente, no que diz respeito à correção e urbanidade para com o tribunal e a contraparte?",
        "back": "O advogado tem o dever de **controlar o seu cliente**, evitando que este exerça represálias ou seja descortês/desurbano com a contraparte, o tribunal, testemunhas, etc. (Art. 110, nº 2). O advogado deve assegurar que o seu cliente também é correto."
      },
      {
        "id": 47,
        "discipline": "Deontologia",
        "front": "Qual a regra geral para um advogado que pretende instaurar um procedimento disciplinar ou judicial contra um colega?",
        "back": "O advogado tem o dever de **comunicar por escrito ao colega antes de intentar o procedimento**, explicando os respetivos motivos (Art. 96). Uma comunicação oral em audiência não é suficiente."
      },
      {
        "id": 48,
        "discipline": "Deontologia",
        "front": "O que deve fazer um advogado sucessor em relação aos honorários do colega que o antecedeu?",
        "back": "O advogado sucessor deve **diligenciar no sentido de garantir que os honorários do colega que o antecedeu estão assegurados** antes de assumir a causa (Art. 112, nº 2). Isto decorre do dever de solidariedade entre advogados."
      },
      {
        "id": 49,
        "discipline": "Processo Civil",
        "front": "Quais são os principais articulados que compõem o processo civil?",
        "back": "Os principais articulados são a petição inicial, a contestação, a reconvenção, a réplica e os articulados supervenientes [1]."
      },
      {
        "id": 50,
        "discipline": "Processo Civil",
        "front": "Qual é a peça processual que dá início à ação e o que deve conter?",
        "back": "A **petição inicial** é a peça processual que dá início à ação, e é nela que o autor expõe a sua causa de pedir e o seu pedido (ou pedidos) contra um ou vários réus [2]."
      },
      {
        "id": 51,
        "discipline": "Processo Civil",
        "front": "Quais são os requisitos essenciais de identificação das partes numa petição inicial?",
        "back": "É necessário identificar o nome da parte, o seu domicílio (ou sede), o número de identificação fiscal, a profissão e o local de trabalho. Esta informação é obrigatória para o autor e, sempre que possível, para as demais partes [3]."
      },
      {
        "id": 52,
        "discipline": "Processo Civil",
        "front": "Qual a diferença entre a recusa da petição inicial e a ineptidão da petição inicial?",
        "back": "A **recusa da petição inicial** é feita pela secretaria por incumprimento de requisitos formais óbvios (ex: falta de indicação da forma ou valor do processo) [4]. A **ineptidão da petição inicial** é decidida pelo juiz e exige um juízo de direito, ocorrendo por falta ou ininteligibilidade do pedido/causa de pedir, contradição entre eles, ou cumulação de pedidos/causas de pedir incompatíveis [5, 6]."
      },
      {
        "id": 53,
        "discipline": "Processo Civil",
        "front": "O que é a contestação e de que formas o réu pode exercer a sua defesa?",
        "back": "A contestação é a peça processual na qual o réu oferece a sua defesa. Essa defesa pode ser exercida **por impugnação** (contradição de factos ou negação do efeito jurídico) ou **por exceção** (factos que obstam ao conhecimento do mérito ou que servem de causa impeditiva, modificativa ou extintiva do direito) [7-9]."
      },
      {
        "id": 54,
        "discipline": "Processo Civil",
        "front": "O que é o ónus de impugnação motivada e qual a sua consequência principal?",
        "back": "O ónus de **impugnação motivada** (Art. 574, n.º 1 CPC) exige que o réu tome uma posição definida perante os factos da causa de pedir. Se os factos não forem impugnados, **consideram-se admitidos por acordo**, salvo exceções [10, 11]."
      },
      {
        "id": 55,
        "discipline": "Processo Civil",
        "front": "Diferencie exceções dilatórias de exceções perentórias.",
        "back": "As **exceções dilatórias** (Art. 577 CPC) obstam ao conhecimento do mérito da causa e são, regra geral, de conhecimento oficioso. As **exceções perentórias** (Art. 579 CPC) determinam a improcedência total ou parcial do pedido, podendo ser extintivas, impeditivas ou modificativas do direito invocado, e regra geral, têm de ser invocadas pelas partes [8, 9, 11, 12]."
      },
      {
        "id": 56,
        "discipline": "Processo Civil",
        "front": "O que são a revelia absoluta e a revelia relativa do réu?",
        "back": "A **revelia absoluta** (Art. 566 CPC) ocorre quando o réu não deduz oposição, não constitui mandatário nem intervém no processo. A **revelia relativa** (Art. 567 CPC) ocorre quando o réu não contesta, mas foi regularmente citado na sua pessoa ou constituiu mandatário judicial no prazo para contestar [13, 14]."
      },
      {
        "id": 57,
        "discipline": "Processo Civil",
        "front": "Qual a principal consequência da revelia relativa operante?",
        "back": "Na revelia relativa operante, **consideram-se confessados os factos alegados pelo autor** (ficta confessio), a menos que se apliquem as exceções do Art. 568 do CPC que tornam a revelia inoperante [15, 16]."
      },
      {
        "id": 58,
        "discipline": "Processo Civil",
        "front": "O que é a reconvenção e qual a sua relação com a contestação?",
        "back": "A **reconvenção** é a peça processual na qual o réu deduz um ou mais pedidos contra o autor (Art. 583, n.º 1 CPC). Enquanto na contestação o réu se defende, na reconvenção ele 'contra-ataca' com um pedido autónomo. É deduzida no mesmo articulado da contestação, mas numa secção à parte [17, 18]."
      },
      {
        "id": 59,
        "discipline": "Processo Civil",
        "front": "Quando é que a réplica é admissível?",
        "back": "A **réplica** (Art. 584 CPC) apenas poderá existir caso haja reconvenção. Nas ações de simples apreciação negativa, serve para impugnar factos constitutivos alegados pelo réu e para alegar factos impeditivos ou extintivos dos direitos invocados pelo réu [19]."
      },
      {
        "id": 60,
        "discipline": "Processo Civil",
        "front": "Qual a principal função dos articulados supervenientes?",
        "back": "Os **articulados supervenientes** servem para apresentar factos constitutivos, modificativos ou extintivos do direito que forem supervenientes (objetiva ou subjetivamente), devendo ser apresentados pela parte a quem aproveitem até ao encerramento da discussão [20, 21]."
      },
      {
        "id": 61,
        "discipline": "Processo Civil",
        "front": "Qual a finalidade do despacho pré-saneador e quando pode ser proferido?",
        "back": "Finda a fase dos articulados, o juiz pode proferir um **despacho pré-saneador** (Art. 590 CPC) para indeferimento liminar da petição inicial, suprimento de exceções dilatórias, convite ao aperfeiçoamento dos articulados ou junção de documentos [22-25]."
      },
      {
        "id": 62,
        "discipline": "Processo Civil",
        "front": "Quais são as principais finalidades da audiência prévia?",
        "back": "As finalidades da **audiência prévia** (Art. 591 CPC) incluem: tentativa de conciliação, discussão de facto e de direito sobre exceções dilatórias ou para conhecimento imediato do mérito, resposta a exceções, delimitação do objeto do litígio, prolação do despacho saneador e programação da audiência final [26-32]."
      },
      {
        "id": 63,
        "discipline": "Processo Civil",
        "front": "Quando é que a audiência prévia não se realiza ou pode ser dispensada?",
        "back": "A audiência prévia **não se realiza** em ações não contestadas que prossigam nos termos do Art. 568 b) a d) CPC, ou quando o processo finda com despacho saneador por procedência de exceções dilatórias já debatidas (Art. 592 CPC) [33, 34]. Pode ser **dispensada** em ações superiores a 15.000€ ou em ações inferiores a 15.000€ por desnecessidade ou inadequação (Art. 593 e 597 CPC) [35, 36]."
      },
      {
        "id": 64,
        "discipline": "Processo Civil",
        "front": "Qual a sequência da audiência final?",
        "back": "A audiência final (Art. 604 CPC) segue a sequência de: tentativa de conciliação, depoimentos de parte, exibição de reproduções (cinematográficas/fonográficas), esclarecimentos verbais dos peritos, inquirição de testemunhas e alegações orais [37, 38]."
      },
      {
        "id": 65,
        "discipline": "Processo Civil",
        "front": "Quais são os elementos essenciais que devem constar numa sentença?",
        "back": "A sentença deve conter: identificação das partes e do objeto do litígio, indicação dos factos provados e não provados, aplicação das normas jurídicas correspondentes, e condenação das partes em custas [39, 40]."
      },
      {
        "id": 66,
        "discipline": "Processo Civil",
        "front": "Quando ocorre o esgotamento do poder jurisdicional do juiz e quais as exceções?",
        "back": "O poder jurisdicional do juiz **esgota-se** com a prolação da sentença (Art. 613, n.º 1 CPC). As exceções permitem ao juiz voltar a pronunciar-se em casos de erros materiais, suprimento de nulidades e reforma da sentença [41, 42]."
      },
      {
        "id": 67,
        "discipline": "Processo Civil",
        "front": "Quais as causas de nulidade da sentença (Art. 615 CPC)?",
        "back": "A sentença é nula se: não contiver a assinatura do juiz; não especificar os fundamentos de facto e direito; os fundamentos estiverem em oposição com a decisão; for obscura ou ambígua; o juiz deixe de se pronunciar sobre questões que devesse apreciar (omissão de pronúncia); ou conheça de questões que não poderia tomar conhecimento (excesso de pronúncia); ou condene em quantidade superior ou objeto diverso do pedido [43]."
      },
      {
        "id": 68,
        "discipline": "Processo Civil",
        "front": "Diferencie litispendência de caso julgado.",
        "back": "Ambos exigem a tríplice identidade (sujeitos, pedido, causa de pedir - Art. 581 CPC). Na **litispendência**, a ação primeiramente começada ainda está em curso. No **caso julgado**, a ação primeiramente começada já foi decidida por decisão que não admite recurso ordinário [44]."
      },
      {
        "id": 69,
        "discipline": "Processo Civil",
        "front": "O que é a citação e quando é utilizada?",
        "back": "A **citação** é o ato processual que dá conhecimento ao réu de que foi proposta uma ação contra ele, ou para chamar pela primeira vez ao processo alguma pessoa interessada na causa. É a primeira e única vez que uma parte é chamada ao processo desta forma [45, 46]."
      },
      {
        "id": 70,
        "discipline": "Processo Civil",
        "front": "Quando se considera a citação efetuada no caso de citação postal?",
        "back": "Regra geral, a citação postal considera-se efetuada **no dia da assinatura do aviso de receção ou da recusa em recebê-lo** (Art. 230, n.º 1 CPC). Nalguns casos específicos, considera-se efetuada no oitavo dia posterior ao do aviso [47]."
      },
      {
        "id": 71,
        "discipline": "Processo Civil",
        "front": "Quando se presume efetuada uma notificação eletrónica?",
        "back": "A **notificação** presume-se efetuada no **terceiro dia posterior ao do envio** ou no primeiro dia útil imediatamente seguinte, quando não o seja. A contagem inicia-se a partir da data da certificação em sistema Citius [48, 49]."
      },
      {
        "id": 72,
        "discipline": "Processo Civil",
        "front": "Quais as regras gerais para a contagem dos prazos processuais?",
        "back": "1. **Início**: Nunca se inclui o dia do evento [50]. 2. **Fim**: Termina sempre num dia útil, transferindo-se para o 1.º dia útil seguinte se cair em fim de semana ou feriado [51]. 3. **Continuidade**: Os prazos são contínuos e incluem sábados, domingos e feriados [52]. 4. **Suspensão**: Os prazos suspendem-se durante as férias judiciais, exceto em prazos superiores a 6 meses ou processos urgentes [53]."
      },
      {
        "id": 73,
        "discipline": "Processo Civil",
        "front": "Qual o prazo geral para contestar e para replicar, e qual o prazo supletivo?",
        "back": "O prazo para **contestar** é de 30 dias (Art. 569, n.º 1 CPC) [54]. O prazo para a **réplica** é de 30 dias (Art. 585 CPC) [54]. O prazo **geral supletivo** é de 10 dias (Art. 149, n.º 1 CPC) [55]."
      },
      {
        "id": 74,
        "discipline": "Processo Civil",
        "front": "Qual a regra especial para o prazo de defesa com pluralidade de réus?",
        "back": "Quando há pluralidade de réus e os prazos de defesa terminam em dias diferentes, a contestação de todos ou de cada um pode ser oferecida **até ao termo do prazo que começou a correr em último lugar** (Art. 569, n.º 2 CPC) [56]."
      },
      {
        "id": 75,
        "discipline": "Processo Civil",
        "front": "Qual o limite das dilações em procedimentos cautelares?",
        "back": "Em procedimentos cautelares, a **dilação não pode ser superior a 10 dias**, mesmo que as regras gerais prevejam um período mais longo (Art. 366, n.º 3 CPC) [57-59]."
      },
      {
        "id": 76,
        "discipline": "Processo Civil",
        "front": "O que acontece se um ato processual for praticado fora do prazo, mas nos 3 dias úteis seguintes?",
        "back": "É possível praticar o ato, mas sujeito ao **pagamento de uma multa**, que será tanto maior quantos mais dias forem utilizados (Art. 139, n.º 5 CPC) [60-62]."
      },
      {
        "id": 77,
        "discipline": "Processo Civil",
        "front": "O que é personalidade judiciária e qual a sua regra geral?",
        "back": "A **personalidade judiciária** é a suscetibilidade de ser parte em juízo (Art. 11, n.º 1 CPC). A regra geral é que **quem tem personalidade jurídica tem igualmente personalidade judiciária** (Art. 11, n.º 2 CPC) [63, 64]."
      },
      {
        "id": 78,
        "discipline": "Processo Civil",
        "front": "Mencione três entidades que têm personalidade judiciária sem ter personalidade jurídica.",
        "back": "A herança jacente, as associações sem personalidade jurídica e as sociedades civis (Art. 12 CPC) [65]."
      },
      {
        "id": 79,
        "discipline": "Processo Civil",
        "front": "O que é capacidade judiciária?",
        "back": "A **capacidade judiciária** consiste na suscetibilidade de estar, por si, em juízo (Art. 15, n.º 1 CPC) [66, 67]."
      },
      {
        "id": 80,
        "discipline": "Processo Civil",
        "front": "O que é legitimidade processual ativa e passiva?",
        "back": "O autor é **parte legítima** quando tem interesse direto em demandar, e o réu será **parte legítima** quando tem interesse direto em contradizer (Art. 30, n.º 1 CPC) [68]."
      },
      {
        "id": 81,
        "discipline": "Processo Civil",
        "front": "Qual a diferença fundamental entre litisconsórcio e coligação?",
        "back": "No **litisconsórcio**, existe pluralidade de partes e unidade quanto ao pedido. Na **coligação**, existe pluralidade de partes e pluralidade de pedidos [69, 70]."
      },
      {
        "id": 82,
        "discipline": "Processo Civil",
        "front": "Quais as consequências da preterição de litisconsórcio necessário?",
        "back": "A preterição de litisconsórcio necessário conduz a uma exceção de **ilegitimidade** (Art. 33 CPC), que pode ser sanada através de intervenção espontânea ou provocada [71-73]."
      },
      {
        "id": 83,
        "discipline": "Processo Civil",
        "front": "Em que casos é obrigatória a constituição de advogado?",
        "back": "É obrigatória a constituição de advogado em: 1. Causas de competência de tribunais com alçada em que seja admissível recurso ordinário (valor > 5.000€ ou > 2.500€ em Julgados de Paz). 2. Causas em que é sempre admissível recurso (Art. 629, n.ºs 2 e 3 CPC). 3. Recurso e causas propostas nos tribunais superiores (Art. 40 CPC) [74]."
      },
      {
        "id": 84,
        "discipline": "Processo Civil",
        "front": "Quais os tipos de competência interna dos tribunais?",
        "back": "A competência interna afere-se em razão da **matéria**, do **valor**, da **hierarquia** e do **território** [75]."
      },
      {
        "id": 85,
        "discipline": "Processo Civil",
        "front": "Qual o critério para a competência em razão do valor em instâncias centrais e locais?",
        "back": "Se o valor da causa for **superior a 50.000€**, a causa deverá ser decidida pela **instância central**. Se o valor for **inferior a 50.000€**, a causa será decidida pela **instância local**, salvo atribuição a juízos de competência especializada ou a tribunal de competência alargada [76]."
      },
      {
        "id": 86,
        "discipline": "Processo Civil",
        "front": "Quais são os valores das alçadas dos tribunais de 1.ª instância e da Relação?",
        "back": "Os tribunais de **1.ª instância** têm uma alçada de **5.000€**. Os tribunais da **Relação** têm uma alçada de **30.000€** [77]."
      },
      {
        "id": 87,
        "discipline": "Processo Civil",
        "front": "Quando ocorre incompetência absoluta do tribunal?",
        "back": "Ocorre incompetência absoluta (Art. 96 CPC) em caso de infração de regras em razão da **matéria**, em razão da **hierarquia**, infração de regras de **competência internacional**, ou **preterição de tribunal arbitral** [78]."
      },
      {
        "id": 88,
        "discipline": "Processo Civil",
        "front": "Qual o efeito da declaração de incompetência relativa?",
        "back": "O efeito da declaração de incompetência relativa (Art. 102 CPC) é a **remessa do processo para o tribunal competente**, e não a absolvição da instância [79]."
      },
      {
        "id": 89,
        "discipline": "Processo Civil",
        "front": "Em que situações a instância pode ser suspensa?",
        "back": "A instância pode ser suspensa por: falecimento ou extinção da parte; falecimento ou impedimento do mandatário; determinação do juiz ou acordo das partes (máx. 3 meses); quando a decisão da causa depende do julgamento de outra ação já proposta (causa prejudicial); e em outros casos previstos na lei (Art. 269, 270, 271, 272 CPC) [80, 81]."
      },
      {
        "id": 90,
        "discipline": "Processo Civil",
        "front": "Diferencie desistência do pedido de desistência da instância.",
        "back": "A **desistência do pedido** extingue o direito do autor, impedindo nova ação com o mesmo objeto (caso julgado material) [82]. A **desistência da instância** apenas faz cessar o processo instaurado, sendo possível iniciar um novo processo com idêntico objeto (caso julgado formal) [82]."
      },
      {
        "id": 91,
        "discipline": "Processo Civil",
        "front": "Qual o critério para fixação do valor da causa em pedidos alternativos ou subsidiários?",
        "back": "Em **pedidos alternativos**, atende-se sempre ao pedido de **maior valor**. Em **pedidos subsidiários**, atender-se-á ao pedido formulado em **primeiro lugar** [83]."
      },
      {
        "id": 92,
        "discipline": "Processo Civil",
        "front": "Quais os três requisitos principais das providências cautelares?",
        "back": "Os três requisitos são: **fumus boni iuris** (probabilidade séria da existência do direito), **periculum in mora** (fundado receio de lesão grave e dificilmente reparável), e **proporcionalidade** (ponderação entre as medidas e os interesses a proteger) [84]."
      },
      {
        "id": 93,
        "discipline": "Processo Civil",
        "front": "Mencione três causas de caducidade de uma providência cautelar.",
        "back": "Uma providência cautelar caduca se: o requerente não propuser a ação principal em 30 dias; a ação for julgada improcedente por decisão transitada em julgado; ou o direito acautelado se extinguir (Art. 373, n.º 1 CPC) [85]."
      },
      {
        "id": 94,
        "discipline": "Processo Civil",
        "front": "O que é a inversão do contencioso e quais os seus requisitos?",
        "back": "A **inversão do contencioso** permite que a providência cautelar substitua a decisão final, dispensando a ação principal. Requisitos (Art. 369 CPC): requerimento da parte; natureza da providência adequada à composição definitiva do litígio; matéria adquirida no procedimento cautelar que permita convicção segura sobre a existência do direito [86, 87]."
      },
      {
        "id": 95,
        "discipline": "Processo Civil",
        "front": "Qual a diferença entre Arresto e Arrolamento?",
        "back": "O **arresto** visa garantir o pagamento de dívidas do credor, mantendo bens na titularidade do devedor contra dissipação (foco no crédito) [88]. O **arrolamento** visa a descrição, avaliação e depósito de bens, devido a justo receio de extravio/dissipação, para conservação (foco nos bens) [89]."
      },
      {
        "id": 96,
        "discipline": "Processo Civil",
        "front": "Quando podem ser apresentados documentos em 1.ª instância?",
        "back": "Devem ser apresentados com o articulado em que se alegam os factos correspondentes. Se não o forem, podem sê-lo até 20 dias antes da audiência final (com multa), ou posteriormente se a junção se tornar necessária por ocorrência posterior ou impossibilidade anterior [90]."
      },
      {
        "id": 97,
        "discipline": "Processo Civil",
        "front": "Diferencie depoimento de parte de declarações de parte.",
        "back": "O **depoimento de parte** destina-se a provocar a confissão, a iniciativa é do juiz ou da parte contrária [91]. As **declarações de parte** incidem sobre factos favoráveis ou desfavoráveis de conhecimento direto, a iniciativa é da própria parte e não visa primariamente a confissão [91, 92]."
      },
      {
        "id": 98,
        "discipline": "Processo Civil",
        "front": "Qual a principal diferença entre recursos ordinários e extraordinários?",
        "back": "Nos **recursos ordinários**, a decisão final ainda não transitou em julgado. Nos **recursos extraordinários**, a decisão já transitou em julgado [93, 94]."
      }
    
];

// --- AUTHENTICATION & PROXY LOGIC ---
const checkAuth = async (req, res, next) => {
    // Enhanced Logging: No longer needed for production, but kept for reference
    // console.log("--- [AUTH] checkAuth middleware initiated. ---");

    if (!req.headers.cookie) {
        return res.status(401).send('No cookies provided for authentication.');
    }
    
    try {
        const learnworldsApiUrl = `${LEARNWORLDS_SCHOOL_URL}/api/v2/users/me`;
        const response = await axios.get(learnworldsApiUrl, {
            headers: {
                'Cookie': req.headers.cookie, 
                'Lw-Client': LEARNWORLDS_CLIENT_ID
            }
        });
        
        if (response.status === 200) {
            req.user = response.data; 
            return next(); 
        }

        res.status(401).send('Authentication check failed with unexpected status.');

    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).send('User not authenticated by Learnworlds.');
        } else if (error.request) {
            return res.status(504).send('Gateway Timeout: No response from authentication server.');
        } else {
            return res.status(500).send('Internal Server Error while preparing auth request.');
        }
    }
};

// --- API ROUTES ---
app.get('/api/data', checkAuth, (req, res) => {
    res.json({
        questions: allQuestions,
        flashcards: allFlashcards
    });
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`--- Server started successfully on port ${PORT} ---`);
    console.log(`[CONFIG] Frontend URL configured for CORS: ${FRONTEND_URL}`);
    console.log(`[CONFIG] Learnworlds School URL for API calls: ${LEARNWORLDS_SCHOOL_URL}`);
    console.log(`[CONFIG] Learnworlds Client ID is loaded.`);
});

