import { useState, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { stepsApi, type StepItem } from '@/services/api';
import { Card, Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const generateId = () => `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface StepFormData {
  id: string;
  titleUz: string;
  titleEn: string;
  descriptionUz: string;
  descriptionEn: string;
}

const emptyForm: StepFormData = {
  id: '',
  titleUz: '',
  titleEn: '',
  descriptionUz: '',
  descriptionEn: '',
};

export const StepsSettings = memo(function StepsSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StepFormData>(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['steps'],
    queryFn: stepsApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (step: StepItem) => stepsApi.upsert(step),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      toast.success(editingId ? 'Qadam yangilandi' : "Qadam qo'shildi");
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: stepsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      toast.success("Qadam o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newSteps: StepItem[]) => stepsApi.reorder(newSteps.map(s => s.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['steps'] }),
  });

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((step: StepItem) => {
    setFormData({
      id: step.id,
      titleUz: step.titleUz,
      titleEn: step.titleEn,
      descriptionUz: step.descriptionUz,
      descriptionEn: step.descriptionEn,
    });
    setEditingId(step.id);
    setIsAdding(false);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({ ...emptyForm, id: generateId() });
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titleUz || !formData.descriptionUz) {
      toast.error("O'zbekcha sarlavha va tavsif majburiy");
      return;
    }

    const step: StepItem = {
      id: formData.id || generateId(),
      titleUz: formData.titleUz,
      titleEn: formData.titleEn || formData.titleUz,
      descriptionUz: formData.descriptionUz,
      descriptionEn: formData.descriptionEn || formData.descriptionUz,
      order: editingId 
        ? steps.find(s => s.id === editingId)?.order || steps.length + 1
        : steps.length + 1,
    };

    saveMutation.mutate(step);
  }, [formData, editingId, steps, saveMutation]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Qadamlar sozlamalari</h1>
          <p className="text-dark-500 mt-1">"How do we work?" bo'limini boshqaring</p>
        </div>
        {!isAdding && !editingId && (
          <Button onClick={handleAdd} leftIcon={<span>+</span>}>Yangi qo'shish</Button>
        )}
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl p-4"
      >
        <p className="text-sm text-primary-800">
          <strong>Eslatma:</strong> Qadamlar frontendda zigzag tartibda ko'rinadi: 1-chap, 2-o'ng, 3-chap, 4-o'ng...
        </p>
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
                {editingId ? 'Qadamni tahrirlash' : 'Yangi qadam'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="Murojaat qilasiz"
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
                      placeholder="Contact Us"
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
                      className="input min-h-[100px]"
                      placeholder="Tavsif matni..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Tavsif (Inglizcha)</label>
                    <textarea
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Description text..."
                    />
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

      {/* Steps List */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Mavjud qadamlar ({steps.length})</h2>
        
        {steps.length === 0 ? (
          <EmptyState
            title="Qadamlar yo'q"
            description="Hozircha qadam mavjud emas."
            action={<Button onClick={handleAdd}>Yangi qo'shish</Button>}
          />
        ) : (
          <Reorder.Group axis="y" values={steps} onReorder={(newOrder) => reorderMutation.mutate(newOrder)} className="space-y-4">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;
              return (
                <Reorder.Item
                  key={step.id}
                  value={step}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-grab active:cursor-grabbing ${
                    editingId === step.id ? 'border-primary-500 bg-primary-50' : 'border-dark-100 bg-white hover:border-dark-200'
                  }`}
                >
                  <div className="text-dark-300 hover:text-dark-500 pt-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                    </svg>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isLeft ? 'bg-primary-100 text-primary-700' : 'bg-success-100 text-success-600'
                      }`}>
                        {isLeft ? '← Chap' : "O'ng →"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-accent-600 mb-1">{step.titleUz}</h3>
                    <p className="text-sm text-dark-600 line-clamp-2">{step.descriptionUz}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(step)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Tahrirlash
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteId(step.id)}
                      className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                    >
                      O'chirish
                    </motion.button>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Qadamni o'chirish"
        message="Ushbu qadamni o'chirmoqchimisiz?"
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
