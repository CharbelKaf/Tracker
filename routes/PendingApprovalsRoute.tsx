import React from 'react';
import PendingApprovals from '../components/PendingApprovals';
import type { Assignment, Equipment, Model, Category, User, ValidationActor } from '../types';

interface PendingApprovalsRouteProps {
  assignments: Assignment[];
  equipment: Equipment[];
  models: Model[];
  categories: Category[];
  users: User[];
  currentUser: User;
  onApprove: (assignmentId: string, actor?: ValidationActor) => void;
  onReject: (assignmentId: string, reason: string) => void;
  onBack: () => void;
}

const PendingApprovalsRoute: React.FC<PendingApprovalsRouteProps> = ({
  assignments,
  equipment,
  models,
  categories,
  users,
  currentUser,
  onApprove,
  onReject,
  onBack,
}) => {
  return (
    <PendingApprovals
      assignments={assignments}
      equipment={equipment}
      models={models}
      categories={categories}
      users={users}
      currentUser={currentUser}
      onApprove={onApprove}
      onReject={onReject}
      onBack={onBack}
    />
  );
};

export default PendingApprovalsRoute;
