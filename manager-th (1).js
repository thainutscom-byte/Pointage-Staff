// Script de gestion des horaires et pointages pour le manager
document.addEventListener('DOMContentLoaded', () => {
    initialiserGestionPointage();
});

function initialiserGestionPointage() {
    console.log("Module manager chargé. Prêt à valider les heures.");
}

function validerHeuresFinDeJournee(staffId) {
    console.log("Validation des heures pour le membre du staff ID : " + staffId);
    
    // NOTE : Toute fonction d'envoi vers l'API LINE Notify a été définitivement supprimée.
    // Les logs de présence sont uniquement traités en interne ou via base de données.
    
    alert("Heures validées avec succès (sans envoi d'alerte externe).");
}
