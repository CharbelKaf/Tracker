import React from 'react';
import SettingsInfoPage from './SettingsInfoPage';

const SettingsNotificationsPage: React.FC = () => {
    return (
        <SettingsInfoPage
            title="Notifications"
            subtitle="Configurez comment et quand vous recevez les alertes"
            sections={[
                {
                    title: "Canaux de communication",
                    content: (
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Mobile push :</strong> alertes en temps réel sur l'état des équipements et les tâches assignées.</li>
                            <li><strong>Email :</strong> rapports quotidiens, synthèses hebdomadaires et alertes critiques.</li>
                            <li><strong>SMS :</strong> notifications urgentes pour les incidents de sécurité ou d'infrastructure.</li>
                        </ul>
                    ),
                },
                {
                    title: "Priorités par défaut",
                    content: (
                        <div className="space-y-2">
                            <p><strong>Critique :</strong> incidents de sécurité, pannes majeures, tentatives d'accès non autorisées.</p>
                            <p><strong>Important :</strong> demandes d'approbation, retards de maintenance, tickets en attente.</p>
                            <p><strong>Information :</strong> assignations confirmées, retours complétés, nouveaux équipements ajoutés.</p>
                        </div>
                    ),
                },
                {
                    title: "Astuce",
                    description: "Utilisez la page Gestion > Automations pour créer des règles personnalisées." ,
                    content: <p>Adaptez vos notifications par département, site ou catégorie d'équipement afin de réduire le bruit.</p>,
                },
            ]}
        />
    );
};

export default SettingsNotificationsPage;
