import { useState, useEffect, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { contactApi, type ContactSettings as ContactSettingsType } from '@/services/api';
import { Card, Button } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

export const ContactSettings = memo(function ContactSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ContactSettingsType>({
    titleUz: '',
    titleEn: '',
    addressUz: '',
    addressEn: '',
    landmarkUz: '',
    landmarkEn: '',
    metroUz: '',
    metroEn: '',
    phone: '',
    email: '',
    mapUrl: '',
    mapLink: '',
    telegram: '',
    instagram: '',
    youtube: '',
    workingHoursUz: '',
    workingHoursEn: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['contactSettings'],
    queryFn: contactApi.get,
  });

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: contactApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactSettings'] });
      toast.success('Manzil sozlamalari saqlandi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleUz || !formData.addressUz || !formData.phone) {
      toast.error('Sarlavha, manzil va telefon majburiy');
      return;
    }
    saveMutation.mutate(formData);
  }, [formData, saveMutation]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-dark-900">Manzil sozlamalari</h1>
        <p className="text-dark-500 mt-1">"Bizning manzil" bo'limini va aloqa ma'lumotlarini boshqaring</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
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
                placeholder="Bizning manzil"
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
                placeholder="Our Address"
              />
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card delay={0.15}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📍</span> Manzil
          </h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  To'liq manzil (O'zbekcha) <span className="text-accent-500">*</span>
                </label>
                <textarea
                  value={formData.addressUz}
                  onChange={(e) => setFormData({ ...formData, addressUz: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Toshkent shahri, Mirzo Ulug'bek tumani..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">To'liq manzil (Inglizcha)</label>
                <textarea
                  value={formData.addressEn}
                  onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Tashkent city, Mirzo Ulug'bek district..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Mo'ljal (O'zbekcha)</label>
                <input
                  type="text"
                  value={formData.landmarkUz}
                  onChange={(e) => setFormData({ ...formData, landmarkUz: e.target.value })}
                  className="input"
                  placeholder="Bo'z bozor, British School yonida"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Mo'ljal (Inglizcha)</label>
                <input
                  type="text"
                  value={formData.landmarkEn}
                  onChange={(e) => setFormData({ ...formData, landmarkEn: e.target.value })}
                  className="input"
                  placeholder="Near Bo'z bazaar, British School"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Metro (O'zbekcha)</label>
                <input
                  type="text"
                  value={formData.metroUz}
                  onChange={(e) => setFormData({ ...formData, metroUz: e.target.value })}
                  className="input"
                  placeholder="Buyuk ipak yo'li metrosidan 5-6 minut"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Metro (Inglizcha)</label>
                <input
                  type="text"
                  value={formData.metroEn}
                  onChange={(e) => setFormData({ ...formData, metroEn: e.target.value })}
                  className="input"
                  placeholder="5-6 minutes from Buyuk Ipak Yoli Metro"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Info */}
        <Card delay={0.2}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📞</span> Aloqa ma'lumotlari
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Telefon <span className="text-accent-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="+998712000811"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="info@buranconsulting.uz"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Ish vaqti (O'zbekcha)</label>
              <input
                type="text"
                value={formData.workingHoursUz}
                onChange={(e) => setFormData({ ...formData, workingHoursUz: e.target.value })}
                className="input"
                placeholder="Dushanba - Shanba: 9:00 - 18:00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Ish vaqti (Inglizcha)</label>
              <input
                type="text"
                value={formData.workingHoursEn}
                onChange={(e) => setFormData({ ...formData, workingHoursEn: e.target.value })}
                className="input"
                placeholder="Monday - Saturday: 9:00 AM - 6:00 PM"
              />
            </div>
          </div>
        </Card>

        {/* Social Media */}
        <Card delay={0.25}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🌐</span> Ijtimoiy tarmoqlar
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Telegram</label>
              <input
                type="text"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                className="input"
                placeholder="https://t.me/buranconsulting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Instagram</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="input"
                placeholder="https://instagram.com/buranconsulting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">YouTube</label>
              <input
                type="text"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                className="input"
                placeholder="https://youtube.com/@buranconsulting"
              />
            </div>
          </div>
        </Card>

        {/* Map */}
        <Card delay={0.3}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🗺️</span> Xarita
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Xarita embed URL</label>
              <input
                type="text"
                value={formData.mapUrl}
                onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                className="input"
                placeholder="https://yandex.uz/map-widget/v1/?um=..."
              />
              <p className="text-xs text-dark-400 mt-1">Yandex Maps yoki Google Maps'dan embed URL'ni nusxalang</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Xarita havolasi</label>
              <input
                type="text"
                value={formData.mapLink}
                onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                className="input"
                placeholder="https://yandex.uz/maps/-/CDaJrW~R"
              />
            </div>

            {formData.mapUrl && (
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Ko'rinishi</label>
                <div className="aspect-video rounded-xl overflow-hidden bg-dark-100 shadow-soft">
                  <iframe
                    src={formData.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        <Button type="submit" isLoading={saveMutation.isPending} className="w-full sm:w-auto">
          Saqlash
        </Button>
      </form>
    </div>
  );
});
