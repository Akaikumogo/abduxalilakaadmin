import { useState, memo, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { tipsApi, type TipItem } from '@/services/api';
import { Card, Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const generateId = () => `tip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface TipFormData {
  id: string;
  youtubeUrl: string;
  titleUz: string;
  titleEn: string;
}

const emptyForm: TipFormData = {
  id: '',
  youtubeUrl: '',
  titleUz: '',
  titleEn: '',
};

const getYoutubeThumbnail = (url: string) => {
  let videoId = '';
  if (url.includes('/embed/')) {
    videoId = url.split('/embed/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
};

export const TipsSettings = memo(function TipsSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TipFormData>(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tips = [], isLoading } = useQuery({
    queryKey: ['tips'],
    queryFn: tipsApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (tip: TipItem) => tipsApi.upsert(tip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] });
      toast.success(editingId ? 'Maslahat yangilandi' : "Maslahat qo'shildi");
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: tipsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] });
      toast.success("Maslahat o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newTips: TipItem[]) => tipsApi.reorder(newTips.map(t => t.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tips'] }),
  });

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((tip: TipItem) => {
    setFormData({
      id: tip.id,
      youtubeUrl: tip.youtubeUrl,
      titleUz: tip.titleUz,
      titleEn: tip.titleEn,
    });
    setEditingId(tip.id);
    setIsAdding(false);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({ ...emptyForm, id: generateId() });
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.youtubeUrl || !formData.titleUz) {
      toast.error("YouTube URL va O'zbekcha sarlavha majburiy");
      return;
    }

    const tip: TipItem = {
      id: formData.id || generateId(),
      youtubeUrl: formData.youtubeUrl,
      titleUz: formData.titleUz,
      titleEn: formData.titleEn || formData.titleUz,
      order: editingId 
        ? tips.find(t => t.id === editingId)?.order || tips.length + 1
        : tips.length + 1,
    };

    saveMutation.mutate(tip);
  }, [formData, editingId, tips, saveMutation]);

  const previewThumbnail = useMemo(() => getYoutubeThumbnail(formData.youtubeUrl), [formData.youtubeUrl]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Video maslahatlar</h1>
          <p className="text-dark-500 mt-1">"Useful tips for studying abroad" bo'limini boshqaring</p>
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
                {editingId ? 'Maslahatni tahrirlash' : 'Yangi maslahat'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    YouTube URL <span className="text-accent-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    className="input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
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
                      placeholder="IELTS siz yevropada o'qish"
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
                      placeholder="Study in Europe without IELTS"
                    />
                  </div>
                </div>

                {/* Preview */}
                {previewThumbnail && (
                  <div className="bg-dark-50 rounded-xl p-4">
                    <p className="text-sm text-dark-500 mb-2">Ko'rinishi:</p>
                    <div className="flex items-center gap-4">
                      <img
                        src={previewThumbnail}
                        alt="Preview"
                        className="w-32 h-20 object-cover rounded-lg shadow-soft"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-dark-900">{formData.titleUz || 'Sarlavha'}</h4>
                        <p className="text-sm text-dark-500">{formData.titleEn}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" isLoading={saveMutation.isPending}>Saqlash</Button>
                  <Button type="button" variant="secondary" onClick={resetForm}>Bekor qilish</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips List */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Mavjud maslahatlar ({tips.length})</h2>
        
        {tips.length === 0 ? (
          <EmptyState
            title="Maslahatlar yo'q"
            description="Hozircha maslahat mavjud emas."
            action={<Button onClick={handleAdd}>Yangi qo'shish</Button>}
          />
        ) : (
          <Reorder.Group axis="y" values={tips} onReorder={(newOrder) => reorderMutation.mutate(newOrder)} className="space-y-3">
            {tips.map((tip, index) => (
              <Reorder.Item
                key={tip.id}
                value={tip}
                className={`p-4 rounded-xl border flex items-center gap-4 cursor-grab active:cursor-grabbing ${
                  editingId === tip.id ? 'border-primary-500 bg-primary-50' : 'border-dark-100 bg-white hover:border-dark-200'
                }`}
              >
                <div className="text-dark-300 hover:text-dark-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                  </svg>
                </div>

                <span className="text-xs font-bold text-dark-400">#{index + 1}</span>

                <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-dark-100 shrink-0">
                  <img
                    src={getYoutubeThumbnail(tip.youtubeUrl)}
                    alt={tip.titleUz}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-dark-900/30 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-dark-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-900 truncate">{tip.titleUz}</h3>
                  <p className="text-sm text-dark-500 truncate">{tip.titleEn}</p>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(tip)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Tahrirlash
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteId(tip.id)}
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
        title="Maslahatni o'chirish"
        message="Ushbu maslahatni o'chirmoqchimisiz?"
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
