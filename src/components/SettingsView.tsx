import { Edit2, Plus, Trash2, X, Image as ImageIcon, Upload, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Category, Product } from '../types';
import { ImageCropper } from './ImageCropper';

interface SettingsViewProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onLogout: () => void;
}

export function SettingsView({ products, onUpdateProducts, onLogout }: SettingsViewProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('Espetinhos');
  const [showCropper, setShowCropper] = useState(false);

  const categories: Category[] = ['Espetinhos', 'Acompanhamentos', 'Bebidas'];

  const handleSave = (product: Product) => {
    if (isAdding) {
      onUpdateProducts([...products, { ...product, id: Date.now().toString() }]);
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

  return (
    <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto relative">
      <div className="mb-6 pt-2 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Cardápio</h2>
          <p className="text-zinc-400 text-sm mt-1">Gerencie produtos e preços</p>
        </div>
        <button
          onClick={onLogout}
          className="p-3 bg-red-500/10 text-red-500 rounded-2xl active:bg-red-500/20 transition-all flex items-center gap-2 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full font-medium text-sm transition-all ${activeCategory === category
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
          >
            {category}
          </button>
        ))}
      </div>

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
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            Nenhum produto nesta categoria.
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          setIsAdding(true);
          setEditingProduct({ id: '', name: '', category: activeCategory, price: 0, imageUrl: '' });
        }}
        className="absolute bottom-6 right-6 bg-amber-500 text-zinc-950 p-4 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Edit/Add Modal */}
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
                  value={editingProduct?.category || 'Espetinhos'}
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
    </div>
  );
}
