import React from 'react';
import { useParams } from 'react-router-dom';
import AssignmentWizard from '../components/AssignmentWizard';
import type {
  Assignment,
  Equipment,
  User,
  Model,
  Category
} from '../types';
import { FormAction } from '../types';

interface AssignmentWizardAssignRouteProps {
  equipment: Equipment[];
  users: User[];
  currentUser: User;
  models: Model[];
  categories: Category[];
  assignments: Assignment[];
  onSubmit: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  onBack: () => void;
}

const AssignmentWizardAssignRoute: React.FC<AssignmentWizardAssignRouteProps> = ({
  equipment,
  users,
  currentUser,
  models,
  categories,
  assignments,
  onSubmit,
  onBack,
}) => {
  const params = useParams<{ '*': string }>();
  let initialEquipmentId: string | undefined;
  let initialUserId: string | undefined;

  const splat = params['*'];
  if (splat) {
    const equipmentMatch = splat.match(/equipment\/([a-zA-Z0-9-]+)/);
    if (equipmentMatch) {
      initialEquipmentId = equipmentMatch[1];
    }
    const userMatch = splat.match(/user\/([a-zA-Z0-9-]+)/);
    if (userMatch) {
      initialUserId = userMatch[1];
    }
  }

  return (
    <AssignmentWizard
      action={FormAction.ASSIGN}
      initialEquipmentId={initialEquipmentId}
      initialUserId={initialUserId}
      equipment={equipment}
      users={users}
      currentUser={currentUser}
      models={models}
      categories={categories}
      assignments={assignments}
      onSubmit={onSubmit}
      onBack={onBack}
    />
  );
};

export default AssignmentWizardAssignRoute;
