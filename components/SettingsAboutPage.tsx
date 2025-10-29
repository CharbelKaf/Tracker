import React from 'react';
import SettingsInfoPage from './SettingsInfoPage';

const SettingsAboutPage: React.FC = () => {
    return (
        <SettingsInfoPage
            title="À propos de Neemba Tracker"
            subtitle="Version 2.0 — Plateforme de gestion d'équipements"
            sections={[
                {
                    title: "Notre mission",
                    description: "Simplifier la gestion des équipements et améliorer la traçabilité des actifs dans les organisations africaines.",
                    content: (
                        <p>
                            Neemba Tracker est une solution de suivi des équipements et des ressources humaines conçue pour offrir une expérience fluide
                            sur desktop et mobile. Notre vision est de créer un écosystème unifié qui relie inventaire, maintenance, ressources humaines et
                            analyse des données.
                        </p>
                    ),
                },
                {
                    title: "Fonctionnalités clés",
                    content: (
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Gestion complète du cycle de vie des équipements (assignation, retour, maintenance).</li>
                            <li>Workflows d'approbation multi-rôles et audit trail détaillé.</li>
                            <li>Monitoring en temps réel avec dashboards interactifs.</li>
                            <li>Support des politiques BYOD, enregistrement biométrique et authentification forte.</li>
                        </ul>
                    ),
                },
                {
                    title: "Équipe produit",
                    content: (
                        <div className="space-y-2">
                            <p><strong>Produit :</strong> Neemba Tracker Core Team</p>
                            <p><strong>UX Research & Design :</strong> Studio Neemba</p>
                            <p><strong>Développement :</strong> Windsurf Engineering (Silicon Valley) & Neemba Labs</p>
                            <p><strong>Support :</strong> support@neemba.africa</p>
                        </div>
                    ),
                },
            ]}
        />
    );
};

export default SettingsAboutPage;
