import { useState, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { testimonialsApi, getImageUrl, type TestimonialItem } from '@/services/api';
import { Card, Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const generateId = () => `testimonial_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface TestimonialFormData {
  id: string;
  textUz: string;
  textEn: string;
  nameUz: string;
  nameEn: string;
  universityUz: string;
  universityEn: string;
}

const emptyForm: TestimonialFormData = {
  id: '',
  textUz: '',
  textEn: '',
  nameUz: '',
  nameEn: '',
  universityUz: '',
  universityEn: '',
};

export const TestimonialsSettings = memo(function TestimonialsSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TestimonialFormData>(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: testimonialsApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (testimonial: Omit<TestimonialItem, 'avatar'>) => testimonialsApi.upsert(testimonial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success(editingId ? 'Izoh yangilandi' : "Izoh qo'shildi");
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      testimonialsApi.uploadAvatar(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Avatar yuklandi');
      setUploadingAvatar(null);
    },
    onError: () => {
      toast.error('Avatar yuklashda xatolik');
      setUploadingAvatar(null);
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: testimonialsApi.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success("Avatar o'chirildi");
    },
    onError: () => toast.error("Avatarni o'chirishda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: testimonialsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success("Izoh o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newItems: TestimonialItem[]) => testimonialsApi.reorder(newItems.map(t => t.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['testimonials'] }),
  });

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((testimonial: TestimonialItem) => {
    setFormData({
      id: testimonial.id,
      textUz: testimonial.textUz,
      textEn: testimonial.textEn,
      nameUz: testimonial.nameUz,
      nameEn: testimonial.nameEn,
      universityUz: testimonial.universityUz,
      universityEn: testimonial.universityEn,
    });
    setEditingId(testimonial.id);
    setIsAdding(false);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({ ...emptyForm, id: generateId() });
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.textUz || !formData.nameUz) {
      toast.error("O'zbekcha izoh matni va ism majburiy");
      return;
    }

    const testimonial = {
      id: formData.id || generateId(),
      textUz: formData.textUz,
      textEn: formData.textEn || formData.textUz,
      nameUz: formData.nameUz,
      nameEn: formData.nameEn || formData.nameUz,
      universityUz: formData.universityUz,
      universityEn: formData.universityEn || formData.universityUz,
      order: editingId 
        ? testimonials.find(t => t.id === editingId)?.order || testimonials.length + 1
        : testimonials.length + 1,
    };

    saveMutation.mutate(testimonial);
  }, [formData, editingId, testimonials, saveMutation]);

  const handleAvatarUpload = useCallback((testimonialId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Rasm hajmi 5MB dan oshmasligi kerak');
      return;
    }
    setUploadingAvatar(testimonialId);
    uploadMutation.mutate({ id: testimonialId, file });
  }, [uploadMutation]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Izohlar sozlamalari</h1>
          <p className="text-dark-500 mt-1">Talabalar izohlarini (testimonials) boshqaring</p>
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
                {editingId ? 'Izohni tahrirlash' : 'Yangi izoh'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Izoh matni (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <textarea
                      value={formData.textUz}
                      onChange={(e) => setFormData({ ...formData, textUz: e.target.value })}
                      className="input min-h-[120px]"
                      placeholder="Salom hammaga. Men Muhammadali..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Izoh matni (Inglizcha)</label>
                    <textarea
                      value={formData.textEn}
                      onChange={(e) => setFormData({ ...formData, textEn: e.target.value })}
                      className="input min-h-[120px]"
                      placeholder="Hello everyone. I am Muhammadali..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Ism (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nameUz}
                      onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                      className="input"
                      placeholder="Muhammadali Sattorov"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Ism (Inglizcha)</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      className="input"
                      placeholder="Muhammadali Sattorov"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Universitet (O'zbekcha)</label>
                    <input
                      type="text"
                      value={formData.universityUz}
                      onChange={(e) => setFormData({ ...formData, universityUz: e.target.value })}
                      className="input"
                      placeholder="NJUPT University, Xitoy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Universitet (Inglizcha)</label>
                    <input
                      type="text"
                      value={formData.universityEn}
                      onChange={(e) => setFormData({ ...formData, universityEn: e.target.value })}
                      className="input"
                      placeholder="NJUPT University, China"
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

      {/* Testimonials List */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Mavjud izohlar ({testimonials.length})</h2>
        
        {testimonials.length === 0 ? (
          <EmptyState
            title="Izohlar yo'q"
            description="Hozircha izoh mavjud emas."
            action={<Button onClick={handleAdd}>Yangi qo'shish</Button>}
          />
        ) : (
          <Reorder.Group axis="y" values={testimonials} onReorder={(newOrder) => reorderMutation.mutate(newOrder)} className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <Reorder.Item
                key={testimonial.id}
                value={testimonial}
                className={`p-4 rounded-xl border cursor-grab active:cursor-grabbing ${
                  editingId === testimonial.id ? 'border-primary-500 bg-primary-50' : 'border-dark-100 bg-white hover:border-dark-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag handle + index */}
                  <div className="flex flex-col items-center gap-1 pt-2">
                    <div className="text-dark-300 hover:text-dark-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-dark-400">{index + 1}</span>
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {testimonial.avatar ? (
                      <div className="relative group">
                        <img
                          src={getImageUrl(testimonial.avatar) || ''}
                          alt={testimonial.nameUz}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-dark-100"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteAvatarMutation.mutate(testimonial.id)}
                          className="absolute -top-1 -right-1 bg-accent-500 text-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ✕
                        </motion.button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 rounded-full bg-dark-100 border-2 border-dashed border-dark-200 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAvatarUpload(testimonial.id, file);
                          }}
                        />
                        {uploadingAvatar === testimonial.id ? (
                          <span className="text-xs text-dark-400">...</span>
                        ) : (
                          <span className="text-2xl text-dark-400">+</span>
                        )}
                      </label>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-dark-900">{testimonial.nameUz}</h3>
                      {testimonial.universityUz && (
                        <span className="text-xs text-dark-400">— {testimonial.universityUz}</span>
                      )}
                    </div>
                    <p className="text-sm text-dark-600 line-clamp-3">{testimonial.textUz}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(testimonial)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Tahrirlash
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteId(testimonial.id)}
                      className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                    >
                      O'chirish
                    </motion.button>
                  </div>
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
        title="Izohni o'chirish"
        message="Ushbu izohni o'chirmoqchimisiz?"
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
