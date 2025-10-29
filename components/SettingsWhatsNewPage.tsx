import React from 'react';
import SettingsInfoPage from './SettingsInfoPage';

const SettingsWhatsNewPage: React.FC = () => {
    return (
        <SettingsInfoPage
            title="Nouveautés"
            subtitle="Dernières améliorations de Neemba Tracker"
            sections={[
                {
                    title: "Version 2.0",
                    content: (
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Refonte complète du tableau de bord avec widgets dynamiques.</li>
                            <li>Assignment Wizard unifié avec UI cohérente et validation multi-niveaux.</li>
                            <li>Design system documenté avec couleurs, icônes et composants standardisés.</li>
                        </ul>
                    ),
                },
                {
                    title: "Productivité",
                    content: (
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Recherche intelligente (SmartSearch) sur Inventaire, Utilisateurs et Wizard.</li>
                            <li>Actions rapides sur mobile avec PageHeaderActions et FAB harmonisés.</li>
                            <li>Sheets paramétrables pour les paramètres et menus contextuels.</li>
                        </ul>
                    ),
                },
                {
                    title: "À venir",
                    content: (
                        <p>
                            Support de la maintenance prédictive, intégration IoT et reporting avancé piloté par IA sont en cours de développement.
                        </p>
                    ),
                },
            ]}
        />
    );
};

export default SettingsWhatsNewPage;
