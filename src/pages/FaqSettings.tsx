import { useState, useEffect, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { faqApi, type FaqSettings as FaqSettingsType, type FaqItem } from '@/services/api';
import { Card, Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const generateId = () => `faq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface FaqFormData {
  id: string;
  questionUz: string;
  questionEn: string;
  answerUz: string;
  answerEn: string;
}

const emptyForm: FaqFormData = {
  id: '',
  questionUz: '',
  questionEn: '',
  answerUz: '',
  answerEn: '',
};

export const FaqSettings = memo(function FaqSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FaqFormData>(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [settings, setSettings] = useState<FaqSettingsType>({
    titleUz: '',
    titleEn: '',
    subtitleUz: '',
    subtitleEn: '',
    phoneNumber: '',
  });

  const { data: settingsData } = useQuery({
    queryKey: ['faqSettings'],
    queryFn: faqApi.getSettings,
  });

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: faqApi.getAll,
  });

  useEffect(() => {
    if (settingsData) setSettings(settingsData);
  }, [settingsData]);

  const saveSettingsMutation = useMutation({
    mutationFn: faqApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqSettings'] });
      toast.success('Sozlamalar saqlandi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const saveFaqMutation = useMutation({
    mutationFn: (faq: FaqItem) => faqApi.upsert(faq),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success(editingId ? 'Savol yangilandi' : "Savol qo'shildi");
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: faqApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success("Savol o'chirildi");
      setDeleteId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newFaqs: FaqItem[]) => faqApi.reorder(newFaqs.map(f => f.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faqs'] }),
  });

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((faq: FaqItem) => {
    setFormData({
      id: faq.id,
      questionUz: faq.questionUz,
      questionEn: faq.questionEn,
      answerUz: faq.answerUz,
      answerEn: faq.answerEn,
    });
    setEditingId(faq.id);
    setIsAdding(false);
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({ ...emptyForm, id: generateId() });
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleSaveSettings = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.titleUz) {
      toast.error("O'zbekcha sarlavha majburiy");
      return;
    }
    saveSettingsMutation.mutate(settings);
  }, [settings, saveSettingsMutation]);

  const handleSubmitFaq = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionUz || !formData.answerUz) {
      toast.error("Savol va javob (O'zbekcha) majburiy");
      return;
    }

    const faq: FaqItem = {
      id: formData.id || generateId(),
      questionUz: formData.questionUz,
      questionEn: formData.questionEn || formData.questionUz,
      answerUz: formData.answerUz,
      answerEn: formData.answerEn || formData.answerUz,
      order: editingId 
        ? faqs.find(f => f.id === editingId)?.order || faqs.length + 1
        : faqs.length + 1,
    };

    saveFaqMutation.mutate(faq);
  }, [formData, editingId, faqs, saveFaqMutation]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-dark-900">FAQ sozlamalari</h1>
        <p className="text-dark-500 mt-1">"Ko'p beriladigan savollar" bo'limini boshqaring</p>
      </motion.div>

      {/* Section Settings */}
      <Card delay={0.1}>
        <h2 className="text-lg font-semibold mb-4">Bo'lim sozlamalari</h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Sarlavha (O'zbekcha) <span className="text-accent-500">*</span>
              </label>
              <input
                type="text"
                value={settings.titleUz}
                onChange={(e) => setSettings({ ...settings, titleUz: e.target.value })}
                className="input"
                placeholder="Ko'p beriladigan savollar"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Sarlavha (Inglizcha)</label>
              <input
                type="text"
                value={settings.titleEn}
                onChange={(e) => setSettings({ ...settings, titleEn: e.target.value })}
                className="input"
                placeholder="Frequently Asked Questions"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Quyi sarlavha (O'zbekcha)</label>
              <input
                type="text"
                value={settings.subtitleUz}
                onChange={(e) => setSettings({ ...settings, subtitleUz: e.target.value })}
                className="input"
                placeholder="O'z savolingizga javob topolmadingizmi?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Quyi sarlavha (Inglizcha)</label>
              <input
                type="text"
                value={settings.subtitleEn}
                onChange={(e) => setSettings({ ...settings, subtitleEn: e.target.value })}
                className="input"
                placeholder="Didn't find your answer?"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Telefon raqam</label>
            <input
              type="text"
              value={settings.phoneNumber}
              onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
              className="input"
              placeholder="+998712000811"
            />
          </div>

          <Button type="submit" isLoading={saveSettingsMutation.isPending}>Saqlash</Button>
        </form>
      </Card>

      {/* FAQ Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-between items-center"
      >
        <h2 className="text-lg font-semibold">Savollar ({faqs.length})</h2>
        {!isAdding && !editingId && (
          <Button onClick={handleAdd} leftIcon={<span>+</span>}>Yangi savol</Button>
        )}
      </motion.div>

      {/* FAQ Form */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold mb-4">
                {editingId ? 'Savolni tahrirlash' : 'Yangi savol'}
              </h3>
              <form onSubmit={handleSubmitFaq} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Savol (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.questionUz}
                      onChange={(e) => setFormData({ ...formData, questionUz: e.target.value })}
                      className="input"
                      placeholder="O'qish davrida ishlash mumkinmi?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Savol (Inglizcha)</label>
                    <input
                      type="text"
                      value={formData.questionEn}
                      onChange={(e) => setFormData({ ...formData, questionEn: e.target.value })}
                      className="input"
                      placeholder="Is it possible to work during studies?"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Javob (O'zbekcha) <span className="text-accent-500">*</span>
                    </label>
                    <textarea
                      value={formData.answerUz}
                      onChange={(e) => setFormData({ ...formData, answerUz: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Ha, talabalar ko'plab mamlakatlarda..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Javob (Inglizcha)</label>
                    <textarea
                      value={formData.answerEn}
                      onChange={(e) => setFormData({ ...formData, answerEn: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Yes, students have the opportunity..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" isLoading={saveFaqMutation.isPending}>Saqlash</Button>
                  <Button type="button" variant="secondary" onClick={resetForm}>Bekor qilish</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ List */}
      <Card>
        {faqs.length === 0 ? (
          <EmptyState
            title="Savollar yo'q"
            description="Hozircha savol mavjud emas."
            action={<Button onClick={handleAdd}>Yangi qo'shish</Button>}
          />
        ) : (
          <Reorder.Group axis="y" values={faqs} onReorder={(newOrder) => reorderMutation.mutate(newOrder)} className="space-y-3">
            {faqs.map((faq, index) => (
              <Reorder.Item
                key={faq.id}
                value={faq}
                className={`p-4 rounded-xl border cursor-grab active:cursor-grabbing ${
                  editingId === faq.id ? 'border-primary-500 bg-primary-50' : 'border-dark-100 bg-white hover:border-dark-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="text-dark-300 hover:text-dark-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-dark-400">{index + 1}</span>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-dark-900 mb-1">{faq.questionUz}</h4>
                    <p className="text-sm text-dark-600 line-clamp-2">{faq.answerUz}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(faq)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Tahrirlash
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteId(faq.id)}
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
        title="Savolni o'chirish"
        message="Ushbu savolni o'chirmoqchimisiz?"
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
