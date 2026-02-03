import { useState, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { statsApi, type StatItem } from '@/services/api';
import { Card, Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const generateId = () => `stat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface StatFormData {
  id: string;
  value: string;
  prefix: string;
  suffix: string;
  descriptionUz: string;
  descriptionEn: string;
}

const emptyForm: StatFormData = {
  id: '',
  value: '',
  prefix: '',
  suffix: '',
  descriptionUz: '',
  descriptionEn: '',
};

export const StatsSettings = memo(function StatsSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StatFormData>(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: statsApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (stat: StatItem) => statsApi.upsert(stat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(editingId ? 'Statistika yangilandi' : "Statistika qo'shildi");
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: statsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success("Statistika o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newStats: StatItem[]) => statsApi.reorder(newStats.map(s => s.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
  });

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((stat: StatItem) => {
    setFormData({
      id: stat.id,
      value: stat.value.toString(),
      prefix: stat.prefix,
      suffix: stat.suffix,
      descriptionUz: stat.descriptionUz,
      descriptionEn: stat.descriptionEn,
    });
    setEditingId(stat.id);
    setIsAdding(false);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({ ...emptyForm, id: generateId() });
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.value || !formData.descriptionUz) {
      toast.error("Raqam va O'zbekcha tavsif majburiy");
      return;
    }

    const stat: StatItem = {
      id: formData.id || generateId(),
      value: parseInt(formData.value, 10),
      prefix: formData.prefix,
      suffix: formData.suffix,
      descriptionUz: formData.descriptionUz,
      descriptionEn: formData.descriptionEn || formData.descriptionUz,
      order: editingId 
        ? stats.find(s => s.id === editingId)?.order || stats.length + 1
        : stats.length + 1,
    };

    saveMutation.mutate(stat);
  }, [formData, editingId, stats, saveMutation]);

  const handleReorder = useCallback((newOrder: StatItem[]) => {
    reorderMutation.mutate(newOrder);
  }, [reorderMutation]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Statistika sozlamalari</h1>
          <p className="text-dark-500 mt-1">Bosh sahifadagi statistika cardlarini boshqaring</p>
        </div>
        {!isAdding && !editingId && (
          <Button onClick={handleAdd} leftIcon={<span>+</span>}>
            Yangi qo'shish
          </Button>
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
                {editingId ? 'Statistikani tahrirlash' : 'Yangi statistika'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Raqam <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="input"
                      placeholder="10000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Prefix</label>
                    <input
                      type="text"
                      value={formData.prefix}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                      className="input"
                      placeholder="$, +, yoki bo'sh"
                    />
                    <p className="text-xs text-dark-400 mt-1">Masalan: $, +</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Suffix</label>
                    <input
                      type="text"
                      value={formData.suffix}
                      onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                      className="input"
                      placeholder="GRANT, %"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Tavsif (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.descriptionUz}
                      onChange={(e) => setFormData({ ...formData, descriptionUz: e.target.value })}
                      className="input"
                      placeholder="Grant yutib olish imkoniyati"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Tavsif (Inglizcha)</label>
                    <input
                      type="text"
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      className="input"
                      placeholder="Opportunity to win a grant"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-dark-50 rounded-xl p-4">
                  <p className="text-sm text-dark-500 mb-2">Ko'rinishi:</p>
                  <div className="bg-white rounded-xl p-5 shadow-soft max-w-xs">
                    <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                      {formData.prefix}{formData.value || '0'} {formData.suffix}
                    </p>
                    <div className="w-10 h-1 bg-accent-500 rounded my-2"></div>
                    <p className="text-sm text-dark-600">{formData.descriptionUz || 'Tavsif...'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" isLoading={saveMutation.isPending}>
                    Saqlash
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Bekor qilish
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats List */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Mavjud statistikalar ({stats.length})</h2>
        
        {stats.length === 0 ? (
          <EmptyState
            title="Statistika yo'q"
            description="Hozircha statistika mavjud emas. Yangi qo'shing!"
            icon={
              <svg className="w-16 h-16 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            action={<Button onClick={handleAdd}>Yangi qo'shish</Button>}
          />
        ) : (
          <Reorder.Group axis="y" values={stats} onReorder={handleReorder} className="space-y-3">
            {stats.map((stat) => (
              <Reorder.Item
                key={stat.id}
                value={stat}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  editingId === stat.id ? 'border-primary-500 bg-primary-50' : 'border-dark-100 bg-white hover:border-dark-200'
                }`}
              >
                {/* Drag handle */}
                <div className="text-dark-300 hover:text-dark-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                  </svg>
                </div>

                {/* Stat preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-dark-50 to-dark-100 rounded-xl px-4 py-2">
                      <p className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent whitespace-nowrap">
                        {stat.prefix}{stat.value.toLocaleString()} {stat.suffix}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-900 truncate">🇺🇿 {stat.descriptionUz}</p>
                      <p className="text-sm text-dark-500 truncate">🇬🇧 {stat.descriptionEn}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(stat)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Tahrirlash
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteId(stat.id)}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Statistikani o'chirish"
        message="Ushbu statistikani o'chirmoqchimisiz?"
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
