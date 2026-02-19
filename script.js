// ----------------------------------------------------------
// 📌 Fonction utilitaire : normaliser le texte
// ----------------------------------------------------------
function normaliserTexte(texte) {
    return texte
        .toLowerCase()
        .normalize("NFD")                 // enlever les accents
        .replace(/[\u0300-\u036f]/g, "")  // enlever les diacritiques
        .replace(/[^a-z0-9 ]/g, " ")      // enlever ponctuation
        .replace(/\s+/g, " ")             // nettoyer espaces
        .trim();
}

// ----------------------------------------------------------
// 📌 Calcul de similarité Jaccard
// ----------------------------------------------------------
function similariteJaccard(a, b) {
    const setA = new Set(a.split(" "));
    const setB = new Set(b.split(" "));

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
}

// ----------------------------------------------------------
// 📌 Score "cosine-like" simple (compte les mots communs pondérés)
// ----------------------------------------------------------
function similariteCosineLike(tokensA, tokensB) {
    let score = 0;
    tokensA.forEach(motA => {
        if (tokensB.includes(motA)) score += 1;
    });
    return score / Math.sqrt(tokensA.length * tokensB.length);
}

// ----------------------------------------------------------
// 📌 MEILLEURE FONCTION DE RECHERCHE
// ----------------------------------------------------------
function trouverReponse(questionUser) {
    const questionNorm = normaliserTexte(questionUser);
    const tokensUser = questionNorm.split(" ");

    let meilleurScore = 0;
    let meilleureReponse = "Je n'ai pas trouvé de réponse à cette question.";

    faqData.forEach(item => {
        // Normalisation des données
        const texte = normaliserTexte(
            item.question + " " + item.mots_cles.join(" ")
        );

        const tokensFAQ = texte.split(" ");

        // ---- Calculs combinés ----
        const scoreJaccard = similariteJaccard(questionNorm, texte);
        const scoreCosine = similariteCosineLike(tokensUser, tokensFAQ);

        // Bonus si un mot-clé EXACT correspond
        let bonusKeywords = 0;
        item.mots_cles.forEach(kw => {
            if (questionNorm.includes(normaliserTexte(kw))) {
                bonusKeywords += 0.5;
            }
        });

        // Score final pondéré
        const scoreFinal =
            scoreJaccard * 0.4 +
            scoreCosine * 0.5 +
            bonusKeywords * 0.3;

        // On garde la meilleure réponse
        if (scoreFinal > meilleurScore) {
            meilleurScore = scoreFinal;
            meilleureReponse = item.reponse;
        }
    });

    return meilleureReponse;
}
