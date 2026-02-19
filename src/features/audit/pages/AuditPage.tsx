import React from 'react';
import { ViewType } from '../../../types';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { PhysicalAuditView } from '../components/PhysicalAuditView';

interface AuditPageProps {
    onViewChange: (view: ViewType) => void;
}

const AuditPage: React.FC<AuditPageProps> = ({ onViewChange }) => {
    return (
        <PageContainer>
            <PageHeader
                title={GLOSSARY.AUDIT}
                subtitle="Lancez et suivez les campagnes d'audit de votre parc informatique."
                breadcrumb={GLOSSARY.AUDIT}
            />

            <div className="min-h-[500px]">
                <PhysicalAuditView onViewChange={onViewChange} />
            </div>
        </PageContainer>
    );
};

export default AuditPage;
