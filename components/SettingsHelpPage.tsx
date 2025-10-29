import React from 'react';
import SettingsInfoPage from './SettingsInfoPage';

const SettingsHelpPage: React.FC = () => {
    return (
        <SettingsInfoPage
            title="Aide et support"
            subtitle="Ressources pour résoudre vos problèmes"
            sections={[
                {
                    title: "Centre d'aide",
                    content: (
                        <div className="space-y-2">
                            <p>Consultez la base de connaissances en ligne pour obtenir des guides détaillés, des FAQ et des tutoriels vidéo.</p>
                            <p>
                                Accédez-y depuis <strong>support.neemba.africa/help</strong>.
                            </p>
                        </div>
                    ),
                },
                {
                    title: "Support technique",
                    content: (
                        <div className="space-y-2">
                            <p>Email : <a href="mailto:support@neemba.africa" className="text-primary-600 dark:text-primary-300 underline">support@neemba.africa</a></p>
                            <p>Hotline : +221 70 123 45 67 (Lun-Ven 8h-18h UTC)</p>
                            <p>Slack : #neemba-support (Enterprise)</p>
                        </div>
                    ),
                },
                {
                    title: "Envoyer des commentaires",
                    content: (
                        <p>
                            Partagez vos idées directement depuis l'application. Nous analysons chaque suggestion pour améliorer votre expérience.
                        </p>
                    ),
                },
            ]}
        />
    );
};

export default SettingsHelpPage;
