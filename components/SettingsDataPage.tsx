import React from 'react';
import SettingsInfoPage from './SettingsInfoPage';

const SettingsDataPage: React.FC = () => {
    return (
        <SettingsInfoPage
            title="Données et stockage"
            subtitle="Contrôlez où et comment vos données sont stockées"
            sections={[
                {
                    title: "Données synchronisées",
                    content: (
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Inventaire : équipements, modèles, catégories et historique des mouvements.</li>
                            <li>Utilisateurs : profils, rôles, authentification multi-facteurs.</li>
                            <li>Audit : journaux d'activité, approbations, signatures.</li>
                        </ul>
                    ),
                },
                {
                    title: "Politique de conservation",
                    content: (
                        <div className="space-y-2">
                            <p><strong>Temps réel :</strong> synchronisation instantanée entre devices et sites distants.</p>
                            <p><strong>Archivage :</strong> données inactives déplacées vers un stockage à froid après 12 mois.</p>
                            <p><strong>Suppression :</strong> les données supprimées sont purgées définitivement après 30 jours.</p>
                        </div>
                    ),
                },
                {
                    title: "Chiffrement",
                    content: (
                        <div className="space-y-2">
                            <p>Les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256).</p>
                            <p>Les clés privées sont gérées via un HSM régional certifié (niveau FIPS 140-2).</p>
                        </div>
                    ),
                },
            ]}
        />
    );
};

export default SettingsDataPage;
