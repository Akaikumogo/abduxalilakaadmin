import { useState, memo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '@/services/api';
import { Card, Button } from '@/components/ui';

export const Settings = memo(function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: () => toast.error("Joriy parol noto'g'ri"),
  });

  const handlePasswordChange = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Parollar mos kelmadi');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    passwordMutation.mutate();
  }, [newPassword, confirmPassword, passwordMutation]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-dark-900">Sozlamalar</h1>
        <p className="text-dark-500 mt-1">Akkaunt va tizim sozlamalari</p>
      </motion.div>

      {/* Change Password */}
      <Card delay={0.1} className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary-100 rounded-xl">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Parolni o'zgartirish</h2>
            <p className="text-sm text-dark-500">Akkaunt xavfsizligini ta'minlang</p>
          </div>
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Joriy parol</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Yangi parol</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="text-xs text-dark-400 mt-1">Kamida 6 ta belgi</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Yangi parolni tasdiqlang</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPasswords"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="showPasswords" className="text-sm text-dark-600">
              Parollarni ko'rsatish
            </label>
          </div>

          <Button type="submit" isLoading={passwordMutation.isPending}>
            Parolni o'zgartirish
          </Button>
        </form>
      </Card>

      {/* Info */}
      <Card delay={0.2} className="max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-dark-100 rounded-xl">
            <svg className="w-6 h-6 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Tizim ma'lumotlari</h2>
            <p className="text-sm text-dark-500">Admin panel versiyasi va sozlamalari</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-dark-100">
            <span className="text-dark-500">Versiya</span>
            <span className="font-medium text-dark-900">2.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dark-100">
            <span className="text-dark-500">Framework</span>
            <span className="font-medium text-dark-900">React 18 + Vite</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-dark-500">UI Library</span>
            <span className="font-medium text-dark-900">Tailwind CSS + Framer Motion</span>
          </div>
        </div>
      </Card>
    </div>
  );
});
