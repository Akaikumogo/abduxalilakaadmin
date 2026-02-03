import { useState, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { countriesApi, getImageUrl, type CountryItem } from '@/services/api';
import { Card, Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const generateId = () => `country_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface CountryFormData {
  id: string;
  nameUz: string;
  nameEn: string;
  bgText: string;
}

const emptyForm: CountryFormData = {
  id: '',
  nameUz: '',
  nameEn: '',
  bgText: '',
};

export const CountriesSettings = memo(function CountriesSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CountryFormData>(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<{ id: string; lang: 'uz' | 'en' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: countriesApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (country: Omit<CountryItem, 'imageUz' | 'imageEn'>) => countriesApi.upsert(country),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success(editingId ? 'Davlat yangilandi' : "Davlat qo'shildi");
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file, language }: { id: string; file: File; language: 'uz' | 'en' }) =>
      countriesApi.uploadImage(id, file, language),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
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
      countriesApi.deleteImage(id, language),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success(`${variables.language === 'uz' ? "O'zbekcha" : 'Inglizcha'} rasm o'chirildi`);
    },
    onError: () => toast.error("Rasmni o'chirishda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: countriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success("Davlat o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newCountries: CountryItem[]) => countriesApi.reorder(newCountries.map(c => c.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['countries'] }),
  });

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((country: CountryItem) => {
    setFormData({
      id: country.id,
      nameUz: country.nameUz,
      nameEn: country.nameEn,
      bgText: country.bgText,
    });
    setEditingId(country.id);
    setIsAdding(false);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({ ...emptyForm, id: generateId() });
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nameUz) {
      toast.error("O'zbekcha nom majburiy");
      return;
    }

    const country = {
      id: formData.id || generateId(),
      nameUz: formData.nameUz,
      nameEn: formData.nameEn || formData.nameUz,
      bgText: formData.bgText || (formData.nameEn || formData.nameUz).toUpperCase(),
      order: editingId 
        ? countries.find(c => c.id === editingId)?.order || countries.length + 1
        : countries.length + 1,
    };

    saveMutation.mutate(country);
  }, [formData, editingId, countries, saveMutation]);

  const handleImageUpload = useCallback((countryId: string, language: 'uz' | 'en', file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Rasm hajmi 10MB dan oshmasligi kerak');
      return;
    }
    setUploadingImage({ id: countryId, lang: language });
    uploadMutation.mutate({ id: countryId, file, language });
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
          <h1 className="text-2xl font-bold text-dark-900">Davlatlar sozlamalari</h1>
          <p className="text-dark-500 mt-1">"Countries We Send To Study" bo'limini boshqaring</p>
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
                {editingId ? 'Davlatni tahrirlash' : 'Yangi davlat'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Nomi (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nameUz}
                      onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                      className="input"
                      placeholder="Germaniya"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Nomi (Inglizcha)</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      className="input"
                      placeholder="Germany"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Fon matni</label>
                  <input
                    type="text"
                    value={formData.bgText}
                    onChange={(e) => setFormData({ ...formData, bgText: e.target.value })}
                    className="input"
                    placeholder="GERMANY"
                  />
                  <p className="text-xs text-dark-400 mt-1">Rasmning orqasida ko'rinadigan katta matn</p>
                </div>

                {/* Preview */}
                <div className="bg-dark-50 rounded-xl p-4">
                  <p className="text-sm text-dark-500 mb-2">Ko'rinishi:</p>
                  <div className="relative w-48 h-32 bg-gradient-to-br from-dark-200 to-dark-300 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-2xl font-bold">
                      {formData.bgText || (formData.nameEn || formData.nameUz || 'COUNTRY').toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-900/70 to-transparent p-3">
                      <p className="text-white text-sm font-medium">{formData.nameUz || 'Davlat nomi'}</p>
                    </div>
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

      {/* Countries Grid */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Mavjud davlatlar ({countries.length})</h2>
        
        {countries.length === 0 ? (
          <EmptyState
            title="Davlatlar yo'q"
            description="Hozircha davlat mavjud emas."
            action={<Button onClick={handleAdd}>Yangi qo'shish</Button>}
          />
        ) : (
          <Reorder.Group
            axis="x"
            values={countries}
            onReorder={(newOrder) => reorderMutation.mutate(newOrder)}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {countries.map((country, index) => (
              <Reorder.Item
                key={country.id}
                value={country}
                className={`relative rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                  editingId === country.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent hover:border-dark-200'
                }`}
              >
                {/* Country Card */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-dark-200 to-dark-300">
                  <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xl font-bold overflow-hidden">
                    {country.bgText}
                  </div>
                  
                  {country.imageUz ? (
                    <img
                      src={getImageUrl(country.imageUz) || ''}
                      alt={country.nameUz}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-dark-400 text-sm">Rasm yo'q</span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-900/80 to-transparent p-3">
                    <p className="text-white text-sm font-medium truncate">{country.nameUz}</p>
                  </div>

                  <div className="absolute top-2 left-2 bg-dark-900/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-medium">
                    #{index + 1}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2 bg-white space-y-2">
                  <div className="grid grid-cols-2 gap-1">
                    <label className="cursor-pointer text-center py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 text-xs font-medium transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(country.id, 'uz', file);
                        }}
                      />
                      {uploadingImage?.id === country.id && uploadingImage.lang === 'uz' ? '...' : '🇺🇿 Rasm'}
                    </label>
                    <label className="cursor-pointer text-center py-1.5 bg-success-50 text-success-600 rounded-lg hover:bg-success-100 text-xs font-medium transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(country.id, 'en', file);
                        }}
                      />
                      {uploadingImage?.id === country.id && uploadingImage.lang === 'en' ? '...' : '🇬🇧 Rasm'}
                    </label>
                  </div>

                  <div className="flex gap-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEdit(country)}
                      className="flex-1 text-xs py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
                    >
                      Tahrirlash
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDeleteId(country.id)}
                      className="flex-1 text-xs py-1.5 text-accent-600 hover:bg-accent-50 rounded-lg font-medium transition-colors"
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
        title="Davlatni o'chirish"
        message="Ushbu davlatni va uning barcha rasmlarini o'chirmoqchimisiz?"
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
