import React from 'react';
import PageHeader from './PageHeader';

interface SettingsInfoSection {
    title?: string;
    description?: string;
    content: React.ReactNode;
}

interface SettingsInfoPageProps {
    title: string;
    subtitle?: string;
    sections: SettingsInfoSection[];
}

const SettingsInfoPage: React.FC<SettingsInfoPageProps> = ({ title, subtitle, sections }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            <PageHeader title={title} subtitle={subtitle} onBack={() => window.history.back()} />
            <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {sections.map((section, index) => (
                    <section
                        key={section.title || index}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-3"
                    >
                        {section.title && (
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {section.title}
                            </h2>
                        )}
                        {section.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {section.description}
                            </p>
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                            {section.content}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
};

export default SettingsInfoPage;
