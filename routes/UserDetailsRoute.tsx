import React from 'react';
import { useParams } from 'react-router-dom';
import UserDetails from '../components/UserDetails';
import type {
  Assignment,
  Equipment,
  User,
  Model,
  Category,
  EditHistoryEntry
} from '../types';

interface UserDetailsRouteProps {
  assignments: Assignment[];
  equipment: Equipment[];
  users: User[];
  models: Model[];
  categories: Category[];
  currentUser: User;
  onBack: () => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  onManagePin: (userId: string) => void;
  onRegisterFingerprint: (userId: string) => void;
  editHistory: EditHistoryEntry[];
}

const UserDetailsRoute: React.FC<UserDetailsRouteProps> = ({
  assignments,
  equipment,
  users,
  models,
  categories,
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onManagePin,
  onRegisterFingerprint,
  editHistory
}) => {
  const { id } = useParams<{ id: string }>();
  const user = users.find((u) => u.id === id);

  if (!user) {
    return <h2>Utilisateur non trouvé</h2>;
  }

  const manager = users.find((u) => u.id === user.managerId);

  return (
    <UserDetails
      user={user}
      assignments={assignments}
      equipment={equipment}
      models={models}
      categories={categories}
      manager={manager}
      allUsers={users}
      editHistory={editHistory}
      onBack={onBack}
      currentUser={currentUser}
      onEdit={onEdit}
      onDelete={onDelete}
      onManagePin={onManagePin}
      onRegisterFingerprint={onRegisterFingerprint}
    />
  );
};

export default UserDetailsRoute;
