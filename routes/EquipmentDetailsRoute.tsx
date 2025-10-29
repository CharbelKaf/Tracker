import React from 'react';
import { useParams } from 'react-router-dom';
import EquipmentDetails from '../components/EquipmentDetails';
import type {
  Assignment,
  Equipment,
  User,
  Model,
  Category,
  EditHistoryEntry,
  Site,
  Department,
  ValidationActor
} from '../types';

interface EquipmentDetailsRouteProps {
  assignments: Assignment[];
  equipmentList: Equipment[];
  users: User[];
  currentUser: User;
  models: Model[];
  categories: Category[];
  editHistory: EditHistoryEntry[];
  sites: Site[];
  departments: Department[];
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string, actor?: ValidationActor) => void;
  onReject: (id: string, reason: string) => void;
}

const EquipmentDetailsRoute: React.FC<EquipmentDetailsRouteProps> = ({
  assignments,
  equipmentList,
  users,
  currentUser,
  models,
  categories,
  editHistory,
  sites,
  departments,
  onBack,
  onEdit,
  onDelete,
  onApprove,
  onReject
}) => {
  const { id } = useParams<{ id: string }>();
  const equipment = equipmentList.find((item) => item.id === id);

  if (!equipment) {
    return <h2>Équipement non trouvé</h2>;
  }

  const equipmentAssignments = assignments.filter((assignment) => assignment.equipmentId === equipment.id);

  return (
    <EquipmentDetails
      equipment={equipment}
      assignments={equipmentAssignments}
      users={users}
      currentUser={currentUser}
      models={models}
      categories={categories}
      editHistory={editHistory}
      sites={sites}
      departments={departments}
      onBack={onBack}
      onEdit={onEdit}
      onDelete={onDelete}
      onApprove={onApprove}
      onReject={onReject}
    />
  );
};

export default EquipmentDetailsRoute;
