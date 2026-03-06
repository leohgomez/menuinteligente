import { Edit2, Plus, Trash2, X, Image as ImageIcon, Upload, LogOut, Save, Settings, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Category, Product } from '../types';
import { ImageCropper } from './ImageCropper';

interface SettingsViewProps {
  products: Product[];
  categories: string[];
  onUpdateProducts: (products: Product[]) => void;
  onAddCategory: (name: string) => Promise<boolean>;
  onEditCategory: (oldName: string, newName: string) => Promise<boolean>;
  onDeleteCategory: (name: string) => Promise<boolean>;
  onLogout: () => void;
  userRole: string | null;
  storeLogoUrl: string | null;
}

export function SettingsView({ products, categories, onUpdateProducts, onAddCategory, onEditCategory, onDeleteCategory, onLogout, userRole, storeLogoUrl }: SettingsViewProps) {
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>(categories[0] || '');
  const [showCropper, setShowCropper] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<{ oldName: string; newName: string } | null>(null);
  const [savingCategoryEdit, setSavingCategoryEdit] = useState(false);

  // Update active category if it no longer exists
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleSave = (product: Product) => {
    if (isAdding) {
      onUpdateProducts([...products, { ...product, id: crypto.randomUUID() }]);
    } else {
      onUpdateProducts(products.map((p) => (p.id === product.id ? product : p)));
    }
    setEditingProduct(null);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      onUpdateProducts(products.filter((p) => p.id !== id));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredProducts = products.filter((p) => p.category === activeCategory);

  const handleCropComplete = (croppedImage: string) => {
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, imageUrl: croppedImage });
    }
    setShowCropper(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    const success = await onAddCategory(newCategoryName.trim());
    if (success) {
      setActiveCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
    setAddingCategory(false);
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const categoryProducts = products.filter(p => p.category === categoryName);
    if (categoryProducts.length > 0) {
      alert(`Não é possível excluir a categoria "${categoryName}" pois ela possui ${categoryProducts.length} produto(s). Remova os produtos primeiro.`);
      return;
    }
    if (confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
      await onDeleteCategory(categoryName);
    }
    setCategoryMenuOpen(null);
  };

  const handleEditCategorySave = async () => {
    if (!editingCategoryName || !editingCategoryName.newName.trim()) return;
    if (editingCategoryName.newName.trim() === editingCategoryName.oldName) {
      setEditingCategoryName(null);
      return;
    }
    setSavingCategoryEdit(true);
    const success = await onEditCategory(editingCategoryName.oldName, editingCategoryName.newName.trim());
    if (success) {
      if (activeCategory === editingCategoryName.oldName) {
        setActiveCategory(editingCategoryName.newName.trim());
      }
      setEditingCategoryName(null);
    }
    setSavingCategoryEdit(false);
  };

  return (
    <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto relative">
      <div className="mb-6 pt-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Settings className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Cardápio</h2>
            <p className="text-zinc-400 text-sm mt-0.5">Gerencie seus produtos e preços</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-3 bg-red-500/10 text-red-500 rounded-2xl active:bg-red-500/20 transition-all flex items-center gap-2 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar items-center">
        {categories.map((category) => (
          <div key={category} className="relative shrink-0">
            <button
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full font-medium text-sm transition-all flex items-center gap-1.5 ${activeCategory === category
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
            >
              {category}
              {isManagerOrAdmin && activeCategory === category && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoryMenuOpen(categoryMenuOpen === category ? null : category);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-black/20 transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </button>
            {/* Category actions popup */}
            {categoryMenuOpen === category && isManagerOrAdmin && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-1 min-w-[180px]">
                <button
                  onClick={() => {
                    setEditingCategoryName({ oldName: category, newName: category });
                    setCategoryMenuOpen(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-zinc-300 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
                >
                  <Edit2 className="w-4 h-4 text-amber-500" />
                  Renomear categoria
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir categoria
                </button>
              </div>
            )}
          </div>
        ))}
        {isManagerOrAdmin && (
          <button
            onClick={() => setShowAddCategory(true)}
            className="shrink-0 w-10 h-10 rounded-full bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all"
            title="Adicionar categoria"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dismiss menu on click outside */}
      {categoryMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setCategoryMenuOpen(null)} />
      )}

      <div className="flex flex-col gap-3 pb-24">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-4">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover shrink-0 bg-zinc-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-zinc-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium mb-1 truncate">{product.name}</h4>
              <span className="text-amber-500 font-medium text-sm">{formatCurrency(product.price)}</span>
            </div>
            {isManagerOrAdmin && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="p-2.5 text-zinc-400 bg-zinc-800 rounded-xl active:bg-zinc-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2.5 text-red-400 bg-red-500/10 rounded-xl active:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            Nenhum produto nesta categoria.
          </div>
        )}
      </div>

      {/* FAB */}
      {isManagerOrAdmin && (
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingProduct({ id: '', name: '', category: activeCategory, price: 0, imageUrl: '' });
          }}
          className="absolute bottom-6 right-6 bg-amber-500 text-zinc-950 p-4 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Edit/Add Product Modal */}
      {(editingProduct || isAdding) && !showCropper && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setEditingProduct(null);
            setIsAdding(false);
          }} />
          <div className="bg-zinc-900 rounded-t-3xl w-full max-h-[90vh] flex flex-col relative z-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
            </div>

            <div className="px-6 pb-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-white">
                {isAdding ? 'Novo Produto' : 'Editar Produto'}
              </h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsAdding(false);
                }}
                className="p-2 bg-zinc-800 text-zinc-400 rounded-full active:bg-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingProduct) handleSave(editingProduct);
              }}
              className="p-6 space-y-5 overflow-y-auto pb-safe"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={editingProduct?.name || ''}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev ? { ...prev, name: e.target.value } : null)
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Espetinho de Carne"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Categoria</label>
                <select
                  value={editingProduct?.category || categories[0] || ''}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, category: e.target.value as Category } : null
                    )
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500 appearance-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editingProduct?.price || ''}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null
                    )
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Imagem do Produto</label>

                <div className="flex items-center gap-4">
                  {editingProduct?.imageUrl ? (
                    <div className="relative group">
                      <img
                        src={editingProduct.imageUrl}
                        alt="Preview"
                        className="w-20 h-20 rounded-xl object-cover bg-zinc-800 border border-zinc-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditingProduct(prev => prev ? { ...prev, imageUrl: '' } : null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-zinc-600" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCropper(true)}
                    className="flex-1 bg-zinc-800 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
                  >
                    <Upload className="w-5 h-5" />
                    {editingProduct?.imageUrl ? 'Trocar Imagem' : 'Enviar Imagem'}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-lg text-zinc-950 bg-amber-500 active:bg-amber-400"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropper
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => {
            setShowAddCategory(false);
            setNewCategoryName('');
          }} />
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Nova Categoria</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nome da Categoria</label>
                <input
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ex: Porções"
                  className="w-full bg-zinc-800 border-none rounded-xl py-3.5 px-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500 transition-all outline-none font-bold"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addingCategory || !newCategoryName.trim()}
                className="w-full bg-amber-500 text-zinc-950 font-bold py-3.5 rounded-xl transition-all active:bg-amber-400 disabled:opacity-50"
              >
                {addingCategory ? 'Criando...' : 'CRIAR CATEGORIA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategoryName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingCategoryName(null)} />
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Renomear Categoria</h3>
              </div>
              <button
                onClick={() => setEditingCategoryName(null)}
                className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleEditCategorySave(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Novo Nome</label>
                <input
                  autoFocus
                  value={editingCategoryName.newName}
                  onChange={(e) => setEditingCategoryName({ ...editingCategoryName, newName: e.target.value })}
                  placeholder="Nome da categoria"
                  className="w-full bg-zinc-800 border-none rounded-xl py-3.5 px-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500 transition-all outline-none font-bold"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={savingCategoryEdit || !editingCategoryName.newName.trim()}
                className="w-full bg-amber-500 text-zinc-950 font-bold py-3.5 rounded-xl transition-all active:bg-amber-400 disabled:opacity-50"
              >
                {savingCategoryEdit ? 'Salvando...' : 'SALVAR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
