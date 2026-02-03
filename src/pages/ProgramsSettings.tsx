import { useState, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { programsApi, getImageUrl, type ProgramItem } from '@/services/api';
import { Card, Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const generateId = () => `program_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface ProgramFormData {
  id: string;
  titleUz: string;
  titleEn: string;
  description1Uz: string;
  description1En: string;
  description2Uz: string;
  description2En: string;
}

const emptyForm: ProgramFormData = {
  id: '',
  titleUz: '',
  titleEn: '',
  description1Uz: '',
  description1En: '',
  description2Uz: '',
  description2En: '',
};

export const ProgramsSettings = memo(function ProgramsSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProgramFormData>(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<{ id: string; lang: 'uz' | 'en' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: programsApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (program: Omit<ProgramItem, 'imageUz' | 'imageEn'>) => programsApi.upsert(program),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success(editingId ? 'Dastur yangilandi' : "Dastur qo'shildi");
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file, language }: { id: string; file: File; language: 'uz' | 'en' }) =>
      programsApi.uploadImage(id, file, language),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success(`${variables.language === 'uz' ? "O'zbekcha" : 'Inglizcha'} rasm yuklandi`);
      setUploadingImage(null);
    },
    onError: () => {
      toast.error('Rasm yuklashda xatolik');
      setUploadingImage(null);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ id, language }: { id: string; language: 'uz' | 'en' }) =>
      programsApi.deleteImage(id, language),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success(`${variables.language === 'uz' ? "O'zbekcha" : 'Inglizcha'} rasm o'chirildi`);
    },
    onError: () => toast.error("Rasmni o'chirishda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: programsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success("Dastur o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newPrograms: ProgramItem[]) => programsApi.reorder(newPrograms.map(p => p.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((program: ProgramItem) => {
    setFormData({
      id: program.id,
      titleUz: program.titleUz,
      titleEn: program.titleEn,
      description1Uz: program.description1Uz,
      description1En: program.description1En,
      description2Uz: program.description2Uz,
      description2En: program.description2En,
    });
    setEditingId(program.id);
    setIsAdding(false);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({ ...emptyForm, id: generateId() });
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titleUz || !formData.description1Uz) {
      toast.error("O'zbekcha sarlavha va tavsif 1 majburiy");
      return;
    }

    const program = {
      id: formData.id || generateId(),
      titleUz: formData.titleUz,
      titleEn: formData.titleEn || formData.titleUz,
      description1Uz: formData.description1Uz,
      description1En: formData.description1En || formData.description1Uz,
      description2Uz: formData.description2Uz,
      description2En: formData.description2En || formData.description2Uz,
      order: editingId 
        ? programs.find(p => p.id === editingId)?.order || programs.length + 1
        : programs.length + 1,
    };

    saveMutation.mutate(program);
  }, [formData, editingId, programs, saveMutation]);

  const handleImageUpload = useCallback((programId: string, language: 'uz' | 'en', file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Rasm hajmi 10MB dan oshmasligi kerak');
      return;
    }
    setUploadingImage({ id: programId, lang: language });
    uploadMutation.mutate({ id: programId, file, language });
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
          <h1 className="text-2xl font-bold text-dark-900">Dasturlar sozlamalari</h1>
          <p className="text-dark-500 mt-1">"Our Programs" bo'limidagi dasturlarni boshqaring</p>
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
                {editingId ? 'Dasturni tahrirlash' : 'Yangi dastur'}
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
                      placeholder="Til tayyorlov kurslari"
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
                      placeholder="Language Preparation Courses"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Tavsif 1 (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <textarea
                      value={formData.description1Uz}
                      onChange={(e) => setFormData({ ...formData, description1Uz: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Asosiy tavsif matni..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Tavsif 1 (Inglizcha)</label>
                    <textarea
                      value={formData.description1En}
                      onChange={(e) => setFormData({ ...formData, description1En: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Main description text..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Tavsif 2 (O'zbekcha)</label>
                    <textarea
                      value={formData.description2Uz}
                      onChange={(e) => setFormData({ ...formData, description2Uz: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Qo'shimcha matn..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Tavsif 2 (Inglizcha)</label>
                    <textarea
                      value={formData.description2En}
                      onChange={(e) => setFormData({ ...formData, description2En: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Additional text..."
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

      {/* Programs List */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Mavjud dasturlar ({programs.length})</h2>
        
        {programs.length === 0 ? (
          <EmptyState
            title="Dasturlar yo'q"
            description="Hozircha dastur mavjud emas."
            action={<Button onClick={handleAdd}>Yangi qo'shish</Button>}
          />
        ) : (
          <Reorder.Group axis="y" values={programs} onReorder={(newOrder) => reorderMutation.mutate(newOrder)} className="space-y-4">
            {programs.map((program, index) => (
              <Reorder.Item
                key={program.id}
                value={program}
                className={`p-4 rounded-xl border cursor-grab active:cursor-grabbing ${
                  editingId === program.id ? 'border-primary-500 bg-primary-50' : 'border-dark-100 bg-white hover:border-dark-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-dark-300 hover:text-dark-500 pt-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-dark-400">#{index + 1}</span>
                      <h3 className="font-semibold text-dark-900">{program.titleUz}</h3>
                    </div>
                    <p className="text-sm text-dark-500 line-clamp-2 mb-3">{program.description1Uz}</p>

                    {/* Images */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* UZ Image */}
                      <div>
                        <p className="text-xs font-medium text-dark-500 mb-1">🇺🇿 Rasm</p>
                        {program.imageUz ? (
                          <div className="relative group rounded-lg overflow-hidden">
                            <img
                              src={getImageUrl(program.imageUz) || ''}
                              alt="UZ"
                              className="w-full h-20 object-cover"
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteImageMutation.mutate({ id: program.id, language: 'uz' })}
                              className="absolute top-1 right-1 bg-accent-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </motion.button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center h-20 border-2 border-dashed border-dark-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(program.id, 'uz', file);
                              }}
                            />
                            <span className="text-xs text-dark-400">
                              {uploadingImage?.id === program.id && uploadingImage.lang === 'uz' ? '...' : '+ Rasm'}
                            </span>
                          </label>
                        )}
                      </div>

                      {/* EN Image */}
                      <div>
                        <p className="text-xs font-medium text-dark-500 mb-1">🇬🇧 Rasm</p>
                        {program.imageEn ? (
                          <div className="relative group rounded-lg overflow-hidden">
                            <img
                              src={getImageUrl(program.imageEn) || ''}
                              alt="EN"
                              className="w-full h-20 object-cover"
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteImageMutation.mutate({ id: program.id, language: 'en' })}
                              className="absolute top-1 right-1 bg-accent-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </motion.button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center h-20 border-2 border-dashed border-dark-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(program.id, 'en', file);
                              }}
                            />
                            <span className="text-xs text-dark-400">
                              {uploadingImage?.id === program.id && uploadingImage.lang === 'en' ? '...' : '+ Rasm'}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(program)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Tahrirlash
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteId(program.id)}
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
        title="Dasturni o'chirish"
        message="Ushbu dasturni va uning barcha rasmlarini o'chirmoqchimisiz?"
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
