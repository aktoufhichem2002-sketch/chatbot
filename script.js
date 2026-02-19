// ----------------------------------------------------------
// Chargement du JSON
// ----------------------------------------------------------
let faqData = [];

async function chargerBase() {
    try {
        const res = await fetch("base_connaissances.json", { cache: "no-cache" });
        faqData = await res.json();

        ajouterMessage("bot", "Salut ! Je suis prêt. Pose-moi n'importe quelle question 😊");
    } catch (e) {
        console.error(e);
        ajouterMessage("bot", "Erreur : impossible de charger base_connaissances.json");
    }
}

// ----------------------------------------------------------
// Normalisation du texte
// ----------------------------------------------------------
function normaliserTexte(texte) {
    return texte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// ----------------------------------------------------------
// Similarité Jaccard
// ----------------------------------------------------------
function similariteJaccard(a, b) {
    const setA = new Set(a.split(" "));
    const setB = new Set(b.split(" "));

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
}

// ----------------------------------------------------------
// Similarité “cosine-like” (simple mais efficace)
// ----------------------------------------------------------
function similariteCosineLike(tokensA, tokensB) {
    let score = 0;
    tokensA.forEach(motA => {
        if (tokensB.includes(motA)) score++;
    });
    return score / Math.sqrt(tokensA.length * tokensB.length);
}

// ----------------------------------------------------------
// ⚡ Moteur de recherche ultime
// ----------------------------------------------------------
function trouverReponse(questionUser) {
    const questionNorm = normaliserTexte(questionUser);
    const tokensUser = questionNorm.split(" ");

    let meilleurScore = 0;
    let meilleureReponse = "Je n'ai pas trouvé de réponse à cette question.";

    faqData.forEach(item => {
        const texte = normaliserTexte(
            item.question + " " + item.motscles.join(" ")
        );

        const tokensFAQ = texte.split(" ");

        // Similarités
        const scoreJaccard = similariteJaccard(questionNorm, texte);
        const scoreCosine = similariteCosineLike(tokensUser, tokensFAQ);

        // Bonus mots-clés exacts
        let bonusKeywords = 0;
        item.motscles.forEach(kw => {
            if (questionNorm.includes(normaliserTexte(kw))) bonusKeywords += 0.5;
        });

        // Score final pondéré
        const scoreFinal =
            scoreJaccard * 0.4 +
            scoreCosine * 0.5 +
            bonusKeywords * 0.3;

        if (scoreFinal > meilleurScore) {
            meilleurScore = scoreFinal;
            meilleureReponse = item.reponse;
        }
    });

    return meilleureReponse;
}

// ----------------------------------------------------------
// Interface : ajout des messages
// ----------------------------------------------------------
function ajouterMessage(auteur, message) {
    const chatbox = document.getElementById("chatbox");
    const div = document.createElement("div");
    div.className = `msg ${auteur}`;
    div.textContent = message;
    chatbox.appendChild(div);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// ----------------------------------------------------------
// Gestion de l'envoi
// ----------------------------------------------------------
function envoyer() {
    const input = document.getElementById("userInput");
    const question = input.value.trim();
    if (question === "") return;

    ajouterMessage("user", question);
    input.value = "";

    const reponse = trouverReponse(question);
    ajouterMessage("bot", reponse);
}

// ----------------------------------------------------------
// Événements UI
// ----------------------------------------------------------
document.getElementById("sendBtn").addEventListener("click", envoyer);
document.getElementById("userInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") envoyer();
});

// ----------------------------------------------------------
// Démarrage
// ----------------------------------------------------------
ajouterMessage("bot", "Chargement de la base…");
chargerBase();
