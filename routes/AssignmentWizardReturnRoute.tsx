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

interface AssignmentWizardReturnRouteProps {
  equipment: Equipment[];
  users: User[];
  currentUser: User;
  models: Model[];
  categories: Category[];
  assignments: Assignment[];
  onSubmit: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  onBack: () => void;
}

const AssignmentWizardReturnRoute: React.FC<AssignmentWizardReturnRouteProps> = ({
  equipment,
  users,
  currentUser,
  models,
  categories,
  assignments,
  onSubmit,
  onBack,
}) => {
  const { equipmentId } = useParams<{ equipmentId: string }>();

  return (
    <AssignmentWizard
      action={FormAction.RETURN}
      initialEquipmentId={equipmentId}
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

export default AssignmentWizardReturnRoute;
