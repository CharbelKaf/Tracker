import React from 'react';
import { useParams } from 'react-router-dom';
import ModelDetails from '../components/ModelDetails';
import type {
  Model,
  Category,
  Equipment,
  Assignment,
  User
} from '../types';

interface ModelDetailsRouteProps {
  models: Model[];
  categories: Category[];
  equipment: Equipment[];
  assignments: Assignment[];
  users: User[];
  currentUser: User;
  onBack: () => void;
  onEdit: (modelId: string) => void;
  onDelete: (modelId: string) => void;
  onSelectEquipment: (equipmentId: string) => void;
}

const ModelDetailsRoute: React.FC<ModelDetailsRouteProps> = ({
  models,
  categories,
  equipment,
  assignments,
  users,
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onSelectEquipment
}) => {
  const { id } = useParams<{ id: string }>();
  const model = models.find((m) => m.id === id);

  if (!model) {
    return <h2>Modèle non trouvé</h2>;
  }

  const category = categories.find((c) => c.id === model.categoryId);
  const equipmentItems = equipment.filter((item) => item.modelId === model.id);

  if (!category) {
    return <h2>Catégorie non trouvée</h2>;
  }

  return (
    <ModelDetails
      model={model}
      category={category}
      equipmentItems={equipmentItems}
      assignments={assignments}
      users={users}
      currentUser={currentUser}
      onBack={onBack}
      onEdit={onEdit}
      onDelete={onDelete}
      onSelectEquipment={onSelectEquipment}
    />
  );
};

export default ModelDetailsRoute;
