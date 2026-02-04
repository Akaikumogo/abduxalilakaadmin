import { useState, useEffect, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { aboutApi, type AboutSettings as AboutSettingsType } from '@/services/api';
import { Card, Button } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

export const AboutSettings = memo(function AboutSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AboutSettingsType>({
    titleUz: '',
    titleEn: '',
    text1Uz: '',
    text1En: '',
    text2Uz: '',
    text2En: '',
    buttonTextUz: '',
    buttonTextEn: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['aboutSettings'],
    queryFn: aboutApi.get,
  });

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: aboutApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aboutSettings'] });
      toast.success('About sozlamalari saqlandi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleUz || !formData.text1Uz) {
      toast.error("Sarlavha va 1-matn (O'zbekcha) majburiy");
      return;
    }
    saveMutation.mutate(formData);
  }, [formData, saveMutation]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-dark-900">Biz haqimizda</h1>
        <p className="text-dark-500 mt-1">"Biz haqimizda" bo'limi matnlarini boshqaring</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card delay={0.1}>
          <h2 className="text-lg font-semibold mb-4">Sarlavha</h2>
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
                placeholder="Biz haqimizda"
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
                placeholder="About us"
              />
            </div>
          </div>
        </Card>

        <Card delay={0.15}>
          <h2 className="text-lg font-semibold mb-4">Matnlar</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Matn 1 (O'zbekcha) <span className="text-accent-500">*</span>
                </label>
                <textarea
                  value={formData.text1Uz}
                  onChange={(e) => setFormData({ ...formData, text1Uz: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Buran Consulting 2018 yil tashkil topgan..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Matn 1 (Inglizcha)</label>
                <textarea
                  value={formData.text1En}
                  onChange={(e) => setFormData({ ...formData, text1En: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Buran Consulting was founded..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Matn 2 (O'zbekcha)</label>
                <textarea
                  value={formData.text2Uz}
                  onChange={(e) => setFormData({ ...formData, text2Uz: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="2023 yil Buran Consulting..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Matn 2 (Inglizcha)</label>
                <textarea
                  value={formData.text2En}
                  onChange={(e) => setFormData({ ...formData, text2En: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="In 2023, Buran Consulting..."
                />
              </div>
            </div>
          </div>
        </Card>

        <Card delay={0.2}>
          <h2 className="text-lg font-semibold mb-4">Tugma matni</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Tugma (O'zbekcha)</label>
              <input
                type="text"
                value={formData.buttonTextUz}
                onChange={(e) => setFormData({ ...formData, buttonTextUz: e.target.value })}
                className="input"
                placeholder="Batafsil"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Tugma (Inglizcha)</label>
              <input
                type="text"
                value={formData.buttonTextEn}
                onChange={(e) => setFormData({ ...formData, buttonTextEn: e.target.value })}
                className="input"
                placeholder="Learn more"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={saveMutation.isPending}>
            Saqlash
          </Button>
        </div>
      </form>
    </div>
  );
});

