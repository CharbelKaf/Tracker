import React from 'react';
import { useParams } from 'react-router-dom';
import AuditSessionComponent from '../components/AuditSession';
import type {
  AuditSession,
  Equipment,
  Model,
  Category,
  Site,
  Department,
  Country
} from '../types';

interface AuditSessionRouteProps {
  auditSessions: AuditSession[];
  equipment: Equipment[];
  models: Model[];
  categories: Category[];
  sites: Site[];
  departments: Department[];
  countries: Country[];
  onBack: () => void;
  onUpdateEquipment: (equipment: Partial<Equipment>) => void;
  dispatch: React.Dispatch<any>;
}

const AuditSessionRoute: React.FC<AuditSessionRouteProps> = ({
  auditSessions,
  equipment,
  models,
  categories,
  sites,
  departments,
  countries,
  onBack,
  onUpdateEquipment,
  dispatch,
}) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const session = auditSessions.find((s) => s.id === sessionId);

  if (!session) {
    return <h2>Session d'audit non trouvée</h2>;
  }

  return (
    <AuditSessionComponent
      session={session}
      allEquipment={equipment}
      allModels={models}
      allCategories={categories}
      sites={sites}
      departments={departments}
      countries={countries}
      onBack={onBack}
      onUpdateEquipment={onUpdateEquipment}
      dispatch={dispatch}
    />
  );
};

export default AuditSessionRoute;
