// Gestion des fiches de pointage et du cahier
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du cahier de pointage.");
});

function enregistrerPointage(staffId, statut) {
    const donnees = {
        id: staffId,
        statut: statut,
        timestamp: new Date().toISOString()
    };
    
    // Sauvegarde locale ou envoi API
    localStorage.setItem('pointage_' + staffId, JSON.stringify(donnees));
    
    // ANCIEN CODE : Les alertes et notifications LINE ont été supprimées d'ici
    // ex: sendLineAlert(donnees); // SUPPRIMÉ
    
    console.log("Pointage enregistré localement pour : " + staffId);
    return true;
}
