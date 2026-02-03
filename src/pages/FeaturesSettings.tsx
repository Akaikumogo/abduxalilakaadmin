import { useState, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { featuresApi, type FeatureItem } from '@/services/api';
import { Card, Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const generateId = () => `feature_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const EMOJI_OPTIONS = [
  '🎓', '👔', '🤝', '🔄', '✅', '🌟', '💼', '📚', '🎯', '💡',
  '🏆', '🌍', '📈', '🔒', '⭐', '💪', '🎉', '📋', '🔑', '❤️',
];

interface FeatureFormData {
  id: string;
  icon: string;
  titleUz: string;
  titleEn: string;
  descriptionUz: string;
  descriptionEn: string;
}

const emptyForm: FeatureFormData = {
  id: '',
  icon: '🎓',
  titleUz: '',
  titleEn: '',
  descriptionUz: '',
  descriptionEn: '',
};

export const FeaturesSettings = memo(function FeaturesSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeatureFormData>(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: features = [], isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: featuresApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (feature: FeatureItem) => featuresApi.upsert(feature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success(editingId ? 'Xususiyat yangilandi' : "Xususiyat qo'shildi");
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: featuresApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success("Xususiyat o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newFeatures: FeatureItem[]) => featuresApi.reorder(newFeatures.map(f => f.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['features'] }),
  });

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((feature: FeatureItem) => {
    setFormData({
      id: feature.id,
      icon: feature.icon,
      titleUz: feature.titleUz,
      titleEn: feature.titleEn,
      descriptionUz: feature.descriptionUz,
      descriptionEn: feature.descriptionEn,
    });
    setEditingId(feature.id);
    setIsAdding(false);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({ ...emptyForm, id: generateId() });
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.icon || !formData.titleUz || !formData.descriptionUz) {
      toast.error("Icon, O'zbekcha sarlavha va tavsif majburiy");
      return;
    }

    const feature: FeatureItem = {
      id: formData.id || generateId(),
      icon: formData.icon,
      titleUz: formData.titleUz,
      titleEn: formData.titleEn || formData.titleUz,
      descriptionUz: formData.descriptionUz,
      descriptionEn: formData.descriptionEn || formData.descriptionUz,
      order: editingId 
        ? features.find(f => f.id === editingId)?.order || features.length + 1
        : features.length + 1,
    };

    saveMutation.mutate(feature);
  }, [formData, editingId, features, saveMutation]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Nega biz? sozlamalari</h1>
          <p className="text-dark-500 mt-1">"Why Buran Consulting?" bo'limini boshqaring</p>
        </div>
        {!isAdding && !editingId && (
          <Button onClick={handleAdd} leftIcon={<span>+</span>}>Yangi qo'shish</Button>
        )}
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? 'Xususiyatni tahrirlash' : 'Yangi xususiyat'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Icon selector */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Icon <span className="text-accent-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({ ...formData, icon: emoji })}
                        className={`w-11 h-11 text-xl rounded-xl border-2 transition-all ${
                          formData.icon === emoji 
                            ? 'border-primary-500 bg-primary-50 shadow-glow' 
                            : 'border-dark-200 hover:border-dark-300 bg-white'
                        }`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-500">Yoki boshqa emoji:</span>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="input w-20 text-center text-xl"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Sarlavha (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.titleUz}
                      onChange={(e) => setFormData({ ...formData, titleUz: e.target.value })}
                      className="input"
                      placeholder="Tajriba"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Sarlavha (Inglizcha)</label>
                    <input
                      type="text"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      className="input"
                      placeholder="Experience"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Tavsif (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <textarea
                      value={formData.descriptionUz}
                      onChange={(e) => setFormData({ ...formData, descriptionUz: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Uzoq yillik tajriba..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Tavsif (Inglizcha)</label>
                    <textarea
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Years of experience..."
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-dark-50 rounded-xl p-4">
                  <p className="text-sm text-dark-500 mb-2">Ko'rinishi:</p>
                  <div className="bg-white rounded-xl p-6 shadow-soft max-w-xs text-center">
                    <div className="text-4xl mb-3">{formData.icon}</div>
                    <h3 className="text-lg font-bold text-dark-900 mb-2">{formData.titleUz || 'Sarlavha'}</h3>
                    <p className="text-sm text-dark-600">{formData.descriptionUz || 'Tavsif...'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" isLoading={saveMutation.isPending}>Saqlash</Button>
                  <Button type="button" variant="secondary" onClick={resetForm}>Bekor qilish</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features List */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Mavjud xususiyatlar ({features.length})</h2>
        
        {features.length === 0 ? (
          <EmptyState
            title="Xususiyatlar yo'q"
            description="Hozircha xususiyat mavjud emas."
            action={<Button onClick={handleAdd}>Yangi qo'shish</Button>}
          />
        ) : (
          <Reorder.Group axis="y" values={features} onReorder={(newOrder) => reorderMutation.mutate(newOrder)} className="space-y-3">
            {features.map((feature) => (
              <Reorder.Item
                key={feature.id}
                value={feature}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-grab active:cursor-grabbing ${
                  editingId === feature.id ? 'border-primary-500 bg-primary-50' : 'border-dark-100 bg-white hover:border-dark-200'
                }`}
              >
                <div className="text-dark-300 hover:text-dark-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                  </svg>
                </div>

                <div className="text-3xl w-12 text-center">{feature.icon}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dark-900">{feature.titleUz}</h3>
                    {feature.titleEn && feature.titleEn !== feature.titleUz && (
                      <span className="text-sm text-dark-400">/ {feature.titleEn}</span>
                    )}
                  </div>
                  <p className="text-sm text-dark-500 truncate">{feature.descriptionUz}</p>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(feature)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Tahrirlash
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteId(feature.id)}
                    className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                  >
                    O'chirish
                  </motion.button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Xususiyatni o'chirish"
        message="Ushbu xususiyatni o'chirmoqchimisiz?"
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
