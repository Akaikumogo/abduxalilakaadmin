import { useState, useRef, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { heroApi, getImageUrl, type HeroSettings as HeroSettingsType } from '@/services/api';
import { Card, ConfirmDialog } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

interface ImageUploadCardProps {
  language: 'uz' | 'en';
  label: string;
  description: string;
  imageUrl: string | null;
  required?: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
  isUploading: boolean;
  isDeleting: boolean;
}

const ImageUploadCard = memo(function ImageUploadCard({
  language,
  label,
  description,
  imageUrl,
  required = false,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
}: ImageUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  }, [onUpload]);

  const fullImageUrl = getImageUrl(imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-dark-900">
            {label}
            {required && <span className="text-accent-500 ml-1">*</span>}
          </h3>
          <p className="text-sm text-dark-500">{description}</p>
        </div>
        <span className={`badge ${language === 'uz' ? 'bg-primary-100 text-primary-700' : 'bg-success-100 text-success-600'}`}>
          {language.toUpperCase()}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {fullImageUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden bg-dark-100 group"
          >
            <img
              src={fullImageUrl}
              alt={`Hero ${language}`}
              className="w-full h-48 object-cover"
            />
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm flex items-center justify-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-primary btn-sm"
              >
                O'zgartirish
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                disabled={isDeleting || (required && language === 'uz')}
                className="btn-danger btn-sm"
              >
                O'chirish
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-dark-200 hover:border-dark-300 bg-dark-50/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-3">
              <motion.div
                animate={{ y: dragActive ? -5 : 0 }}
                className="mx-auto w-14 h-14 bg-dark-100 rounded-xl flex items-center justify-center"
              >
                <svg className="w-7 h-7 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </motion.div>
              <p className="text-dark-600">
                Rasmni shu yerga tashlang yoki{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-600 hover:underline font-medium"
                  disabled={isUploading}
                >
                  tanlang
                </button>
              </p>
              <p className="text-xs text-dark-400">
                JPEG, PNG yoki WebP. Maksimum 10MB.
              </p>
            </div>

            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full"
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </motion.div>
  );
});

export const HeroSettings = memo(function HeroSettings() {
  const queryClient = useQueryClient();
  const [uploadingLang, setUploadingLang] = useState<'uz' | 'en' | null>(null);
  const [deletingLang, setDeletingLang] = useState<'uz' | 'en' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<'uz' | 'en' | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['heroSettings'],
    queryFn: heroApi.getSettings,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, language }: { file: File; language: 'uz' | 'en' }) =>
      heroApi.uploadImage(file, language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heroSettings'] });
      toast.success('Rasm muvaffaqiyatli yuklandi');
      setUploadingLang(null);
    },
    onError: () => {
      toast.error('Rasmni yuklashda xatolik');
      setUploadingLang(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (language: 'uz' | 'en') => heroApi.deleteImage(language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heroSettings'] });
      toast.success("Rasm o'chirildi");
      setDeletingLang(null);
      setConfirmDelete(null);
    },
    onError: () => {
      toast.error("Rasmni o'chirishda xatolik");
      setDeletingLang(null);
    },
  });

  const handleUpload = useCallback((language: 'uz' | 'en') => (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Faqat JPEG, PNG yoki WebP formatdagi rasmlar ruxsat etilgan');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Rasm hajmi 10MB dan oshmasligi kerak');
      return;
    }

    setUploadingLang(language);
    uploadMutation.mutate({ file, language });
  }, [uploadMutation]);

  const handleDelete = useCallback((language: 'uz' | 'en') => () => {
    if (language === 'uz' && !settings?.imageEn) {
      toast.error("O'zbekcha rasm majburiy. Avval inglizcha rasmni yuklang.");
      return;
    }
    setConfirmDelete(language);
  }, [settings?.imageEn]);

  const confirmDeleteAction = useCallback(() => {
    if (confirmDelete) {
      setDeletingLang(confirmDelete);
      deleteMutation.mutate(confirmDelete);
    }
  }, [confirmDelete, deleteMutation]);

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-dark-900">Hero rasmi sozlamalari</h1>
        <p className="text-dark-500 mt-1">
          Bosh sahifadagi hero bo'limining rasmlarini boshqaring
        </p>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl p-4"
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0 p-2 bg-primary-100 rounded-lg">
            <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-primary-800">
            <p className="font-medium mb-1">Til bo'yicha rasmlar:</p>
            <ul className="space-y-1 list-disc list-inside text-primary-700">
              <li><strong>O'zbekcha rasm</strong> - majburiy, barcha holatlar uchun asosiy rasm</li>
              <li><strong>Inglizcha rasm</strong> - ixtiyoriy, faqat ingliz tilida ko'rsatiladi</li>
              <li>Agar inglizcha rasm yo'q bo'lsa, o'zbekcha rasm ko'rsatiladi</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Image Upload Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <ImageUploadCard
          language="uz"
          label="O'zbekcha rasm"
          description="Asosiy hero rasmi (majburiy)"
          imageUrl={settings?.imageUz || null}
          required
          onUpload={handleUpload('uz')}
          onDelete={handleDelete('uz')}
          isUploading={uploadingLang === 'uz'}
          isDeleting={deletingLang === 'uz'}
        />

        <ImageUploadCard
          language="en"
          label="Inglizcha rasm"
          description="Ingliz tili uchun alohida rasm (ixtiyoriy)"
          imageUrl={settings?.imageEn || null}
          onUpload={handleUpload('en')}
          onDelete={handleDelete('en')}
          isUploading={uploadingLang === 'en'}
          isDeleting={deletingLang === 'en'}
        />
      </div>

      {/* Last updated info */}
      {settings?.updatedAt && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-dark-500"
        >
          Oxirgi yangilash: {new Date(settings.updatedAt).toLocaleString('uz-UZ')}
        </motion.p>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Rasmni o'chirish"
        message={`${confirmDelete === 'uz' ? "O'zbekcha" : 'Inglizcha'} rasmni o'chirmoqchimisiz?`}
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
