import React from 'react';
import { useParams } from 'react-router-dom';
import CategoryDetails from '../components/CategoryDetails';
import type {
  Category,
  Model,
  Equipment,
  User
} from '../types';

interface CategoryDetailsRouteProps {
  categories: Category[];
  models: Model[];
  equipment: Equipment[];
  users: User[];
  currentUser: User;
  onBack: () => void;
  onEdit: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  onSelectEquipment: (equipmentId: string) => void;
  onSelectModel: (modelId: string) => void;
}

const CategoryDetailsRoute: React.FC<CategoryDetailsRouteProps> = ({
  categories,
  models,
  equipment,
  users,
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onSelectEquipment,
  onSelectModel
}) => {
  const { id } = useParams<{ id: string }>();
  const category = categories.find((c) => c.id === id);

  if (!category) {
    return <h2>Catégorie non trouvée</h2>;
  }

  const modelsInCategory = models.filter((model) => model.categoryId === category.id);
  const equipmentInCategory = equipment.filter((item) =>
    modelsInCategory.some((model) => model.id === item.modelId)
  );

  return (
    <CategoryDetails
      category={category}
      models={modelsInCategory}
      equipment={equipmentInCategory}
      users={users}
      currentUser={currentUser}
      onBack={onBack}
      onEdit={onEdit}
      onDelete={onDelete}
      onSelectEquipment={onSelectEquipment}
      onSelectModel={onSelectModel}
    />
  );
};

export default CategoryDetailsRoute;
