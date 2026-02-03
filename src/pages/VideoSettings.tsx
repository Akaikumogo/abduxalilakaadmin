import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { videoApi, type VideoSettings as VideoSettingsType } from '@/services/api';
import { Card, Button } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

export const VideoSettings = memo(function VideoSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<VideoSettingsType>({
    youtubeUrl: '',
    titleUz: '',
    titleEn: '',
    subtitleUz: '',
    subtitleEn: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['videoSettings'],
    queryFn: videoApi.get,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: videoApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoSettings'] });
      toast.success('Video sozlamalari saqlandi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.youtubeUrl || !formData.titleUz) {
      toast.error("YouTube URL va O'zbekcha sarlavha majburiy");
      return;
    }

    saveMutation.mutate(formData);
  }, [formData, saveMutation]);

  const embedUrl = useMemo(() => {
    const url = formData.youtubeUrl;
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }, [formData.youtubeUrl]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-dark-900">Video sozlamalari</h1>
        <p className="text-dark-500 mt-1">"Watch a short video" bo'limini boshqaring</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card delay={0.1}>
          <h2 className="text-lg font-semibold mb-4">Video ma'lumotlari</h2>
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
                placeholder="https://www.youtube.com/watch?v=... yoki https://youtu.be/..."
                required
              />
              <p className="text-xs text-dark-400 mt-1">
                YouTube video URL'ini kiriting (watch yoki youtu.be formatda)
              </p>
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
                  placeholder="Qisqa video ko'ring"
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
                  placeholder="Watch a short video"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Quyi sarlavha (O'zbekcha)</label>
                <input
                  type="text"
                  value={formData.subtitleUz}
                  onChange={(e) => setFormData({ ...formData, subtitleUz: e.target.value })}
                  className="input"
                  placeholder="Bizning hikoyalarimiz..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Quyi sarlavha (Inglizcha)</label>
                <input
                  type="text"
                  value={formData.subtitleEn}
                  onChange={(e) => setFormData({ ...formData, subtitleEn: e.target.value })}
                  className="input"
                  placeholder="Our success stories..."
                />
              </div>
            </div>

            <Button type="submit" isLoading={saveMutation.isPending}>
              Saqlash
            </Button>
          </form>
        </Card>

        {/* Preview */}
        <Card delay={0.2}>
          <h2 className="text-lg font-semibold mb-4">Ko'rinishi</h2>
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-dark-900">
                {formData.titleUz || 'Sarlavha'}
              </h3>
              {formData.subtitleUz && (
                <p className="text-dark-500 text-sm mt-1">{formData.subtitleUz}</p>
              )}
            </div>
            
            {embedUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-video rounded-xl overflow-hidden bg-dark-100 shadow-soft"
              >
                <iframe
                  src={embedUrl}
                  title="Video preview"
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </motion.div>
            ) : (
              <div className="aspect-video rounded-xl bg-dark-100 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-12 h-12 text-dark-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-dark-400">YouTube URL kiriting</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
});
