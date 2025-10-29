import React from 'react';
import { useParams } from 'react-router-dom';
import AuditReport from '../components/AuditReport';
import type {
  AuditSession,
  Equipment,
  Model,
  Site,
  Department,
  Country
} from '../types';

interface AuditReportRouteProps {
  auditSessions: AuditSession[];
  equipment: Equipment[];
  models: Model[];
  sites: Site[];
  departments: Department[];
  countries: Country[];
  onBack: () => void;
}

const AuditReportRoute: React.FC<AuditReportRouteProps> = ({
  auditSessions,
  equipment,
  models,
  sites,
  departments,
  countries,
  onBack,
}) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const session = auditSessions.find((s) => s.id === sessionId);

  if (!session) {
    return <h2>Session d'audit non trouvée</h2>;
  }

  return (
    <AuditReport
      session={session}
      equipment={equipment}
      models={models}
      sites={sites}
      departments={departments}
      countries={countries}
      onBack={onBack}
    />
  );
};

export default AuditReportRoute;
